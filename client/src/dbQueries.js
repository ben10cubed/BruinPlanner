import initSqlJs from "sql.js";

export async function initDB() {
  const SQL = await initSqlJs({
    locateFile: () => "/sql-wasm.wasm",
  });

  let db;

  try {
    // Try to load the prebuilt DB
    const res = await fetch("/Math.db");  // or /classes.db
    if (!res.ok) throw new Error("No prebuilt DB found");

    const buf = await res.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buf));
    console.log("Loaded prebuilt DB");
  } catch (err) {
    console.warn("Falling back to empty DB:", err);
    db = new SQL.Database();
  }

  // Ensure tables exist (safe even if file already has them)
  db.run(`
    CREATE TABLE IF NOT EXISTS subjectData (
      subjectID TEXT PRIMARY KEY,
      subjectName TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS classData (
      subjectID TEXT,
      classID TEXT,
      className TEXT,
      PRIMARY KEY (subjectID, classID)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sectionData (
      subjectID TEXT,
      classID TEXT,
      enroll TEXT,
      sectionID TEXT,
      status TEXT,
      waitlist TEXT,
      info TEXT,
      day TEXT,
      time TEXT,
      location TEXT,
      units TEXT,
      instructor TEXT,
      PRIMARY KEY (subjectID, classID, sectionID)
    );
  `);

  return db;
}


//Separate entry functions for different types of data
export function createSubjectEntry(db, subjectData) {
    db.run(`INSERT INTO subjectData (subjectID, subjectName) VALUES (?, ?);`, subjectData);
}

// Create data entry into classData table
export function createClassEntry(db, classData) {
    db.run(`INSERT INTO classData (subjectID, classID, className) VALUES (?, ?, ?)
        ON CONFLICT(subjectID, classID)
        DO UPDATE SET
        className = excluded.className;`, classData);
}

// Create data entry into sectionData table
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

// Refactored helper function for retrieving table data (getter functions)
function getTable(stmt){
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
        // console.log(results[results.length - 1]);
    }
    stmt.free();
    return results;
}

// Return all entries in all tables
export function getAllEntries(db) {
    const subject_table = getTable(db.prepare("SELECT * FROM subjectData;"));
    const class_table = getTable(db.prepare("SELECT * FROM classData;"));
    const disc_table = getTable(db.prepare("SELECT * FROM sectionData;"));
    return [subject_table, class_table, disc_table];
}

export function testa(db) {
    const class_table = getTable(db.prepare("SELECT * FROM classData;"));
    return class_table;
}

// Return all entries for a specific subjectID and classID
export function getClassEntries(db, subjectID, classID) {
    const stmt = db.prepare(`SELECT enroll, sectionID, status, waitlist, info, day, time, location, units, instructor FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}';`);
    const results = getTable(stmt);
    return results;
}

// Return all classes for a specific subjectID
export function getClasses(db, subjectID){
    const stmt = db.prepare(`SELECT * FROM classData WHERE subjectID = '${subjectID}';`);
    const results = getTable(stmt);
    return results;
}

// Return all sectionIDs for a specific subjectID and classID
export function getSections(db, subjectID, classID){
    const stmt = db.prepare(`SELECT sectionID FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}';`);
    const results = getTable(stmt);
    return results;
}

// =========================================================================================================
// Search functions

// Return subjects based on complete/incomplete search term
export function searchSubjectArea(db, searchTerm) {
    const stmt = db.prepare(`SELECT * FROM subjectData WHERE subjectID LIKE '${searchTerm}%';`);
    const results = getTable(stmt);
    return results;
}

// Return subject + class ID + class name based on complete/incomplete search term
export function searchClass(db, subjectID, searchTerm) {
    const stmt = db.prepare(`SELECT * FROM classData WHERE subjectID = '${subjectID}' AND (classID LIKE '${searchTerm}%' OR className LIKE '${searchTerm}%');`);
    const results = getTable(stmt);
    return results;
}

// ==========================================================================================================
// Functions to get specific section data

// Helper function to get single section entry
function getSingleSectionEntry(stmt, subjectID, classID, sectionID){
    const result = stmt.get(subjectID, classID, sectionID)[0];
    stmt.free();
    return result;
}

// Return status (excluding availability) for a specific section
export function getSectionStatus(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT status FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    let statusCol = getSingleSectionEntry(stmt, subjectID, classID, sectionID).split('|');
    return statusCol.slice(1);
}

// Return avail for a specific section (O, C, X, W, T)
export function getSectionAvail(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT status FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    let avail = getSingleSectionEntry(stmt, subjectID, classID, sectionID).split('|');
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

// Return waitlist for a specific section
export function getSectionWaitlist(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT waitlist FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
}

// Return info for a specific section
export function getSectionInfo(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT info FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
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

// Return location for a specific section
export function getSectionLocation(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT location FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
}

// Return units for a specific section
export function getSectionUnits(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT units FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
}

// Return instructor for a specific section
export function getSectionInstructor(db, subjectID, classID, sectionID){
    const stmt = db.prepare(`SELECT instructor FROM sectionData WHERE subjectID = '${subjectID}' AND classID = '${classID}' AND sectionID = '${sectionID}';`);
    return getSingleSectionEntry(stmt, subjectID, classID, sectionID);
}