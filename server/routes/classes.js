import express from "express";
import { getClasses, createClassEntry } from "../db/class.js";
import { getClassID } from "../scrapers/classes.js";
import { subjectExists  } from "../db/subject.js";

export default function classesRoute(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const subject = req.query.subject;
    const term = "26W";

    if (!subject)
      return res.status(400).json({ error: "Missing 'subject' parameter." });

    try {
      //Validate subject exists in the DB
      if (!subjectExists(db, subject)) {
        return res.status(400).json({
          error: `Subject '${subject}' does not exist. Either fetch subjects, or invalid ID`
        });
      }

      //Check if classes for subject already cached
      const stored = getClasses(db, subject);

      if (stored.length === 0) {
        console.log(`No cached classes → scraping UCLA for ${subject}`);

        const scraped = await getClassID(term, subject);

        // 3️⃣ Insert scraped classes
        scraped.forEach((c) =>
            createClassEntry(db, [
                subject,
                c.classID,
                c.className
            ])
        );

        return res.json(scraped);
      } //To update, we can add an else statement here and check time.

      //Return cached
      console.log(`Returning cached classes for ${subject}`);
      return res.json(stored);

    } catch (err) {
      console.error("Error in /api/classes:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
