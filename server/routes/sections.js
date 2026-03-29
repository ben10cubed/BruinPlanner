import express from "express";
import { subjectExists } from "../db/subject.js";
import { classExists } from "../db/class.js";
import { getSectionAll } from "../db/section.js";

export default function sectionRoute(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const { subjectID, classID, sectionID } = req.query;

    if (!subjectID || !classID || !sectionID) {
      return res.status(400).json({
        error: "Missing required parameters: subjectID, classID, sectionID",
      });
    }

    if (!(await subjectExists(db, subjectID))) {
      return res.status(400).json({
        error: `Subject '${subjectID}' does not exist.`,
      });
    }

    if (!(await classExists(db, subjectID, classID))) {
      return res.status(400).json({
        error: `Class '${subjectID} ${classID}' does not exist.`,
      });
    }

    const row = await getSectionAll(db, subjectID, classID, sectionID);

    if (!row) {
      return res.status(404).json({
        error: `Section '${sectionID}' not found for ${subjectID} ${classID}`,
      });
    }

    console.log("Fetched section row:", row);
    return res.json(row);
  });

  return router;
}
