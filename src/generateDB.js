import fs from "fs";
import readline from "readline";

import { getSubjectID } from "./getSubjectID.js";
import { getClassID } from "./getClassID.js";
import { getClassData } from "./getClassData.js";
import { initDB, createSectionEntry, createSubjectEntry, getAllEntries, getClassEntries, searchSubjectArea, searchClass, getSectionDay, getSectionTime, getClasses, getSections, createClassEntry, testa, getSectionStatus, getSectionAvail } from "./dbQueries.js";
import { fetchCourse } from "./getLectures.js";
import { getSchedules } from "./getSchedules.js";

async function fetchAllSections(term, subjectID) {
    const classes = await getClassID(term, subjectID); // all classes for subject
    const db = await initDB();

    for (const course of classes) {
        const classID = course.classID;
        const className = course.className;

        // Store class info in DB
        await createClassEntry(db, [subjectID, classID, className]);

        const lectureHTML = await fetchCourse(subjectID, classID, term);
        const lectureSections = getClassData(lectureHTML, subjectID, classID);
        if(lectureHTML.includes("No results available based off your filter criteria.")) continue;

        for(let lectureSection of lectureSections) {
            await createSectionEntry(db, lectureSection);
        }

        const numLectures = lectureSections.length;

        for (let lectureNum = 1; lectureNum <= numLectures; lectureNum++) {
            console.log(`${subjectID} ${classID} ${term} ${lectureNum}`);
            
            const classHTML = await fetchCourse(subjectID, classID, term, lectureNum);
            //await new Promise(resolve => setTimeout(resolve, 100));

            if (!classHTML || classHTML.includes("No results available based off your filter criteria")) break;

            const sections = getClassData(classHTML, subjectID, classID);

            if (!sections || sections.length === 0) continue;

            for (const section of sections) {
                if (!section[3] || section[3].trim() === "") {  // sectionID is index 3
                    console.log("Skipping section with empty sectionID:", section);
                    continue;
                }

                await createSectionEntry(db, section);
            }
        }
    }

    const [subject_table, class_table, section_table] = getAllEntries(db);

    console.log("All classIDs in section table:");
    section_table.forEach(row => {
        console.log(row.classID);  // <-- key, not index
    });
    return db;
}

const term = "26W";
const subjectID = "MATH";

// helper to prompt user
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

(async () => {
    try {
        const db = await fetchAllSections(term, subjectID);

        // --- BREAKPOINT: ask user for confirmation ---
        console.log("\nData fetched. Please verify output above.\n");
        const answer = await askQuestion("Proceed to write Math.db? (Y/n): ");

        if (answer.toLowerCase() === 'n') {
            console.log("Aborted. Math.db was NOT overwritten.");
            process.exit(0);
        }

        // continue only if Y or empty
        const binaryArray = db.export();
        fs.writeFileSync("Math.db", binaryArray);

        console.log("Saved database to Math.db");

    } catch (err) {
        console.error(err);
    }
})();
