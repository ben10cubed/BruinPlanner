import { getTable } from "../utils/getTable.js";
import { runAndSave } from "../utils/dbUtils.js";

/* ===========================================================
   CREATE OR UPDATE SUBJECT ENTRY
   subjectData must be: [subjectID, subjectName]
   =========================================================== */
export async function createSubjectEntry(db, subjectData) {
  const sql = `
    INSERT INTO subjectData (subjectID, subjectName)
    VALUES (?, ?)
    ON CONFLICT(subjectID)
    DO UPDATE SET subjectName = excluded.subjectName;
  `;

  await runAndSave(db, sql, subjectData);
}


/* ===========================================================
   GET ALL SUBJECTS
   Returns: [{ subjectID, subjectName }]
   =========================================================== */
export function getSubjects(db) {
  const stmt = db.prepare(`
    SELECT subjectID, subjectName
    FROM subjectData
    ORDER BY subjectID;
  `);
  return getTable(stmt);
}


/* ===========================================================
   CHECK IF SUBJECT EXISTS
   Returns: true / false
   =========================================================== */
export function subjectExists(db, subjectID) {
  const stmt = db.prepare(`
    SELECT 1
    FROM subjectData
    WHERE subjectID = ?
    LIMIT 1;
  `);

  stmt.bind([subjectID]);
  return getTable(stmt).length > 0;
}


/* ===========================================================
   SEARCH SUBJECTS BY PREFIX
   Returns all subjects whose ID starts with searchTerm
   =========================================================== */
export function searchSubjectArea(db, searchTerm) {
  const stmt = db.prepare(`
    SELECT subjectID, subjectName
    FROM subjectData
    WHERE subjectID LIKE ?
    ORDER BY subjectID;
  `);

  stmt.bind([`${searchTerm}%`]);
  return getTable(stmt);
}
