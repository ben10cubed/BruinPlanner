import { getTable } from "../utils/getTable.js";

/* ============================================================
   CREATE OR UPDATE SECTION ENTRY
   sectionData must be: [subjectID, classID, enroll, sectionID, status, waitlist, info, day, time, location, units, instructor]
   ============================================================ */
export async function createSectionEntry(db, sectionData) {
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO sectionData (
            subjectID, classID, enroll, sectionID, status,
            waitlist, info, day, time, location, units, instructor, scraped_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            instructor = excluded.instructor,
            scraped_at = excluded.scraped_at`,
    args: [...sectionData, now],
  });
}


/* ============================================================
   IS CLASS DATA STALE?
   Returns true if the class has no scraped_at or it's older than thresholdMs
   ============================================================ */
export async function isClassStale(db, subjectID, classID, thresholdMs) {
  const result = await db.execute({
    sql: `SELECT scraped_at FROM sectionData
          WHERE subjectID = ? AND classID = ?
          ORDER BY scraped_at DESC LIMIT 1`,
    args: [subjectID, classID],
  });
  const rows = getTable(result);
  if (rows.length === 0 || !rows[0].scraped_at) return true;
  return Date.now() - new Date(rows[0].scraped_at).getTime() > thresholdMs;
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
