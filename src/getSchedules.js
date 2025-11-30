//Assumes db already exists

import { fetchCourse } from "./getLectures.js";
import { getClassData } from "./getClassData.js";
import { getSectionDay, getSectionTime, getSections, getSectionAvail, getClassEntries, createSectionEntry, updateSectionEntry, sectionExists } from "./dbQueries.js";

const strToDay = {
    "M": 0,
    "T": 1,
    "W": 2,
    "R": 3,
    "F": 4,
    "S": 5,
    "U": 6
}

// async function filterAvailable(db, subjectID, classID, courseData) { //returns new courseData array with only available lectures and discussions
//     const newCourseData = []
//     for(var data of courseData) {
//         let sectionID = data['sectionID'];
//         let avail = await getSectionAvail(db, subjectID, classID, sectionID);
//         //console.log(avail);
//         if(avail == 'O') {
//             //console.log(data);
//             newCourseData.push(data);
//         }
//     }
//     //console.log(newCourseData);
//     return newCourseData;
// }

async function filterAvailable(db, possibilities) {
    let newPossibilities = [];
    for(let poss of possibilities) {
        let valid = true;
        let courseIDs = Object.keys(poss);
        for(let courseID of courseIDs) {
            let [subjectID, classID] = parseCourseID(courseID);
            for(let sectionID of poss[courseID]) {
                let avail = await getSectionAvail(db, subjectID, classID, sectionID);
                if(avail != 'O') {
                    valid = false;
                    break;
                }
            }
        }
        if(valid) {
            newPossibilities.push(poss);
        }
    }
    return newPossibilities;
}

async function filterTimes(db, possibilities, startTime=800, endTime=1900) {
    let newPossibilities = [];
    for(let poss of possibilities) {
        let valid = true;
        let courseIDs = Object.keys(poss);
        for(let courseID of courseIDs) {
            let [subjectID, classID] = parseCourseID(courseID);
            for(let sectionID of poss[courseID]) {
                let timesStr = await getSectionTime(db, subjectID, classID, sectionID);
                let times = getTimes(timesStr);
                for(let i = 0; i < times.length; i++) {
                    if(times[i][0] < startTime || times[i][1] > endTime) {
                        valid = false;
                        break;
                    }
                }
            }
        }
        if(valid) {
            newPossibilities.push(poss);
        }
    }
    return newPossibilities;
}

function parseCourseID(courseID) {
    for(let i = 0; i < courseID.length; i++) {
        if(courseID[i] == '+') {
            return [courseID.substring(0, i), courseID.substring(i+1)];
        }
    }
}

function getAllPossibilities(courseMap) {
  const courses = Object.keys(courseMap);

  function helper(idx, current) {
    if (idx === courses.length) {
      return [current];
    }

    const course = courses[idx];
    const lectures = courseMap[course];
    const all = [];

    for (const [lecture, discussions] of lectures) {
      // if no discussions, still include the lecture alone
      if (discussions.length === 0) {
        all.push(...helper(idx + 1, { ...current, [course]: [lecture] }));
      } else {
        for (const discussion of discussions) {
          all.push(...helper(idx + 1, { ...current, [course]: [lecture, discussion] }));
        }
      }
    }

    return all;
  }

  return helper(0, {});
}

function getDays(str) {
    if(str == "") {
        return [];
    }
    const days = [];
    let day = "";
    let index = 0;
    while(index < str.length) {
        if(str[index] == '|') {
            days.push(day);
            day = "";
        } else {
            day += str[index];
        }
        index++;
    }
    days.push(day);
    return days;
}

function getTimes(str) {
    const timesStr = [];
    let timeStr = "";
    let index = 0;
    while(index < str.length) {
        if(str[index] == '|') {
            timesStr.push(timeStr);
            timeStr = "";
        } else {
            timeStr += str[index];
        }
        index++;
    }
    timesStr.push(timeStr);

    const times = [];
    for(const time of timesStr) {
        for(let i = 0; i < time.length; i++) {
            if(time[i] == '-') {
                let start = parseInt(time.substring(0, i));
                let end = parseInt(time.substring(i+1));
                times.push([start, end]);
            }
        }
    }
    return times;
}

function toMinutes(time) {
    return 60*Math.floor(time/100)+time%100;
}

function hasOverlap(time1, time2, buffer) {
    let [start1, end1] = time1;
    let [start2, end2] = time2;

    start1 = toMinutes(start1);
    end1 = toMinutes(end1);
    start2 = toMinutes(start2);
    end2 = toMinutes(end2);

    if (end1 + buffer <= start2) return false;

    if (end2 + buffer <= start1) return false;

    return true;
}

function isValidDays(str) {
    return /^[MTWRFSU|]*$/.test(str);
}

