import { getTable } from "../utils/getTable.js";

// Old version. Revert to this if bugged
export function createSectionEntry(db, sectionData) {
    db.run(`INSERT INTO sectionData (subjectID, classID, enroll, sectionID, status, waitlist, info, day, time, location, units, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(subjectID, classID, sectionID)
            DO UPDATE SET
            enroll = excluded.enroll,
            status = excluded.status,
            waitlist = excluded.waitlist,
            info = excluded.info,
            day = excluded.day,
            time = excluded.time,
            location = excluded.location,
            units = excluded.units,
            instructor = excluded.instructor;`, sectionData);
}

// Return all sectionIDs for a specific subjectID and classID
export function getSections(db, subjectID, classID){
    const stmt = db.prepare(`SELECT sectionID FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}';`);
    const results = getTable(stmt);
    return results;
}

//returns whether a section has already been stored in sectionData table
export function sectionExists(db, subjectID, classID, sectionID) {
    const stmt = db.prepare(
        `SELECT 1 FROM sectionData
         WHERE subjectID = ? AND classID = ? AND sectionID = ?
         LIMIT 1`
    );
    stmt.bind([subjectID, classID, sectionID]);
    const exists = stmt.step(); // Returns true if a row exists
    stmt.free();
    return exists;
}

//Updates if already exists, otherwise inserts.
export function upsertSectionEntry(db, sectionData) {
  const sql = `
    INSERT INTO sectionData (
      subjectID,
      classID,
      enroll,
      sectionID,
      status,
      waitlist,
      info,
      day,
      time,
      location,
      units,
      instructor
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

  db.run(sql, sectionData, (err) => {
    if (err) {
      console.error("upsertSectionEntry error:", err);
    }
  });
}

function getSingleSectionEntry(stmt, subjectID, classID, sectionID){
    const result = stmt.get(subjectID, classID, sectionID)[0];
    stmt.free();
    return result;
}

export function getSectionAvail(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT status FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    let statusCol = getSingleSectionEntry(stmt, subjectID, classID, sectionID);
    if(statusCol){
        let avail = statusCol.split('|');
        switch(avail[0]){
            case "Open":
                return 'O';
            case "Closed":
                return 'C';
            case "Cancelled":
                return 'X'
            case "Waitlist":
                return 'W'
            case "Tentative":
                return 'T';
            case "Suspended":
                return 'S';
            default:
                return "Unknown Avail";
        }
    }
    return "";
}

// Return day for a specific section
export function getSectionDay(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT day FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
}

// Return time for a specific section
export function getSectionTime(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT time FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
}
