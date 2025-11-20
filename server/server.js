import express from "express";
import cors from "cors";

import { initDB } from "./db/initDB.js";
import subjectsRoute from "./routes/subjects.js";
import classesRoute from "./routes/classes.js";
import sectionRoute from "./routes/sections.js";



const app = express();
app.use(cors());
app.use(express.json());

const db = await initDB();

app.use("/api/subjects", subjectsRoute(db));
app.use("/api/classes", classesRoute(db));
app.use("/api/sections", sectionRoute(db));

app.listen(3000, () => console.log("Server running on 3000"));