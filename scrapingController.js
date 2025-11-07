import { readFileSync } from "node:fs";

import { getSubjectID } from "./getSubjectID.js";
import { getClassID } from "./getClassID.js";
import { getClassData } from "./getClassData.js";
import { initDB, createClassEntry, createSubjectEntry, getAllEntries }from "./dbQueries.js";

async function main() {
    // Temporarily read from "sampleCourseHTML.txt"
    // When the getHTML function is up in js, pipe that into here instead

    //Scrapes all of subject IDs
    const subjectID = await getSubjectID("26W");

    //For each subject ID, scrape class ID.
    //After some more testing, appears to work fine.
    //In case anything break/doesn't work as intended/classes missing, please inform Ben.
    for (let i = 0; i < subjectID.length; i++) {
      await getClassID("26W", subjectID[i].value);
    }

    //Work in progress TODO;
    const classHTML = readFileSync('sampleCourseHTML.txt', 'utf8');
    console.log("Class Data Retrieved");
    
    const allClassData = await getClassData(classHTML);

    // Initialize DB and input data
    initDB().then(db => {
        for (let i=0; i<subjectID.length; i++) {
            createSubjectEntry(db, [subjectID[i].value, subjectID[i].label]);
        }
        for (let i = 0; i < allClassData.length; i++) {
            createClassEntry(db, allClassData[i]);
        }
        console.log("Data input into database.");
        getAllEntries(db);
    });
}

main();