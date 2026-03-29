import { getTable } from "../utils/getTable.js";

/* ===========================================================
   INSERT OR UPDATE CLASS ENTRY
   classData must be: [subjectID, classID, className]
   =========================================================== */
export async function createClassEntry(db, classData) {
  await db.execute({
    sql: `INSERT INTO classData (subjectID, classID, className)
          VALUES (?, ?, ?)
          ON CONFLICT(subjectID, classID)
          DO UPDATE SET className = excluded.className`,
    args: classData,
  });
}


/* ===========================================================
   GET ALL CLASSES UNDER A SUBJECT
   Returns: [{ subjectID, classID, className }, ...]
   =========================================================== */
export async function getClasses(db, subjectID) {
  const result = await db.execute({
    sql: `SELECT subjectID, classID, className
          FROM classData
          WHERE subjectID = ?
          ORDER BY classID`,
    args: [subjectID],
  });
  return getTable(result);
}


/* ===========================================================
   GET CLASS NAME FOR (subjectID, classID)
   Returns: [{ className }] or []
   =========================================================== */
export async function getClassName(db, subjectID, classID) {
  const result = await db.execute({
    sql: `SELECT className
          FROM classData
          WHERE subjectID = ? AND classID = ?
          LIMIT 1`,
    args: [subjectID, classID],
  });
  return getTable(result);
}


/* ===========================================================
   GET ALL SECTION ROWS FOR GIVEN CLASS
   Returns rows from sectionData
   =========================================================== */
export async function getClassEntries(db, subjectID, classID) {
  const result = await db.execute({
    sql: `SELECT enroll, sectionID, status, waitlist,
                 info, day, time, location, units, instructor
          FROM sectionData
          WHERE subjectID = ? AND classID = ?
          ORDER BY sectionID`,
    args: [subjectID, classID],
  });
  return getTable(result);
}


/* ===========================================================
   CHECK IF CLASS EXISTS
   Returns true/false
   =========================================================== */
export async function classExists(db, subjectID, classID) {
  const result = await db.execute({
    sql: `SELECT 1
          FROM classData
          WHERE subjectID = ? AND classID = ?
          LIMIT 1`,
    args: [subjectID, classID],
  });
  return result.rows.length > 0;
}
