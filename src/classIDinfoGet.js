import { readFileSync } from "node:fs";

import { getSubjectID } from "./getSubjectID.js";
import { getClassID } from "./getClassID.js";
import { getClassData } from "./getClassData.js";
import { fetchCourse } from "./getLectures.js"; 
import { initDB, createClassEntry, createSubjectEntry, getAllEntries, getClassEntries, searchSubjectArea, searchClass, getSectionDay, getSectionStartTime, getSectionEndTime, getSectionAvail, getClasses, getSections, createSubjectClassEntry, testa } from "./dbQueries.js";
import { get } from "node:http";


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    // Temporarily read from "sampleCourseHTML.txt"
    // When the getHTML function is up in js, pipe that into here instead

    //Scrapes all of subject IDs
    const subjectID = await getSubjectID("26W");

    //For each subject ID, scrape class ID.
    //After some more testing, appears to work fine.
    //In case anything break/doesn't work as intended/classes missing, please inform Ben.

    let randomSubject = getRandomInt(0, subjectID.length - 1);
    console.log("Randomly selected subject:", subjectID[randomSubject]);
    let listID = await getClassID("26W", subjectID[randomSubject].subjectID);

    let randomClass = getRandomInt(0, listID.length - 1);
    console.log("Randomly selected class:", listID[randomClass]);
    let courseData = await fetchCourse(subjectID[randomSubject].subjectID, listID[randomClass].classID , "26W");


    
    const allClassData = await getClassData(courseData, subjectID[randomSubject].subjectID, listID[randomClass].classID);
    console.log(allClassData);


    for (let i=1; i<=allClassData.length; i++) {
        let discussionData = await fetchCourse(subjectID[randomSubject].subjectID, listID[randomClass].classID, "26W", i);
        const classDisscusionData = await getClassData(discussionData, subjectID[randomSubject].subjectID, listID[randomClass].classID);

        console.log(classDisscusionData);
    }

}

main();