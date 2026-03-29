// routes/users.js
import express from "express";
import crypto from "crypto";
import { getSectionAll } from "../db/section.js";

import {
  insertUserSchedule,
  userScheduleExists,
  loadUserSchedules,
  deleteUserScheduleByName,
} from "../db/user.js";

export default function usersRoute(db) {
  const router = express.Router();

  const KEY = Buffer.from(process.env.SCHEDULE_ENCRYPTION_KEY, "base64");
  const ALGO = "aes-256-gcm";

  function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag().toString("base64");

    return { ciphertext: encrypted, iv: iv.toString("base64"), tag };
  }

  function decrypt(ciphertext, iv, tag) {
    const decipher = crypto.createDecipheriv(
      ALGO,
      KEY,
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));

    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  function hashCanonical(canonical) {
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }

  async function canonicalizeAndValidate(schedule, db) {
    const keys = Object.keys(schedule).sort();
    const parts = [];

    if (keys.length === 0) {
      return { valid: false, canonical: null };
    }

    for (const key of keys) {
      const sections = schedule[key].slice().sort();

      for (const sec of sections) {
        const [subjectID, classID] = key.split("+");

        const row = await getSectionAll(db, subjectID, classID, sec);

        if (!row) {
          return { valid: false, canonical: null };
        }

        parts.push(`${key}+${sec}`);
      }
    }

    return {
      valid: true,
      canonical: parts.join("|"),
    };
  }

  function canonicalToScheduleObject(canonical) {
    const schedule = {};
    const parts = canonical.split("|");

    for (const part of parts) {
      const [subjectID, classID, sectionID] = part.split("+");
      const key = `${subjectID}+${classID}`;
      if (!schedule[key]) schedule[key] = [];
      schedule[key].push(sectionID);
    }

    return schedule;
  }

  // POST /users/save
  // Body: { userID, schedule, name }
  router.post("/save", async (req, res) => {
    try {
      const { userID, schedule, name } = req.body;

      const userIDStr = String(userID);

      if (!userIDStr || !schedule || !name) {
        return res.status(400).json({
          success: false,
          duplicate: false,
          nameConflict: false,
        });
      }

      const savedSchedules = await loadUserSchedules(db, userIDStr);

      const nameTaken = savedSchedules.some((row) => row.name === name);

      if (nameTaken) {
        return res.json({
          success: false,
          duplicate: false,
          nameConflict: true,
        });
      }

      const result = await canonicalizeAndValidate(schedule, db);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          duplicate: false,
          nameConflict: false,
        });
      }

      const canonical = result.canonical;
      const hash = hashCanonical(canonical);

      const dup = await userScheduleExists(db, userIDStr, hash);

      if (dup) {
        return res.json({
          success: true,
          duplicate: true,
          nameConflict: false,
        });
      }

      const enc = encrypt(canonical);

      await insertUserSchedule(
        db,
        userIDStr,
        hash,
        enc.ciphertext,
        enc.iv,
        enc.tag,
        name
      );

      return res.json({
        success: true,
        duplicate: false,
        nameConflict: false,
      });

    } catch (err) {
      console.error("Error in /users/save:", err);
      return res.status(500).json({
        success: false,
        duplicate: false,
        nameConflict: false,
      });
    }
  });

  // POST /users/load
  // Body: { userID }
  // Returns: [{ name, schedule }]
  router.post("/load", async (req, res) => {
    try {
      const { userID } = req.body;
      const userIDStr = String(userID);

      if (!userIDStr) {
        return res.status(400).json({
          success: false,
          schedules: [],
        });
      }

      const rows = await loadUserSchedules(db, userIDStr);

      const schedules = rows.map((row) => ({
        name: row.name,
        schedule: canonicalToScheduleObject(
          decrypt(row.ciphertext, row.iv, row.tag)
        ),
      }));

      return res.json({
        success: true,
        schedules,
      });
    } catch (err) {
      console.error("Error in /users/load:", err);
      return res.status(500).json({
        success: false,
        schedules: [],
      });
    }
  });

  // POST /users/delete
  // Body: { userID, name }
  router.post("/delete", async (req, res) => {
    try {
      const { userID, name } = req.body;
      const userIDStr = String(userID);

      if (!userIDStr || !name) {
        return res.status(400).json({ success: false });
      }

      await deleteUserScheduleByName(db, userIDStr, name);

      return res.json({ success: true });
    } catch (err) {
      console.error("Error in /users/delete:", err);
      return res.status(500).json({ success: false });
    }
  });

  return router;
}
