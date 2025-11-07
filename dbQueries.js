const initSqlJs = require("sql.js");

function initDB() {
    return initSqlJs().then(SQL => {
        const db = new SQL.Database();
        db.run(`CREATE TABLE IF NOT EXISTS subjectData (
            subjectID TEXT PRIMARY KEY,
            subjectName TEXT
        );`);


        db.run(`CREATE TABLE IF NOT EXISTS classData (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enroll TEXT,
            section TEXT,
            status TEXT,
            waitlist TEXT,
            info TEXT,
            day TEXT,
            time TEXT,
            location TEXT,
            units TEXT,
            instructor TEXT);`);
        return db;
    });
}

function createSubjectEntry(db, subjectData) {
    db.run(`INSERT INTO subjectData (subjectID, subjectName) VALUES (?, ?);`, subjectData);
}

function createClassEntry(db, classData) {
    db.run(`INSERT INTO classData (enroll, section, status, waitlist, info, day, time, location, units, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, classData);
}

function getAllEntries(db) {

    const subject_stmt = db.prepare("SELECT * FROM subjectData;");
    const subject_results = [];
    while (subject_stmt.step()) {
        subject_results.push(subject_stmt.getAsObject());
        console.log(subject_results[subject_results.length - 1]);
    }
    subject_stmt.free();

    const stmt = db.prepare("SELECT * FROM classData;");
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
        console.log(results[results.length - 1]);
    }
    stmt.free();
    // return results;
}

module.exports = { initDB, createClassEntry, createSubjectEntry, getAllEntries };