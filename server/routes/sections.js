import express from "express";
import { subjectExists } from "../db/subject.js";
import { classExists } from "../db/class.js";
import { getSectionAll } from "../db/section.js";

export default function sectionRoute(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const { subjectID, classID, sectionID } = req.query;

    if (!subjectID || !classID || !sectionID) {
      return res.status(400).json({
        error: "Missing required parameters: subjectID, classID, sectionID",
      });
    }

    if (!subjectExists(db, subjectID)) {
      return res.status(400).json({
        error: `Subject '${subjectID}' does not exist.`,
      });
    }

    if (!classExists(db, subjectID, classID)) {
      return res.status(400).json({
        error: `Class '${subjectID} ${classID}' does not exist.`,
      });
    }

    getSectionAll(db, subjectID, classID, sectionID, (err, row) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!row) {
        return res.status(404).json({
          error: `Section '${sectionID}' not found for ${subjectID} ${classID}`,
        });
      }

      console.log("Fetched section row:", row);
      return res.json(row);
    });
  });

  return router;
}
