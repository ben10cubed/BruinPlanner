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

async function filterAvailable(db, subjectID, classID, courseData) { //returns new courseData array with only available lectures and discussions
    const newCourseData = []
    for(var data of courseData) {
        let sectionID = data['sectionID'];
        let avail = await getSectionAvail(db, subjectID, classID, sectionID);
        //console.log(avail);
        if(avail == 'O') {
            //console.log(data);
            newCourseData.push(data);
        }
    }
    //console.log(newCourseData);
    return newCourseData;
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

function hasOverlap(time1, time2) {
    const [start1, end1] = time1;
    const [start2, end2] = time2;

    if(start2 <= end1 && start2 >= start1) {
        return true;
    }
    if(start1 <= end2 && start1 >= start2) {
        return true;
    }
    return false;
}

function isValidDays(str) {
    return /^[MTWRFSU|]*$/.test(str);
}

async function hasConflicts(db, sched) {
    const daysArr = new Array(7);
    for(let i = 0; i < 7; i++) {
        daysArr[i] = [];
    }

    for (const [courseID, sectionList] of Object.entries(sched)) {
        let [subjectID, classID] = parseCourseID(courseID);
        for(let sectionID of sectionList) {
            if(isLecture(sectionID)) {
                sectionID = "Lec "+sectionID;
            } else {
                sectionID = "Dis "+sectionID;
            }
            let daysStr = await getSectionDay(db, subjectID, classID, sectionID);
            if(!isValidDays(daysStr)) {
                daysStr = "";
            }
            let days = getDays(daysStr);
            console.log(days);
            console.log(days.length);

            let timesStr = await getSectionTime(db, subjectID, classID, sectionID);
            //console.log(timesStr);
            let times = getTimes(timesStr);

            for(let i = 0; i < days.length; i++) {
                let day = strToDay[days[i]];
                let time = times[i];
                console.log(day + " " + daysArr[day]);
                for(const otherTime of daysArr[day]) {
                    if(hasOverlap(time, otherTime)) {
<<<<<<< HEAD
                        //console.log(time);
                        //console.log(otherTime);
=======
                        // console.log(time);
                        // console.log(otherTime);
>>>>>>> subjectID-api
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

function cutSectionID(str) {
    let index = 0;
    while(str[index] != " ") {
        index++;
    }
    return str.substring(index+1);
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
            let lectureNum = parseInt(cutSectionID(lectureID));
            let lectureExists = await sectionExists(db, subjectID, classID, lectureSection[3]);
            if(!lectureExists) { //if lecture isn't already stored in the database, create new entries
                await createSectionEntry(db, lectureSection);
                const classHTML = await fetchCourse(subjectID, classID, term, lectureNum);
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
                const classHTML = await fetchCourse(subjectID, classID, term, lectureNum);
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
    return !(/[A-Z]/.test(sectionID[sectionID.length-1]));
}

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @param {Promise<Array>} courses - array that stores requested course subject ID's and course numbers
 * @param {database} db
 * @returns {Promise<Array>} Array of plain value Maps, where each Map is a possible schedule. Key = subjectID + '+' + classID, and value = [lectureID, discussionID]
 */

export async function getSchedules(db, courses, term="26W") {
    const courseMap = {};

    const numCourses = courses.length;

    await saveCourses(db, courses, term);

    for(let course of courses) {
        let subjectID = course[0];
        let classID = course[1];
        let courseID = subjectID+'+'+classID;
        courseMap[courseID] = [];
<<<<<<< HEAD
        const courseData = await getSections(db, subjectID, classID);
        const newCourseData = await filterAvailable(db, subjectID, classID, courseData);

=======
        const courseData = getSections(db, subjectID, classID);
        const newCourseData = filterAvailable(db, subjectID, classID, courseData);
>>>>>>> subjectID-api
        for(let course of newCourseData) {
            let sectionID = cutSectionID(course['sectionID']);
            if(isLecture(sectionID)) {
                courseMap[courseID].push([sectionID, []]);
            }
        }
<<<<<<< HEAD

=======
>>>>>>> subjectID-api
        for(let section of newCourseData) {
            let sectionID = cutSectionID(section['sectionID']);
            if(!isLecture(sectionID)) {
                for(let i = 0; i < courseMap[courseID].length; i++) {
                    if(courseMap[courseID][i][0] == sectionID[0]) {
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

    let possibilities = getAllPossibilities(courseMap);

    const validSchedules = [];
    for(let poss of possibilities) {
        if(!(await hasConflicts(db, poss))) {
            validSchedules.push(poss);
        }
    }
    return validSchedules;
}