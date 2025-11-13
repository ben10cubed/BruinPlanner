import { getSubjectID } from "../getSubjectID.js";
import { getClassID } from "../getClassID.js";
import { getClassData } from "../getClassData.js";
import { fetchCourse } from "../getLectures.js"; 
import { 
  initDB, createSectionEntry, createSubjectEntry, getAllEntries, 
  getClassEntries, searchSubjectArea, searchClass, getSectionDay, 
  getSectionStartTime, getSectionEndTime, getSectionAvail, 
  getClasses, getSections, createClassEntry, testa 
} from "../dbQueries.js";

async function main() {
  const term = "26W";

  // 🔹 Manually set your subject ID and class ID here
  const subjectID = "ARCH&UD";    // e.g. "COM SCI", "EC ENGR", etc.
  const classID = "412";         // e.g. "0031", "0152A", etc.

  console.log(`Fetching course data for ${subjectID} ${classID} (${term})`);

  // Fetch course HTML
  const courseData = await fetchCourse(subjectID, classID, term);

  // Extract and print all lecture data
  const allClassData = await getClassData(courseData, subjectID, classID);
  console.log("Lecture data:");
  console.log(allClassData);

  // 🔹 Loop through discussions (secondary sections)
  for (let i = 1; i <= allClassData.length; i++) {
    const discussionData = await fetchCourse(subjectID, classID, term, i);
    const classDiscussionData = await getClassData(discussionData, subjectID, classID);
    console.log(`Discussion data for section ${i}:`);
    console.log(classDiscussionData);
  }
}

main();
