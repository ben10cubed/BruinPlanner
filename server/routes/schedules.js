// schedules.js
import express from "express";
import { subjectExists } from "../db/subject.js";
import { upsertSectionEntry } from "../db/section.js";
import { getSectionInfo } from "../scrapers/sections.js";
import { classExists, getClassName } from "../db/class.js";
import { getSchedules } from "../utils/getSchedules.js";

export default function schedulesRoute(db) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const list = req.body.classes;
      const filters = req.body.filters ?? [];
      const settings = req.body.settings ?? { showWaitlist: false, showClosed: false };
      if (!Array.isArray(list)) {
        return res.status(400).json({
          error: "Expected request body of shape { classes: [...] }",
        });
      }

      const term = process.env.UCLA_TERM;

      for (const entry of list) {
        const { subjectID, classID } = entry;

        if (!subjectID || !classID) {
          return res.status(400).json({
            error: "Each entry must include both subject and classID",
            invalidEntry: entry,
          });
        }

        if (!(await subjectExists(db, subjectID))) {
          console.log("Invalid subject:", subjectID);
          return res.status(400).json({
            error: `Subject '${subjectID}' does not exist.`,
            invalidSubject: subjectID,
          });
        }

        if (!(await classExists(db, subjectID, classID))) {
          console.log("Invalid class:", classID);
          return res.status(400).json({
            error: `Class '${classID}' does not exist.`,
            invalidClass: classID,
          });
        }
      }

      for (const { subjectID, classID } of list) {
        const classNameRows = await getClassName(db, subjectID, classID);
        const scraped = await getSectionInfo(subjectID, classID, term, classNameRows[0].className);
        for (const section of scraped) {
          console.log(section);
          await upsertSectionEntry(db, section);
        }
      }

      console.log("Finished");
      return res.json(await getSchedules(db, list, term, filters, settings));

    } catch (err) {
      console.error("Error in POST /api/schedules:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
