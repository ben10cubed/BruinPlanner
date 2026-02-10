import express from "express";
import { getSubjects, createSubjectEntry } from "../db/subject.js";
import { fetchSubjectID } from "../scrapers/subjects.js";

export default function subjectsRoute(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const term = "26S";

    try {
      // Get subjects in DB
      const stored = getSubjects(db);

      // If empty → scrape UCLA → insert → return
      if (stored.length === 0) {
        console.log("DB empty → scraping UCLA...");

        const scraped = await fetchSubjectID(term);

        scraped.forEach((s) =>
          createSubjectEntry(db, [
            s.subjectID.trim(),
            s.subjectName.trim(),
          ])
        );

        return res.json(scraped);
      } //Can update here, if length != 0 based on current time and last update time.

      // Otherwise return cached subjects
      console.log("Returning cached subjects (DB)");
      return res.json(stored);

    } catch (err) {
      console.error("Error in /api/subjects:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
