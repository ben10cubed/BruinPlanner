const { readFileSync } = require("node:fs");

const { getSubjectID } = require("./getSubjectID.js");
const { getClassData } = require("./getClassData.js");
const { initDB, createClassEntry, createSubjectEntry, getAllEntries } = require("./dbQueries.js");

async function main() {
    // Temporarily read from "sampleCourseHTML.txt"
    // When the getHTML function is up in js, pipe that into here instead

    const subjectID = await getSubjectID("26W");



    const classHTML = readFileSync('sampleCourseHTML.txt', 'utf8');
    console.log("Class Data Retrieved");
    
    allClassData = getClassData(classHTML);

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

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("Error:", error);
  }
}