async function hasConflicts(db, sched, buffer=0) {
    const daysArr = new Array(7);
    for(let i = 0; i < 7; i++) {
        daysArr[i] = [];
    }

    for (const [courseID, sectionList] of Object.entries(sched)) {
        let [subjectID, classID] = parseCourseID(courseID);
        for(let sectionID of sectionList) {
            let daysStr = await getSectionDay(db, subjectID, classID, sectionID);
            if(!isValidDays(daysStr)) {
                daysStr = "";
            }
            let days = getDays(daysStr);

            let timesStr = await getSectionTime(db, subjectID, classID, sectionID);
            //console.log(timesStr);
            let times = getTimes(timesStr);

            for(let i = 0; i < days.length; i++) {
                let day = strToDay[days[i]];
                let time = times[i];
                for(const otherTime of daysArr[day]) {
                    if(hasOverlap(time, otherTime, buffer)) {
                        //console.log(time);
                        //console.log(otherTime);
                        return true;
                    }
                }
                daysArr[day].push(time);
            }
        }
    }
    //console.log(daysArr);
    return false;
}

async function saveCourses(db, courses, term) {
    for(let course of courses) {
        let subjectID = course[0];
        let classID = course[1];
        const lectureHTML = await fetchCourse(subjectID, classID, term);
        const lectureSections = getClassData(lectureHTML, subjectID, classID);
        if(lectureHTML.includes("No results available based off your filter criteria.")) continue;

        for(let lectureSection of lectureSections) {
            let lectureID = lectureSection[3];
            let lectureExists = await sectionExists(db, subjectID, classID, lectureID);
            if(!lectureExists) { //if lecture isn't already stored in the database, create new entries
                await createSectionEntry(db, lectureSection);
                const classHTML = await fetchCourse(subjectID, classID, term, lectureID);
                if (!classHTML || classHTML.includes("No results available based off your filter criteria")) continue;
                const sections = getClassData(classHTML, subjectID, classID);

                if (!sections || sections.length === 0) continue;

                for (const section of sections) {
                    //console.log(section);
                    if (!section[3] || section[3].trim() === "") {  // sectionID is index 3
                        console.log("Skipping section with empty sectionID:", section);
                        continue;
                    }

                    await createSectionEntry(db, section);
                }
            } else { //if lecture is already stored, just change the status/number of spots
                await updateSectionEntry(db, lectureSection);
                const classHTML = await fetchCourse(subjectID, classID, term, lectureID);
                if (!classHTML || classHTML.includes("No results available based off your filter criteria")) continue;
                const sections = getClassData(classHTML, subjectID, classID);

                if (!sections || sections.length === 0) continue;

                for (const section of sections) {
                    let discussionID = section[3];
                    if (!discussionID || discussionID.trim() === "") {  // sectionID is index 3
                        console.log("Skipping section with empty sectionID:", section);
                        continue;
                    }
                    let discussionExists = await sectionExists(db, subjectID, classID, discussionID);
                    if(discussionExists) {
                        await updateSectionEntry(db, section);
                    } else {
                        await createSectionEntry(db, section);
                    }
                }
            }
        }
    }
}

function isLecture(sectionID) {
    return sectionID.includes("Lec");
}

function sameLecture(sectionA, sectionB) {
    const extractLectureNum = (str) => {
        // Matches the first integer in the string (e.g., "1" in "Dis 1A")
        const match = str.match(/\b(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    };

    const lecA = extractLectureNum(sectionA);
    const lecB = extractLectureNum(sectionB);

    if (lecA === null || lecB === null) return false;

    return lecA === lecB;
}

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @param {Promise<Array>} courses - array that stores requested course subject ID's and course numbers
 * @param {database} db
 * @param {Map} reqs - Map that stores startTime, endTime, and buffer chosen by user
 * @returns {Promise<Array>} Array of plain value Maps, where each Map is a possible schedule. Key = subjectID + '+' + classID, and value = [lectureID, discussionID]
 */

export async function getSchedules(db, courses, term, reqs={"startTime": 800, "endTime": 1900, "buffer": 0}) {
    const courseMap = {};

    const numCourses = courses.length;

    await saveCourses(db, courses, term);

    for(let course of courses) {
        let subjectID = course[0];
        let classID = course[1];
        let courseID = subjectID+'+'+classID;
        courseMap[courseID] = [];
        const courseData = await getSections(db, subjectID, classID);

        for(let course of courseData) {
            let sectionID = course['sectionID'];
            if(isLecture(sectionID)) {
                courseMap[courseID].push([sectionID, []]);
            }
        }

        for(let section of courseData) {
            let sectionID = section['sectionID'];
            if(!isLecture(sectionID)) {
                for(let i = 0; i < courseMap[courseID].length; i++) {
                    if(sameLecture(courseMap[courseID][i][0], sectionID)) {
                        courseMap[courseID][i][1].push(sectionID);
                        break;
                    }
                }
            }
        }
    }
    console.log(courseMap);

    // const courseKeys = Object.keys(courseMap);
    // for(let course of courseKeys) {
    //     console.log(`Course ${course}`);
    //     console.log(courseMap[course]);
    // }

    let buffer = reqs["buffer"];
    let startTime = reqs["startTime"];
    let endTime = reqs["endTime"];

    let possibilities = getAllPossibilities(courseMap);
    possibilities = await filterAvailable(db, possibilities, buffer);
    possibilities = await filterTimes(db, possibilities, startTime, endTime);

    const validSchedules = [];
    for(let poss of possibilities) {
        if(!(await hasConflicts(db, poss, buffer))) {
            validSchedules.push(poss);
        }
    }
    return validSchedules;
}