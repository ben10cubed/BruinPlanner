import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { getSchedules } from "./getSchedules.js"; // adjust path if needed

export async function testSchedules(term = "26W") {
    // Initialize SQL.js
    const SQL = await initSqlJs({
        locateFile: file => path.resolve("./node_modules/sql.js/dist/sql-wasm.wasm")
    });

    // Load database file
    const fileBuffer = fs.readFileSync("Math.db");
    const db = new SQL.Database(fileBuffer);

    console.log("\nFetching schedules...\n");

    const courses = [
        ['MATH', '31A'],
        ['MATH', '32A'],
        ['MATH', '131BH']
    ];

    // Get schedules
    const schedules = await getSchedules(term, courses, db);

    console.log("Possible schedules:\n");
    for (let schedule of schedules) {
        console.log(schedule);
    }

    console.log("Done.");
}

// Example usage:
if (process.argv[1].endsWith("testGetSchedules.js")) {
    testSchedules().catch(err => console.error(err));
}

