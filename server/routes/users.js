// routes/users.js
import express from "express";
import crypto from "crypto";
import { getSectionAll } from "../db/section.js";

import {
  insertUserSchedule,
  userScheduleExists,
  loadUserSchedules,
  deleteUserScheduleByName
} from "../db/user.js";
/*
A special note on canonicalization:
    - I needed a way to ensure that schedules do not duplicate for each user.
    - To do this, I created a "canonical" string representation of each schedule.
    - The canonical string is made by sorting the classes and sections in a
      deterministic order, and joining them with special characters such as + and |.
    - This canonical string is then hashed using SHA-256, and the hash is stored in the DB.
    - When a user attempts to save a schedule, the server canonicalizes the schedule,
      hashes it, and checks if that hash already exists for that user.
    - If it does, the server rejects the save as a duplicate.
    - This method ensures that even if the order of classes/sections differs,
      the same schedule will produce the same canonical string and hash. (Mainly achieved through sorting before joining.)
  
For example: Math 32A : [Lec 2, Dis 2A] and COM SCI 35L [Lec 1, Dis 1C]:
    - Canonical string: "COM SCI+35L+Dis 1C|COM SCI+35L+Lec 1|Math+32A+Dis 2A|Math+32A+Lec 2"
    - Regardless of which order the classes are passed in, this is the only possible output.
*/

export default function usersRoute(db) {
  const router = express.Router();

  // Not secure, but don't make many other options.
  // One possible alternative is to store the key as an environment variable.
  const KEY = Buffer.from(
    "5wYAm0tfNh/aheCbV6KeqzEGTY2DZ2tmU366vosugek=",
    "base64"
  );
  const ALGO = "aes-256-gcm";

  // Encryption helpers
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

  // Canonicalize + Validate
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

  // Convert canonical string → schedule object
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

      // NAME CONFLICT CHECK
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


      // Canonicalize + Validate
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

      // DUPLICATE SCHEDULE CHECK
      const dup = userScheduleExists(db, userIDStr, hash);

      if (dup) {
        return res.json({
          success: true,
          duplicate: true,
          nameConflict: false,
        });
      }

      // Encrypt and save
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

  // POST /users/load
  // Body: { userID }
  // Returns: [{ name, schedule }]
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

  // POST /users/delete
  // Body: { userID, name }
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
