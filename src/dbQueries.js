import initSqlJs from "sql.js";


export function initDB() {
    return initSqlJs().then(SQL => {
        const db = new SQL.Database();

        //New Table for subject Data, subjectID and subjectName; subjectID is primary key
        db.run(`CREATE TABLE IF NOT EXISTS subjectData (
            subjectID TEXT PRIMARY KEY,
            subjectName TEXT
        );`);


        //We will likely have to change this eventually.
        db.run(`CREATE TABLE IF NOT EXISTS classData (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            instructor TEXT);`);
        return db;
    });
}

//Separate entry functions for different types of data
export function createSubjectEntry(db, subjectData) {
    db.run(`INSERT INTO subjectData (subjectID, subjectName) VALUES (?, ?);`, subjectData);
}

//Original Xavier function renamed from createEntry to createClassEntry
export function createClassEntry(db, classData) {
    db.run(`INSERT INTO classData (enroll, section, status, avail, waitlist, info, day, time, location, units, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, classData);
}

export function getAllEntries(db) {

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
