import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";

// -------------------------------------------------------------
// Resolve correct absolute path for database file
// -------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB stored here: server/sql/database.sqlite
const DB_FILE = path.resolve(__dirname, "../sql/database.sqlite");


// -------------------------------------------------------------
// Initialize DB (load existing or create new)
// -------------------------------------------------------------
export async function initDB() {
  const SQL = await initSqlJs();

  let db;

  if (fs.existsSync(DB_FILE)) {
    // Load existing DB
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
    console.log("[DB] Loaded existing database:", DB_FILE);
  } else {
    // Create new empty DB
    db = new SQL.Database();
    console.log("[DB] Created new in-memory database (will save on first write).");
  }

  // -------------------------------------------------------------
  // Create tables (safe with IF NOT EXISTS)
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // Allows MULTIPLE schedules per user
  // -------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS userSchedules (
      userID TEXT,
      canonicalHash TEXT,
      ciphertext TEXT,
      iv TEXT,
      tag TEXT,
      name TEXT,
      PRIMARY KEY (userID, canonicalHash),
      UNIQUE(userID, name)
    );
  `);


  // -------------------------------------------------------------
  // Auto-save helper attached to DB instance
  // -------------------------------------------------------------
  db.saveToDisk = function () {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
    console.log("[DB] Saved to:", DB_FILE);
  };

  return db;
}
