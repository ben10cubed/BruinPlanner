import express from "express";
import { subjectExists } from "../db/subject.js";
import { classExists, getClassEntries } from "../db/class.js";
import { createSectionEntry } from "../db/section.js";
import { getSectionInfo } from "../scrapers/sections.js";

export default function sectionRoute(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const subjectID = req.query.subjectID;
    const classID = req.query.classID;

    if (!subjectID || !classID)
      return res.status(400).json({ error: "Missing subject or classID." });

    try {
      // Subject must exist
      if (!subjectExists(db, subjectID))
        return res.status(400).json({ error: `Subject '${subjectID}' does not exist.` });

      // Class must exist within that subject
      if (!classExists(db, subjectID, classID))
        return res.status(400).json({ error: `Class '${subjectID} ${classID}' does not exist.` });

      // Gets all class information with subjectID classID -> Lec/Dis/Stu/...
      const cached = getClassEntries(db, subjectID, classID);

      if (cached.length > 0) {
        console.log("Returning cached sections for", subjectID, classID);
        return res.json(cached);
      }

      console.log("Scraping section info for", subjectID, classID);

      const scraped = await getSectionInfo(subjectID, classID);

      scraped.forEach(sec => {
        createSectionEntry(db, sec);
      });

      return res.json(scraped);

    } catch (err) {
      console.error("Error in /api/classInfo:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
