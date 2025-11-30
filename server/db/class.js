import { getTable } from "../utils/getTable.js";
import { runAndSave } from "../utils/dbUtils.js";

/* ===========================================================
   INSERT OR UPDATE CLASS ENTRY
   classData must be: [subjectID, classID, className]
   =========================================================== */
export async function createClassEntry(db, classData) {
  const sql = `
    INSERT INTO classData (subjectID, classID, className)
    VALUES (?, ?, ?)
    ON CONFLICT(subjectID, classID)
    DO UPDATE SET className = excluded.className;
  `;

  await runAndSave(db, sql, classData);
}


/* ===========================================================
   GET ALL CLASSES UNDER A SUBJECT
   Returns: [{ subjectID, classID, className }, ...]
   =========================================================== */
export function getClasses(db, subjectID) {
  const stmt = db.prepare(
    `SELECT subjectID, classID, className
     FROM classData
     WHERE subjectID = ?
     ORDER BY classID`
  );

  stmt.bind([subjectID]);
  return getTable(stmt);
}


/* ===========================================================
   GET CLASS NAME FOR (subjectID, classID)
   Returns: [{ className }] or []
   =========================================================== */
export function getClassName(db, subjectID, classID) {
  const stmt = db.prepare(
    `SELECT className
     FROM classData
     WHERE subjectID = ?
       AND classID = ?
     LIMIT 1`
  );

  stmt.bind([subjectID, classID]);
  return getTable(stmt);
}


/* ===========================================================
   GET ALL SECTION ROWS FOR GIVEN CLASS
   Returns rows from sectionData
   =========================================================== */
export function getClassEntries(db, subjectID, classID) {
  const stmt = db.prepare(
    `SELECT enroll, sectionID, status, waitlist,
            info, day, time, location, units, instructor
     FROM sectionData
     WHERE subjectID = ?
       AND classID = ?
     ORDER BY sectionID`
  );

  stmt.bind([subjectID, classID]);
  return getTable(stmt);
}


/* ===========================================================
   CHECK IF CLASS EXISTS
   Returns true/false
   =========================================================== */
export function classExists(db, subjectID, classID) {
  const stmt = db.prepare(
    `SELECT 1
     FROM classData
     WHERE subjectID = ?
       AND classID = ?
     LIMIT 1`
  );

  stmt.bind([subjectID, classID]);
  return getTable(stmt).length > 0;
}
