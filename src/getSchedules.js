//Assumes db already exists

import { getSectionDay, getSectionTime, getSections, getSectionAvail, getClassEntries } from "./dbQueries.js"

const strToDay = {
    "M": 0,
    "T": 1,
    "W": 2,
    "R": 3,
    "F": 4,
    "S": 5,
    "U": 6
}

function filterAvailable(db, subjectID, classID, courseData) { //returns new courseData array with only available lectures and discussions
    const newCourseData = []
    for(var data of courseData) {
        let sectionID = data['sectionID'];
        let avail = getSectionAvail(db, subjectID, classID, sectionID);
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

function hasConflicts(db, sched) {
    const daysArr = new Array(7);
    for(let i = 0; i < 7; i++) {
        daysArr[i] = [];
    }

    for (const [courseID, sectionList] of Object.entries(sched)) {
        let [subjectID, classID] = parseCourseID(courseID);
        for(let sectionID of sectionList) {
            if(sectionID.length == 1) {
                sectionID = "Lec "+sectionID;
            } else {
                sectionID = "Dis "+sectionID;
            }
            let daysStr = getSectionDay(db, subjectID, classID, sectionID);
            let days = getDays(daysStr);

            let timesStr = getSectionTime(db, subjectID, classID, sectionID);
            let times = getTimes(timesStr);

            for(let i = 0; i < days.length; i++) {
                let day = strToDay[days[i]];
                let time = times[i];
                for(const otherTime of daysArr[day]) {
                    if(hasOverlap(time, otherTime)) {
                        // console.log(time);
                        // console.log(otherTime);
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

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @param {Promise<Array>} courses - array that stores requested course subject ID's and course numbers
 * @param {database} db
 * @returns {Promise<Array>} Array of plain value Maps, where each Map is a possible schedule. Key = subjectID + '+' + classID, and value = [lectureID, discussionID]
 */

export async function getSchedules(term="26W", courses, db) {
    const courseMap = {};

    const numCourses = courses.length;

    for(let course of courses) {
        let subjectID = course[0];
        let classID = course[1];
        let courseID = subjectID+'+'+classID;
        courseMap[courseID] = [];
        const courseData = getSections(db, subjectID, classID);
        const newCourseData = filterAvailable(db, subjectID, classID, courseData);
        for(let course of newCourseData) {
            let sectionID = cutSectionID(course['sectionID'])
            if(sectionID.length == 1) {
                courseMap[courseID].push([sectionID, []]);
            }
        }
        for(let section of newCourseData) {
            let sectionID = cutSectionID(section['sectionID']);
            if(sectionID.length == 2) {
                for(let i = 0; i < courseMap[courseID].length; i++) {
                    if(courseMap[courseID][i][0] == sectionID[0]) {
                        courseMap[courseID][i][1].push(sectionID);
                        break;
                    }
                }
            }
        }
    }

    // const courseKeys = Object.keys(courseMap);
    // for(let course of courseKeys) {
    //     console.log(`Course ${course}`);
    //     console.log(courseMap[course]);
    // }

    let possibilities = getAllPossibilities(courseMap);
    //console.log(possibilities);

    const validSchedules = [];
    for(let poss of possibilities) {
        if(!hasConflicts(db, poss)) {
            validSchedules.push(poss);
        }
    }
    return validSchedules;
}