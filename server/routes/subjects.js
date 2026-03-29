import express from "express";
import { getSubjects, createSubjectEntry } from "../db/subject.js";
import { fetchSubjectID } from "../scrapers/subjects.js";

export default function subjectsRoute(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const term = "26S";

    try {
      const stored = await getSubjects(db);

      if (stored.length === 0) {
        console.log("DB empty → scraping UCLA...");

        const scraped = await fetchSubjectID(term);

        for (const s of scraped) {
          await createSubjectEntry(db, [s.subjectID.trim(), s.subjectName.trim()]);
        }

        return res.json(scraped);
      }

      console.log("Returning cached subjects (DB)");
      return res.json(stored);

    } catch (err) {
      console.error("Error in /api/subjects:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
