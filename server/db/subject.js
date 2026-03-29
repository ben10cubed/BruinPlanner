import { getTable } from "../utils/getTable.js";

/* ===========================================================
   CREATE OR UPDATE SUBJECT ENTRY
   subjectData must be: [subjectID, subjectName]
   =========================================================== */
export async function createSubjectEntry(db, subjectData) {
  await db.execute({
    sql: `INSERT INTO subjectData (subjectID, subjectName)
          VALUES (?, ?)
          ON CONFLICT(subjectID)
          DO UPDATE SET subjectName = excluded.subjectName`,
    args: subjectData,
  });
}


/* ===========================================================
   GET ALL SUBJECTS
   Returns: [{ subjectID, subjectName }]
   =========================================================== */
export async function getSubjects(db) {
  const result = await db.execute(
    "SELECT subjectID, subjectName FROM subjectData ORDER BY subjectID"
  );
  return getTable(result);
}


/* ===========================================================
   CHECK IF SUBJECT EXISTS
   Returns: true / false
   =========================================================== */
export async function subjectExists(db, subjectID) {
  const result = await db.execute({
    sql: "SELECT 1 FROM subjectData WHERE subjectID = ? LIMIT 1",
    args: [subjectID],
  });
  return result.rows.length > 0;
}


/* ===========================================================
   SEARCH SUBJECTS BY PREFIX
   Returns all subjects whose ID starts with searchTerm
   =========================================================== */
export async function searchSubjectArea(db, searchTerm) {
  const result = await db.execute({
    sql: "SELECT subjectID, subjectName FROM subjectData WHERE subjectID LIKE ? ORDER BY subjectID",
    args: [`${searchTerm}%`],
  });
  return getTable(result);
}
