import bcrypt from "bcrypt";

const saltRounds = 10;

// Create a new user login
export async function createUser(db, username, password) {
  try { // Check if username already exists
    const stmt = db.prepare("SELECT username FROM loginData WHERE username = ?;");
    const user = stmt.getAsObject([username]);
    if (user.username) {
      return -1; // Username already exists
    }
    else {
      // Username does not exist, create new user
      const passwordHash = await bcrypt.hash(password, saltRounds);
      db.run(`INSERT INTO loginData (username, passwordHash) VALUES (?, ?);`, [username, passwordHash]);
      return 0;
    }
  } catch (err) {
    console.error("Error creating user:", err);
    return -2; // Error in creating user
  }
}

// Compare and return if the password hash matches for a given username
export async function compareLoginData(db, username, password) {
  try {
    const stmt = db.prepare("SELECT passwordHash FROM loginData WHERE username = ?;");
    const user = stmt.getAsObject([username]);
    if (!user || typeof user.passwordHash === 'undefined'){
      return -1; // User does not exist
    } 
    const match = await bcrypt.compare(password, user.passwordHash);
    if (match) {
      return 0; // Password correct, Login successful
    }
    return -2; // Password incorrect
  } catch (err) {
    console.error("Error comparing login data:", err);
    return -3; // Error in comparison
  }
}