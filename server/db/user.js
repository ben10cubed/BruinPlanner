import { getTable } from "../utils/getTable.js";

// Insert user schedule
export async function insertUserSchedule(db, userID, canonicalHash, ciphertext, iv, tag, name) {
  await db.execute({
    sql: `INSERT INTO userSchedules
          (userID, canonicalHash, ciphertext, iv, tag, name)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [userID, canonicalHash, ciphertext, iv, tag, name],
  });
}

// Check if canonicalHash exists for this user
export async function userScheduleExists(db, userID, canonicalHash) {
  const result = await db.execute({
    sql: "SELECT 1 FROM userSchedules WHERE userID = ? AND canonicalHash = ? LIMIT 1",
    args: [userID, canonicalHash],
  });
  return result.rows.length > 0;
}

// Load all user schedules (encrypted rows)
export async function loadUserSchedules(db, userID) {
  const result = await db.execute({
    sql: "SELECT ciphertext, iv, tag, name FROM userSchedules WHERE userID = ?",
    args: [userID],
  });
  return getTable(result);
}

// Delete schedule by name (names are unique per user)
export async function deleteUserScheduleByName(db, userID, name) {
  await db.execute({
    sql: "DELETE FROM userSchedules WHERE userID = ? AND name = ?",
    args: [userID, name],
  });
}
