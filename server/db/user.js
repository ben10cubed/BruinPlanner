// db/users.js

// Insert user schedule
export function insertUserSchedule(db, userID, canonicalHash, ciphertext, iv, tag, name) {
  const stmt = db.prepare(`
    INSERT INTO userSchedules
    (userID, canonicalHash, ciphertext, iv, tag, name)
    VALUES (?, ?, ?, ?, ?, ?);
  `);

  stmt.bind([userID, canonicalHash, ciphertext, iv, tag, name]);
  stmt.step();
  stmt.free();
}

// Check if canonicalHash exists for this user
export function userScheduleExists(db, userID, canonicalHash) {
  const stmt = db.prepare(`
    SELECT 1 FROM userSchedules
    WHERE userID = ? AND canonicalHash = ?
    LIMIT 1;
  `);

  stmt.bind([userID, canonicalHash]);
  const exists = stmt.step();  // true if a row exists
  stmt.free();
  return exists;
}

// Load all user schedules (encrypted rows)
export function loadUserSchedules(db, userID) {
  const stmt = db.prepare(`
    SELECT ciphertext, iv, tag, name
    FROM userSchedules
    WHERE userID = ?;
  `);

  stmt.bind([userID]);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }

  stmt.free();
  return rows;
}

// Delete schedule by name (names are unique per user)
export function deleteUserScheduleByName(db, userID, name) {
  const stmt = db.prepare(`
    DELETE FROM userSchedules
    WHERE userID = ? AND name = ?;
  `);

  stmt.bind([userID, name]);
  stmt.step();
  stmt.free();
}

// Bugged, don't use.
export function userNameExists(db, userID, name) {
  const stmt = db.prepare(`
    SELECT 1 FROM userSchedules WHERE userID=? AND name=? LIMIT 1;
  `);

  stmt.bind([userID, name]);
  const row = stmt.get();
  stmt.free();

  return row && Object.keys(row).length > 0;
}
