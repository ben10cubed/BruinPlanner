import bcrypt from "bcrypt";

const saltRounds = 10;

// Create a new user login
export async function createUser(db, username, password) {
  try {
    const result = await db.execute({
      sql: "SELECT username FROM loginData WHERE username = ?",
      args: [username],
    });
    if (result.rows.length > 0) {
      return -1; // Username already exists
    }
    if (password.length < 8 || username.length < 4) {
      return -2; // Invalid username or password length
    }
    const passwordHash = await bcrypt.hash(password, saltRounds);
    await db.execute({
      sql: "INSERT INTO loginData (username, passwordHash) VALUES (?, ?)",
      args: [username, passwordHash],
    });
    return 0;
  } catch (err) {
    console.error("Error creating user:", err);
    return -3; // Error in creating user
  }
}

// Compare and return if the password hash matches for a given username
export async function compareLoginData(db, username, password) {
  try {
    const result = await db.execute({
      sql: "SELECT passwordHash FROM loginData WHERE username = ?",
      args: [username],
    });
    if (result.rows.length === 0) {
      return -1; // User does not exist
    }
    const passwordHash = result.rows[0][0];
    const match = await bcrypt.compare(password, passwordHash);
    return match ? 0 : -2;
  } catch (err) {
    console.error("Error comparing login data:", err);
    return -3; // Error in comparison
  }
}
