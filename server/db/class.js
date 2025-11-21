import { getTable } from "../utils/getTable.js";

// Insert or update a class entry
export function createClassEntry(db, classData) {
  db.run(`INSERT INTO classData (subjectID, classID, className) VALUES (?, ?, ?)
        ON CONFLICT(subjectID, classID)
        DO UPDATE SET
        className = excluded.className,
        timeStamp = excluded.timeStamp
        WHERE classData.timeStamp != excluded.timeStamp;`, classData);
}

// Get all classes for a subject
export function getClasses(db, subjectID) {
  const stmt = db.prepare(`
    SELECT * FROM classData
    WHERE subjectID = '${subjectID}'
    ORDER BY classID;
  `);
  return getTable(stmt);
}

export function getClassEntries(db, subjectID, classID) {
    const stmt = db.prepare(`SELECT enroll, sectionID, status, waitlist, info, day, time, location, units, instructor FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}';`);
    const results = getTable(stmt);
    return results;
}

export function classExists(db, subjectID, classID) {
  const stmt = db.prepare(`
    SELECT 1 FROM classData
    WHERE subjectID='${subjectID}'
      AND classID='${classID}'
    LIMIT 1;
  `);
  return getTable(stmt).length > 0;
}


