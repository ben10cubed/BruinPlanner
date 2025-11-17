import fs from "fs";

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

        const maxLectures = 10;

        for (let lectureNum = 1; lectureNum <= maxLectures; lectureNum++) {
            console.log(`${subjectID} ${classID} ${term} ${lectureNum}`);

            const lectureHTML = await fetchCourse(subjectID, classID, term); // only 3 params

            if (!lectureHTML || lectureHTML.includes("No results available based off your filter criteria")) break;

            // Parse lecture info and create a section entry for the lecture
            const lectureSections = getClassData(lectureHTML, subjectID, classID);
            if (lectureSections && lectureSections.length > 0) {
                // usually the lecture itself is the first entry
                const lectureSection = lectureSections[0];
                await createSectionEntry(db, lectureSection);
            }

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

(async () => {
    try {
        const db = await fetchAllSections(term, subjectID);

        const binaryArray = db.export();
        fs.writeFileSync("Math.db", binaryArray);

        console.log("Saved database to Math.db");

        // console.log("\nFetching schedules...\n");

        // const courses = [['MATH', '31A'], ['MATH', '32B'], ['MATH', '131BH']];
        // const schedules = getSchedules(term, courses, db);

        // console.log("Possible schedules:\n");

        // for(let schedule of schedules) {
        //     console.log(schedule);
        // }

        // console.log("Done.");
    } catch (err) {
        console.error(err);
    }
})();