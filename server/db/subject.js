import { getTable } from "../utils/getTable.js";

// Insert a subject
export function createSubjectEntry(db, subjectData) {
  db.run(
    `INSERT INTO subjectData (subjectID, subjectName)
     VALUES (?, ?);`,
    subjectData
  );
}

// Get all subjects
export function getSubjects(db) {
  const stmt = db.prepare("SELECT * FROM subjectData;");
  return getTable(stmt);
}

//Test if a subject exists. Ideally, we should never reach this stage
//We shouldn't be able to search if the ID never existed, but just in case.
export function subjectExists(db, subjectID) {
  const stmt = db.prepare(`
    SELECT 1 FROM subjectData
    WHERE subjectID = '${subjectID}'
    LIMIT 1;
  `);

  return getTable(stmt).length > 0;
}

// Search subjects by prefix (optional)
export function searchSubjectArea(db, searchTerm) {
  const stmt = db.prepare(`
    SELECT * FROM subjectData
    WHERE subjectID LIKE '${searchTerm}%';
  `);
  return getTable(stmt);
}
