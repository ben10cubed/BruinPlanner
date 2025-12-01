// routes/users.js
import express from "express";
import crypto from "crypto";
import { getSectionAll } from "../db/section.js";

import {
  insertUserSchedule,
  userScheduleExists,
  loadUserSchedules,
  deleteUserScheduleByName,
  userNameExists
} from "../db/user.js";

export default function usersRoute(db) {
  const router = express.Router();

  // AES-256 key (base64 → 32 bytes)
  const KEY = Buffer.from(
    "5wYAm0tfNh/aheCbV6KeqzEGTY2DZ2tmU366vosugek=",
    "base64"
  );
  const ALGO = "aes-256-gcm";

  // --------------------------------------------------------------------------
  // Encryption helpers
  // --------------------------------------------------------------------------
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

  // Hash for duplicate detection
  function hashCanonical(canonical) {
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }

  // --------------------------------------------------------------------------
  // Canonicalize + Validate (synchronous for sql.js)
  // --------------------------------------------------------------------------
  function canonicalizeAndValidate(schedule, db) {
    const keys = Object.keys(schedule).sort();
    const parts = [];

    if (keys.length === 0) {
      return { valid: false, canonical: null };
    }

    for (const key of keys) {
      const sections = schedule[key].slice().sort();

      for (const sec of sections) {
        const [subjectID, classID] = key.split("+");
        const sectionID = sec;

        let row = null;
        getSectionAll(db, subjectID, classID, sectionID, (err, result) => {
          if (!err) row = result;
        });

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

  // --------------------------------------------------------------------------
  // Convert canonical string → schedule object
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // POST /users/save
  // Body: { userID, schedule, name }
  // --------------------------------------------------------------------------
  router.post("/save", (req, res) => {
    try {
      const { userID, schedule, name } = req.body;

      // Always convert userID to string (DB stores TEXT)
      const userIDStr = String(userID);

      if (!userIDStr || !schedule || !name) {
        return res.status(400).json({
          success: false,
          duplicate: false,
          nameConflict: false,
        });
      }

      // --------------------------------------------------------
      // 1. NAME CONFLICT CHECK
      // --------------------------------------------------------

      // For some reason, userNameExists doesn't work.
      // So now I just manually check
      const savedSchedules = loadUserSchedules(db, userIDStr);

      // Check name conflict manually
      const nameTaken = savedSchedules.some(row => row.name === name);

      if (nameTaken) {
        return res.json({
          success: false,
          duplicate: false,
          nameConflict: true
        });
      }


      // --------------------------------------------------------
      // 2. Canonicalize + Validate
      // --------------------------------------------------------
      const result = canonicalizeAndValidate(schedule, db);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          duplicate: false,
          nameConflict: false,
        });
      }

      const canonical = result.canonical;
      const hash = hashCanonical(canonical);

      // --------------------------------------------------------
      // 3. DUPLICATE SCHEDULE CHECK
      // --------------------------------------------------------
      const dup = userScheduleExists(db, userIDStr, hash);

      if (dup) {
        return res.json({
          success: true,
          duplicate: true,
          nameConflict: false,
        });
      }

      // --------------------------------------------------------
      // 4. Encrypt and save
      // --------------------------------------------------------
      const enc = encrypt(canonical);

      insertUserSchedule(
        db,
        userIDStr,
        hash,
        enc.ciphertext,
        enc.iv,
        enc.tag,
        name
      );

      db.saveToDisk();

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

  // --------------------------------------------------------------------------
  // POST /users/load
  // Body: { userID }
  // Returns: [{ name, schedule }]
  // --------------------------------------------------------------------------
  router.post("/load", (req, res) => {
    try {
      const { userID } = req.body;
      const userIDStr = String(userID);

      if (!userIDStr) {
        return res.status(400).json({
          success: false,
          schedules: [],
        });
      }

      const rows = loadUserSchedules(db, userIDStr);

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

  // --------------------------------------------------------------------------
  // POST /users/delete
  // Body: { userID, name }
  // --------------------------------------------------------------------------
  router.post("/delete", (req, res) => {
    try {
      const { userID, name } = req.body;
      const userIDStr = String(userID);

      if (!userIDStr || !name) {
        return res.status(400).json({ success: false });
      }

      deleteUserScheduleByName(db, userIDStr, name);
      db.saveToDisk();

      return res.json({ success: true });
    } catch (err) {
      console.error("Error in /users/delete:", err);
      return res.status(500).json({ success: false });
    }
  });

  return router;
}
