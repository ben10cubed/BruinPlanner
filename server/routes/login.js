import express from "express";
import { compareLoginData } from "../db/login.js";

export default function loginRoute(db) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const { username, password } = req.body;
    try {
      // result will be 0 (success), -1 (incorrect user), or -2 (wrong password)
      const result = await compareLoginData(db, username, password);

      if (result === 0) {
        // Success
        res.status(200).json({ message: "Login successful" });
      } else if (result === -1) {
        // Fail (User not found)
        res.status(400).json({ error: "User does not exist" });
      }
      else if (result === -2) {
        // Fail (Wrong password or user not found)
        res.status(401).json({ error: "Incorrect Password" });
      }
      else if (result === -3) {
        res.status(400).json({ error: "Error in login comparison" });
      }
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
