const { readFileSync } = require("node:fs");

const { getClassData } = require("./getClassData.js");
const { initDB, createEntry, getAllEntries } = require("./dbQueries.js");

function main() {
    // Temporarily read from "sampleCourseHTML.txt"
    // When the getHTML function is up in js, pipe that into here instead
    const classHTML = readFileSync('sampleCourseHTML.txt', 'utf8');
    console.log("Class Data Retrieved");
    
    allClassData = getClassData(classHTML);

    // Initialize DB and input data
    initDB().then(db => {
        for (let i = 0; i < allClassData.length; i++) {
            createEntry(db, allClassData[i]);
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