import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { getSchedules } from "../getSchedules.js"; // adjust path if needed
import { initDB } from "../dbQueries.js"

export async function testSchedules(term = "26W") {
    // // Initialize SQL.js
    // const SQL = await initSqlJs({
    //     locateFile: file => path.resolve("../node_modules/sql.js/dist/sql-wasm.wasm")
    // });

    // // Load database file
    // const fileBuffer = fs.readFileSync("../Math.db");
    // const db = new SQL.Database(fileBuffer);

    const db = await initDB();

    console.log("\nFetching schedules...\n");

    const courses = [
        ['MATH', '31A'],
        ['MATH', '32A'],
        ['MATH', '115B']
    ];

    const reqs = {
        "startTime": 900,
        "endTime": 1900,
        "buffer": 10
    }

    // Get schedules
    const schedules = await getSchedules(db, courses, term, reqs);

    console.log("Possible schedules:\n");
    for (let schedule of schedules) {
        console.log(schedule);
    }

    console.log(`${schedules.length} Possibilities`);
}

// Example usage:
if (process.argv[1].endsWith("testGetSchedules.js")) {
    testSchedules().catch(err => console.error(err));
}

