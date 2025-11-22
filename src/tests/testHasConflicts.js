import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { hasConflicts } from "../getSchedules.js";

export async function testHasConflicts() {
    // Initialize SQL.js
    const SQL = await initSqlJs({
        locateFile: file => path.resolve("../node_modules/sql.js/dist/sql-wasm.wasm")
    });

    // Load database file
    const fileBuffer = fs.readFileSync("../Math.db");
    const db = new SQL.Database(fileBuffer);

    const sched = {
        'MATH+31A': [ '1', '1A' ],
        'MATH+32A': [ '1', '1B' ],
        'MATH+131BH': [ '1', '1A' ]
    };

    const result = await hasConflicts(db, sched);
    console.log(result);
}

testHasConflicts();