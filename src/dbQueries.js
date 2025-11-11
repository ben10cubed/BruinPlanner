import initSqlJs from "sql.js";


export function initDB() {
    return initSqlJs().then(SQL => {
        const db = new SQL.Database();

        //New Table for subject Data, subjectID and subjectName; subjectID is primary key
        db.run(`CREATE TABLE IF NOT EXISTS subjectData (
            subjectID TEXT PRIMARY KEY,
            subjectName TEXT
            );`);

        //Table for subjectID and classID mapping
        db.run(`CREATE TABLE IF NOT EXISTS subjectClassID (
            subjectID TEXT,
            classID TEXT,
            className TEXT,
            PRIMARY KEY (subjectID, classID)
            );`);


        //We will likely have to change this eventually.
        db.run(`CREATE TABLE IF NOT EXISTS classData (
            subjectID TEXT,
            classID TEXT,
            enroll TEXT,
            section TEXT,
            status TEXT,
            avail TEXT,
            waitlist TEXT,
            info TEXT,
            day TEXT,
            time TEXT,
            location TEXT,
            units TEXT,
            instructor TEXT,
            PRIMARY KEY (subjectID, classID, section)
            );`);
        return db;
    });
}

//Separate entry functions for different types of data
export function createSubjectEntry(db, subjectData) {
    db.run(`INSERT INTO subjectData (subjectID, subjectName) VALUES (?, ?);`, subjectData);
}

//Original Xavier function renamed from createEntry to createClassEntry
export function createClassEntry(db, classData) {
    db.run(`INSERT INTO classData (subjectID, classID, enroll, section, status, avail, waitlist, info, day, time, location, units, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, classData);
}

// Refactored function for retrieving table data (getter functions)
function getTable(stmt){
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
        console.log(results[results.length - 1]);
    }
    stmt.free();
    return results;
}

// Return all entries in all tables
export function getAllEntries(db) {
    const subject_table = getTable(db.prepare("SELECT * FROM subjectData;"));
    const class_table = getTable(db.prepare("SELECT * FROM classData;"));
    return [subject_table, class_table];
}

// Return all entries for a specific subjectID and classID
export function getClassEntries(db, subjectID, classID) {
    const stmt = db.prepare(`SELECT enroll, section, status, avail, waitlist, info, day, time, location, units, instructor FROM classData WHERE subjectID = '${subjectID}' AND classID = '${classID}';`);
    const results = getTable(stmt);
    return results;
}

// Return subjects based on complete/incomplete search term
export function searchSubjectArea(db, searchTerm) {
    const stmt = db.prepare(`SELECT * FROM subjectData WHERE subjectID LIKE '${searchTerm}%';`);
    const results = getTable(stmt);
    return results;
}

// Return subject + class ID + class name based on complete/incomplete search term
export function searchClassID(db, subjectID, searchTerm) {
    const stmt = db.prepare(`SELECT * FROM subjectClassID WHERE subjectID = '${subjectID}' AND classID LIKE '${searchTerm}%';`);
    const results = getTable(stmt);
    return results;
}

// Return subject + class ID + class Name based on complete/incomplete class name search term
export function searchClassName(db, subjectID, searchTerm) {
    const stmt = db.prepare(`SELECT * FROM subjectClassID WHERE subjectID = '${subjectID}' AND className LIKE '${searchTerm}%';`);
    const results = getTable(stmt);
    return results;
}