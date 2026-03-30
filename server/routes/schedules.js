// schedules.js
import express from "express";
import { subjectExists } from "../db/subject.js";
import { upsertSectionEntry, isClassStale } from "../db/section.js";
import { getSectionInfo } from "../scrapers/sections.js";
import { classExists, getClassName } from "../db/class.js";
import { getSchedules } from "../utils/getSchedules.js";

const CACHE_THRESHOLD_MS  = 30 * 60 * 1000; // 30 minutes
const FORCE_REFRESH_COOLDOWN_MS = 60 * 1000; // 1 minute

// Tracks the last force refresh time per user (keyed by IP for now)
const lastForceRefresh = new Map();

export default function schedulesRoute(db) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const list = req.body.classes;
      const filters = req.body.filters ?? [];
      const settings = req.body.settings ?? { showWaitlist: false, showClosed: false };
      const forceRefresh = req.body.forceRefresh === true;

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

      // Enforce force refresh rate limit
      if (forceRefresh) {
        const clientKey = req.ip;
        const lastTime = lastForceRefresh.get(clientKey) ?? 0;
        const elapsed = Date.now() - lastTime;
        if (elapsed < FORCE_REFRESH_COOLDOWN_MS) {
          const secondsLeft = Math.ceil((FORCE_REFRESH_COOLDOWN_MS - elapsed) / 1000);
          return res.status(429).json({
            error: `Force refresh is limited to once per minute. Try again in ${secondsLeft}s.`,
          });
        }
        lastForceRefresh.set(clientKey, Date.now());
      }

      await Promise.all(list.map(async ({ subjectID, classID }) => {
        const stale = await isClassStale(db, subjectID, classID, CACHE_THRESHOLD_MS);
        if (!forceRefresh && !stale) {
          console.log(`Using cached data for ${subjectID} ${classID}`);
          return;
        }

        console.log(`Scraping ${subjectID} ${classID}${forceRefresh ? " (force refresh)" : ""}`);
        const classNameRows = await getClassName(db, subjectID, classID);
        const scraped = await getSectionInfo(subjectID, classID, term, classNameRows[0].className);
        for (const section of scraped) {
          await upsertSectionEntry(db, section);
        }
      }));

      console.log("Finished");
      return res.json(await getSchedules(db, list, term, filters, settings));

    } catch (err) {
      console.error("Error in POST /api/schedules:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
