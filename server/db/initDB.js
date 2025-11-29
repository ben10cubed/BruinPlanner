import initSqlJs from "sql.js";

export async function initDB() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();


    db.run(`CREATE TABLE IF NOT EXISTS subjectData (
        subjectID TEXT PRIMARY KEY,
        subjectName TEXT
        );`);

          //Table for subjectID and classID mapping
    db.run(`CREATE TABLE IF NOT EXISTS classData (
        subjectID TEXT,
        classID TEXT,
        className TEXT,
        PRIMARY KEY (subjectID, classID)
        );`);
  
  
          //We will likely have to change this eventually.
    db.run(`CREATE TABLE IF NOT EXISTS sectionData (
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
        );`);
  return db;
}
