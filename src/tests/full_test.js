import fs from "fs/promises";
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

// Helper: Append logs safely
async function logToFile(filename, message) {
  const timestamp = new Date().toISOString();
  try {
    await fs.appendFile(filename, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error(`⚠️ Failed to write to ${filename}: ${err.message}`);
  }
}

// Helper: Check if any field in an object is empty
function hasEmptyField(entry) {
  if (!entry || typeof entry !== "object") return true;
  return Object.values(entry).some(
    (v) =>
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim() === "")
  );
}
async function main() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const term = "26W";

  const startSubject = "C&EE"; // 🔹 Change this to any subjectID you want to start from

  const errorFile = "errors.log";
  const emptyFile = "empty.log";
  const successFile = "success.log";
  for (const f of [errorFile, emptyFile, successFile]) {
    await fs.writeFile(f, "", { flag: "w" });
  }

  console.log(`🔍 Starting full scrape for term ${term}`);

  let subjects = [];
  try {
    subjects = await getSubjectID(term);
  } catch (err) {
    console.error("❌ Failed to fetch subjects list:", err.message);
    await logToFile(errorFile, `Failed to fetch subjects list: ${err.message}`);
    return;
  }

  console.log(`Found ${subjects.length} subjects.`);
  
  // 🔹 Find index to start from
  const startIndex = subjects.findIndex(
    (s) => s.subjectID.trim().toUpperCase() === startSubject.trim().toUpperCase()
  );
  if (startIndex === -1) {
    console.error(`❌ Subject "${startSubject}" not found in subject list.`);
    return;
  }

  console.log(`⚡ Starting from subject ${startSubject} (index ${startIndex})`);

  // ✅ Loop through each subject starting from chosen one
  for (let idx = startIndex; idx < subjects.length; idx++) {
    const subject = subjects[idx];
    console.log(`\n📘 Subject: ${subject.subjectID}`);

    let classes = [];
    try {
      classes = await getClassID(term, subject.subjectID);
    } catch (err) {
      const msg = `${subject.subjectID}: failed to get classes (${err.message})`;
      console.error(`❌ ${msg}`);
      await logToFile(errorFile, msg);
      continue;
    }

    if (!classes || classes.length === 0) {
      await logToFile(emptyFile, `${subject.subjectID}: no classes found`);
      continue;
    }

    // ✅ Loop through classes (same logic as before)
    for (const classID of classes) {
      await sleep(2000);
      try {
        console.log(`   🔹 Fetching ${subject.subjectID} ${classID.classID}`);
        const courseHTML = await fetchCourse(subject.subjectID, classID.classID, term);
        const lectureData = await getClassData(courseHTML, subject.subjectID, classID.classID);

        if (!lectureData || lectureData.length === 0) {
          await logToFile(emptyFile, `${subject.subjectID} ${classID.classID}: empty lecture data`);
          continue;
        }

        const invalidLecture = lectureData.filter(hasEmptyField);
        if (invalidLecture.length > 0) {
          await logToFile(
            emptyFile,
            `${subject.subjectID} ${classID.classID}: lecture entries contain empty fields (${invalidLecture.length} of ${lectureData.length})`
          );
        }

        // ✅ Fetch discussions (unchanged)
        for (let i = 1; i <= lectureData.length; i++) {
          await sleep(2000);
          try {
            const discussionHTML = await fetchCourse(subject.subjectID, classID.classID, term, i);
            const discussionData = await getClassData(discussionHTML, subject.subjectID, classID.classID);

            if (!discussionData || discussionData.length === 0) continue;

            const invalidDiscussion = discussionData.filter(hasEmptyField);
            if (invalidDiscussion.length > 0) {
              await logToFile(
                emptyFile,
                `${subject.subjectID} ${classID.classID} section ${i}: discussion entries contain empty fields (${invalidDiscussion.length} of ${discussionData.length})`
              );
            }
          } catch (discussionErr) {
            const msg = `${subject.subjectID} ${classID.classID} section ${i}: DISCUSSION FETCH ERROR -> ${discussionErr.message}`;
            console.error(`❌ ${msg}`);
            await logToFile(errorFile, msg);
          }
        }

        await logToFile(
          successFile,
          `${subject.subjectID} ${classID.classID}: fetched ${lectureData.length} lecture entries successfully`
        );

      } catch (err) {
        const msg = `${subject.subjectID} ${classID.classID}: ERROR -> ${err.message}`;
        console.error(`❌ ${msg}`);
        await logToFile(errorFile, msg);
        continue;
      }
    }
  }

  console.log("\n✅ Finished fetching all subjects and classes without stopping!");
}

main();