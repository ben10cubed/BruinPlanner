import { getTable } from "../utils/getTable.js";

/* ============================================================
   CREATE OR UPDATE SECTION ENTRY
   sectionData must be: [subjectID, classID, enroll, sectionID, status, waitlist, info, day, time, location, units, instructor]
   ============================================================ */
export async function createSectionEntry(db, sectionData) {
  await db.execute({
    sql: `INSERT INTO sectionData (
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
            instructor = excluded.instructor`,
    args: sectionData,
  });
}


/* ============================================================
   UPSERT SECTION ENTRY
   ============================================================ */
export async function upsertSectionEntry(db, sectionData) {
  await createSectionEntry(db, sectionData);
}


/* ============================================================
   GET ALL sectionIDs for a class
   ============================================================ */
export async function getSections(db, subjectID, classID) {
  const result = await db.execute({
    sql: `SELECT sectionID
          FROM sectionData
          WHERE subjectID = ? AND classID = ?
          ORDER BY sectionID`,
    args: [subjectID, classID],
  });
  return getTable(result);
}


/* ============================================================
   GET FULL SECTION ROW
   Returns a plain object or null
   ============================================================ */
export async function getSectionAll(db, subjectID, classID, sectionID) {
  const result = await db.execute({
    sql: `SELECT *
          FROM sectionData
          WHERE subjectID = ? AND classID = ? AND sectionID = ?
          LIMIT 1`,
    args: [subjectID, classID, sectionID],
  });
  const rows = getTable(result);
  return rows.length > 0 ? rows[0] : null;
}


/* ============================================================
   DOES SECTION EXIST?
   ============================================================ */
export async function sectionExists(db, subjectID, classID, sectionID) {
  const result = await db.execute({
    sql: `SELECT 1
          FROM sectionData
          WHERE subjectID = ? AND classID = ? AND sectionID = ?
          LIMIT 1`,
    args: [subjectID, classID, sectionID],
  });
  return result.rows.length > 0;
}


/* ============================================================
   GET AVAILABILITY CODE (O, C, W, etc.)
   ============================================================ */
export async function getSectionAvail(db, subjectID, classID, sectionID) {
  const result = await db.execute({
    sql: `SELECT status
          FROM sectionData
          WHERE subjectID = ? AND classID = ? AND sectionID = ?
          LIMIT 1`,
    args: [subjectID, classID, sectionID],
  });
  const rows = getTable(result);
  const row = rows.length > 0 ? rows[0] : null;
  if (!row || !row.status) return "";

  const primary = row.status.split("|")[0];

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
export async function getSectionDay(db, subjectID, classID, sectionID) {
  const result = await db.execute({
    sql: `SELECT day
          FROM sectionData
          WHERE subjectID = ? AND classID = ? AND sectionID = ?
          LIMIT 1`,
    args: [subjectID, classID, sectionID],
  });
  const rows = getTable(result);
  return rows.length > 0 ? rows[0].day : null;
}


/* ============================================================
   GET TIME STRING
   ============================================================ */
export async function getSectionTime(db, subjectID, classID, sectionID) {
  const result = await db.execute({
    sql: `SELECT time
          FROM sectionData
          WHERE subjectID = ? AND classID = ? AND sectionID = ?
          LIMIT 1`,
    args: [subjectID, classID, sectionID],
  });
  const rows = getTable(result);
  return rows.length > 0 ? rows[0].time : null;
}
