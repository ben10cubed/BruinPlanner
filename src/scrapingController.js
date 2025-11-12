import { getSubjectID } from "./getSubjectID.js";
import { getClassID } from "./getClassID.js";
import { getClassData } from "./getClassData.js";
import { initDB, createSectionEntry, createSubjectEntry, getAllEntries, getClassEntries, searchSubjectArea, searchClass, getSectionDay, getSectionStartTime, getSectionEndTime, getSectionAvail, getClasses, getSections, createClassEntry, testa } from "./dbQueries.js";
import { fetchCourse } from "./getLectures.js";

async function main() {
    // Placeholder SubjectID, ClassID, Term
    let sampleSubjectID = "COM SCI";
    let sampleClassID = "33";
    // Test M152A (TA thing)
    let sampleTerm = "26W";
    let sampleLecture = null;

    //Scrapes all of subject IDs
    const subjectID = await getSubjectID(sampleTerm);
    // Scrape all classes for sampleSubjectID
    const sampleClasses = await getClassID(sampleTerm, sampleSubjectID);

    // Get the HTML for a sample subject + class + lecture
    const classHTML = await fetchCourse(sampleSubjectID, sampleClassID, sampleTerm, sampleLecture)
    console.log("Class HTML Retrieved");
    // Get the data for the sample subject + class + lecture (all discussion data)
    const allClassData = await getClassData(classHTML, sampleSubjectID, sampleClassID);
    console.log("Class Data Retrieved")
    console.log(classHTML);
    console.log(allClassData);

    // Initialize DB and input data
    initDB().then(db => {
        // for (let i=0; i<subjectID.length; i++) {
        //     createSubjectEntry(db, [subjectID[i].classID, subjectID[i].className]);
        // }
        for (let i = 0; i < sampleClasses.length; i++) {
            createClassEntry(db, [sampleSubjectID, sampleClasses[i].classID, sampleClasses[i].className]);
        }
        for (let i = 0; i < allClassData.length; i++) {
            createSectionEntry(db, allClassData[i]);
        }
        // console.log("Data input into database.");
        // console.log("Fetch all entries in all tables:");
        // console.log(getAllEntries(db));
        // console.log("Fetch data for COM SCI 35L sections:");
        // console.log(getClassEntries(db, "COM SCI", "35L"));
        // console.log("Fetch all classes for COM SCI:");
        // console.log(getClasses(db, "COM SCI"));
        // console.log("Fetch all sections for COM SCI 35L:");
        // console.log(getSections(db, "COM SCI", "35L"));
        // console.log("Search for subject ID's/Names that begin with 'COM':");
        // console.log(searchSubjectArea(db, "COM"));
        // console.log("Search for class ID's in COM SCI that begin with '3' (31, 32, 35L, etc.):");
        // console.log(searchClass(db, "COM SCI", "3"));
        // console.log("Fetch COM SCI 35L Dis 1A day: ");
        // console.log(getSectionDay(db, "COM SCI", "35L", "Dis 1A"));
        // console.log("Fetch COM SCI 35L Dis 1A start time: ");
        // console.log(getSectionStartTime(db, "COM SCI", "35L", "Dis 1A"));
        // console.log("Fetch COM SCI 35L Dis 1A end time: ");
        // console.log(getSectionEndTime(db, "COM SCI", "35L", "Dis 1A"));
        // console.log("Fetch COM SCI 35L Dis 1A avail: ");
        // console.log(getSectionAvail(db, "COM SCI", "35L", "Dis 1A"));
        // console.log(testa(db));
    });
}

main();