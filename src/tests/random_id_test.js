import { getSubjectID } from "../getSubjectID.js";
import { getClassID } from "../getClassID.js";
import { getClassData } from "../getClassData.js";
import { fetchCourse } from "../getLectures.js"; 
import { initDB, createSectionEntry, createSubjectEntry, getAllEntries, getClassEntries, searchSubjectArea, searchClass, getSectionDay, getSectionStartTime, getSectionEndTime, getSectionAvail, getClasses, getSections, createClassEntry, testa } from "../dbQueries.js";


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {

    //Scrapes all of subject IDs
    const subjectID = await getSubjectID("26W");

    //Randomly selects one subject ID

    let randomSubject = getRandomInt(0, subjectID.length - 1);
    console.log("Randomly selected subject:", subjectID[randomSubject]);
    let listID = await getClassID("26W", subjectID[randomSubject].subjectID);

    //Randomly selects one class ID from the subject ID
    let randomClass = getRandomInt(0, listID.length - 1);
    console.log("Randomly selected class:", listID[randomClass]);
    let courseData = await fetchCourse(subjectID[randomSubject].subjectID, listID[randomClass].classID , "26W");


    //Prints out all lecture data
    const allClassData = await getClassData(courseData, subjectID[randomSubject].subjectID, listID[randomClass].classID);
    console.log(allClassData);

    //Prints out all discussion data for each of the lectures.
    for (let i=1; i<=allClassData.length; i++) {
        let discussionData = await fetchCourse(subjectID[randomSubject].subjectID, listID[randomClass].classID, "26W", i);
        const classDisscusionData = await getClassData(discussionData, subjectID[randomSubject].subjectID, listID[randomClass].classID);

        console.log(classDisscusionData);
    }

}

main();