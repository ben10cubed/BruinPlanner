const initSqlJs = require("sql.js");

function initDB() {
    return initSqlJs().then(SQL => {
        const db = new SQL.Database();
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

function createEntry(db, classData) {
    db.run(`INSERT INTO classData (enroll, section, status, waitlist, info, day, time, location, units, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, classData);
}

function getAllEntries(db) {
    const stmt = db.prepare("SELECT * FROM classData;");
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
        console.log(results[results.length - 1]);
    }
    stmt.free();
    return results;
}

module.exports = { initDB, createEntry, getAllEntries };