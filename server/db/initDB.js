import { createClient } from "@libsql/client";

export async function initDB() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subjectData (
      subjectID TEXT PRIMARY KEY,
      subjectName TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS classData (
      subjectID TEXT,
      classID TEXT,
      className TEXT,
      PRIMARY KEY (subjectID, classID)
    )
  `);

  await client.execute(`
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
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS loginData (
      username TEXT PRIMARY KEY,
      passwordHash TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS userSchedules (
      userID TEXT,
      canonicalHash TEXT,
      ciphertext TEXT,
      iv TEXT,
      tag TEXT,
      name TEXT,
      PRIMARY KEY (userID, canonicalHash),
      UNIQUE(userID, name)
    )
  `);

  console.log("[DB] Connected to Turso and ensured tables exist.");
  return client;
}
