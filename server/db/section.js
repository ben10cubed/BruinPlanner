import { getTable } from "../utils/getTable.js";
import { runAndSave } from "../utils/dbUtils.js";

/* ============================================================
   CREATE OR UPDATE SECTION ENTRY
   sectionData must be: [subjectID, classID, enroll, sectionID, status, waitlist, info, day, time, location, units, instructor]
   ============================================================ */
export async function createSectionEntry(db, sectionData) {
  const sql = `
    INSERT INTO sectionData (
      subjectID, classID, enroll, sectionID, status,
      waitlist, info, day, time, location, units, instructor
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(subjectID, classID, sectionID)
    DO UPDATE SET
      enroll     = excluded.enroll,
      status     = excluded.status,
      waitlist   = excluded.waitlist,
      info       = excluded.info,
      day        = excluded.day,
      time       = excluded.time,
      location   = excluded.location,
      units      = excluded.units,
      instructor = excluded.instructor;
  `;

  await runAndSave(db, sql, sectionData);
}


/* ============================================================
   UPSERT SECTION ENTRY
   (simple alias to same logic)
   ============================================================ */
export async function upsertSectionEntry(db, sectionData) {
  await createSectionEntry(db, sectionData);
}


/* ============================================================
   GET ALL sectionIDs for a class
   ============================================================ */
export function getSections(db, subjectID, classID) {
  const stmt = db.prepare(`
    SELECT sectionID
    FROM sectionData
    WHERE subjectID = ? AND classID = ?
    ORDER BY sectionID;
  `);

  stmt.bind([subjectID, classID]);
  return getTable(stmt);
}


/* ============================================================
   Helper: Fetch exactly one row
   ============================================================ */
function getOneRow(stmt, params = []) {
  stmt.bind(params);
  const rows = getTable(stmt);
  stmt.free();
  return rows.length > 0 ? rows[0] : null;
}


/* ============================================================
   GET FULL SECTION ROW
   Returns: a plain object representing one DB row
   ============================================================ */
export function getSectionAll(db, subjectID, classID, sectionID, callback) {
  try {
    const stmt = db.prepare(`
      SELECT *
      FROM sectionData
      WHERE subjectID = ? AND classID = ? AND sectionID = ?
      LIMIT 1;
    `);

    const row = getOneRow(stmt, [subjectID, classID, sectionID]);

    return callback(null, row); // row or null
  } catch (err) {
    console.error("DB error in getSectionAll:", err);
    return callback(err, null);
  }
}


/* ============================================================
   DOES SECTION EXIST?
   ============================================================ */
export function sectionExists(db, subjectID, classID, sectionID) {
  const stmt = db.prepare(`
    SELECT 1
    FROM sectionData
    WHERE subjectID = ? AND classID = ? AND sectionID = ?
    LIMIT 1;
  `);

  stmt.bind([subjectID, classID, sectionID]);
  const exists = stmt.step();   // true if row found
  stmt.free();
  return exists;
}


/* ============================================================
   GET AVAILABILITY CODE (O, C, W, etc.)
   ============================================================ */
export function getSectionAvail(db, subjectID, classID, sectionID) {
  const stmt = db.prepare(`
    SELECT status
    FROM sectionData
    WHERE subjectID = ? AND classID = ? AND sectionID = ?
    LIMIT 1;
  `);

  const row = getOneRow(stmt, [subjectID, classID, sectionID]);
  if (!row || !row.status) return "";

  const primary = row.status.split("|")[0]; // e.g. "Open|SomeNote"

  switch (primary) {
    case "Open":       return "O";
    case "Closed":     return "C";
    case "Cancelled":  return "X";
    case "Waitlist":   return "W";
    case "Tentative":  return "T";
    case "Suspended":  return "S";
    default:           return "Unknown Avail";
  }
}


/* ============================================================
   GET DAY STRING
   ============================================================ */
export function getSectionDay(db, subjectID, classID, sectionID) {
  const stmt = db.prepare(`
    SELECT day
    FROM sectionData
    WHERE subjectID = ? AND classID = ? AND sectionID = ?
    LIMIT 1;
  `);

  const row = getOneRow(stmt, [subjectID, classID, sectionID]);
  return row ? row.day : null;
}


/* ============================================================
   GET TIME STRING
   ============================================================ */
export function getSectionTime(db, subjectID, classID, sectionID) {
  const stmt = db.prepare(`
    SELECT time
    FROM sectionData
    WHERE subjectID = ? AND classID = ? AND sectionID = ?
    LIMIT 1;
  `);

  const row = getOneRow(stmt, [subjectID, classID, sectionID]);
  return row ? row.time : null;
}
