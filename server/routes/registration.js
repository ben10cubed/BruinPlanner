import express from "express";
import { createUser} from "../db/login.js";

export default function registrationRoute(db) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const { username, password } = req.body;

    try {
      const result = await createUser(db, username, password);

      if (result === 0) {
        res.status(200).json({ message: "User created" });
      } else if (result === -1) {
        res.status(401).json({ error: "Username already exists" });
      } else {
        res.status(400).json({ error: "Error in user creation" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
