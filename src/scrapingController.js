import { readFileSync } from "node:fs";

import { getSubjectID } from "./getSubjectID.js";
import { getClassID } from "./getClassID.js";
import { getClassData } from "./getClassData.js";
import { initDB, createClassEntry, createSubjectEntry, getAllEntries, getClassEntries, searchSubjectArea, searchClass, getSectionDay, getSectionStartTime, getSectionEndTime, getSectionAvail, getClasses, getSections, createSubjectClassEntry, testa } from "./dbQueries.js";

async function main() {
    // Temporarily read from "sampleCourseHTML.txt"
    // When the getHTML function is up in js, pipe that into here instead

    //Scrapes all of subject IDs
    const subjectID = await getSubjectID("26W");

    //For each subject ID, scrape class ID.
    //After some more testing, appears to work fine.
    //In case anything break/doesn't work as intended/classes missing, please inform Ben.
    for (let i = 0; i < subjectID.length; i++) {
    //   await getClassID("26W", subjectID[i].value);
    }

    //Work in progress TODO;
    const classHTML = readFileSync('sampleCourseHTML.txt', 'utf8');
    console.log("Class Data Retrieved");
    
    const allClassData = await getClassData(classHTML, "COM SCI", "35L");

    const csClasses = await getClassID("26W", "COM SCI");
    // Initialize DB and input data
    initDB().then(db => {
        for (let i=0; i<subjectID.length; i++) {
            createSubjectEntry(db, [subjectID[i].classID, subjectID[i].className]);
        }
        for (let i = 0; i < csClasses.length; i++) {
            createSubjectClassEntry(db, ["COM SCI", csClasses[i].classID, csClasses[i].className]);
        }
        for (let i = 0; i < allClassData.length; i++) {
            createClassEntry(db, allClassData[i]);
        }
        console.log("Data input into database.");
        console.log("Fetch all entries in all tables:");
        console.log(getAllEntries(db));
        console.log("Fetch data for COM SCI 35L sections:");
        console.log(getClassEntries(db, "COM SCI", "35L"));
        console.log("Fetch all classes for COM SCI:");
        console.log(getClasses(db, "COM SCI"));
        console.log("Fetch all sections for COM SCI 35L:");
        console.log(getSections(db, "COM SCI", "35L"));
        console.log("Search for subject ID's/Names that begin with 'COM':");
        console.log(searchSubjectArea(db, "COM"));
        console.log("Search for class ID's in COM SCI that begin with '3' (31, 32, 35L, etc.):");
        console.log(searchClass(db, "COM SCI", "3"));
        console.log("Fetch COM SCI 35L Dis 1A day: ");
        console.log(getSectionDay(db, "COM SCI", "35L", "Dis 1A"));
        console.log("Fetch COM SCI 35L Dis 1A start time: ");
        console.log(getSectionStartTime(db, "COM SCI", "35L", "Dis 1A"));
        console.log("Fetch COM SCI 35L Dis 1A end time: ");
        console.log(getSectionEndTime(db, "COM SCI", "35L", "Dis 1A"));
        console.log("Fetch COM SCI 35L Dis 1A avail: ");
        console.log(getSectionAvail(db, "COM SCI", "35L", "Dis 1A"));
        // console.log(testa(db));
    });
}

main();