import express from "express";
import cors from "cors";

import { initDB } from "./db/initDB.js";
import subjectsRoute from "./routes/subjects.js";
import classesRoute from "./routes/classes.js";
import sectionRoute from "./routes/sections.js";
import schedulesRoute from "./routes/schedules.js";
import registrationRoute from "./routes/registration.js";
import loginRoute from "./routes/login.js";
import usersRoute from "./routes/users.js";

//Initialize express app and middleware
const app = express();
app.use(cors());
app.use(express.json());

const db = await initDB();

//Route requests based on endpoint
app.use("/api/subjects", subjectsRoute(db));
app.use("/api/classes", classesRoute(db));
app.use("/api/sections", sectionRoute(db));
app.use("/api/schedules", schedulesRoute(db));
app.use("/api/registration", registrationRoute(db));
app.use("/api/login", loginRoute(db));
app.use("/api/users", usersRoute(db));

//Start server!
app.listen(3000, () => console.log("Server running on 3000"));