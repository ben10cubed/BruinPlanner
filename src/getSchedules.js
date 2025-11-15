//Assumes db already exists

import { getClassData } from "./dbQueries.js"

const strToDay = {
    "M": 0,
    "T": 1,
    "W": 2,
    "R": 3,
    "F": 4,
    "S": 5,
    "U": 6
}

function filterAvailable(courseData) { //returns new courseData array with only available lectures and discussions
    const newCourseData = []
    for(var data of courseData) {
        if(data['avail'] == 'O') {
            newCourseData.push(data);
        }
    }
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
  const courses = Array.from(courseMap.keys());

  function helper(idx, current) {
    if (idx === courses.length) {
      return [current];
    }

    const course = courses[idx];
    const lectures = courseMap.get(course);
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
            timesStr += str[index];
        }
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

    return !(end1 <= start2 || end2 <= start1);
}

function hasConflicts(sched) {
    const daysArr = new Array(7);
    for(let i = 0; i < 7; i++) {
        daysArr[i] = [];
    }

    for(const [courseID, sectionList] of sched) {
        let [subjectID, classID] = parseCourseID(courseID);
        for(let sectionID of sectionList) {
            let daysStr = getSectionDay(subjectID, classID, sectionID);
            let days = getDays(daysStr);

            let timesStr = getSectionTime(subjectID, classID, sectionID);
            let times = getTimes(timesStr);

            for(let i = 0; i < days.length; i++) {
                let day = strToDay[days[i]];
                let time = times[i];
                for(const otherTime of days[day]) {
                    if(hasOverlap(time, otherTime)) {
                        return true;
                    }
                    days[day].push(time);
                }
            }
        }
    }
    return false;
}

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @param {Promise<Array>} courses - array that stores requested course subject ID's and course numbers
 * @returns {Promise<Array>} 2D array that specifies which sections are in the schedule (course, lecture #, discussion #).
 */

export async function getSchedules(term="26W", courses) {
    const courseMap = {};

    const numCourses = courses.length;

    for(let course of courses) {
        let subjectID = course[0];
        let classID = course[1];
        let courseID = subjectID+'+'+classID;
        courseMap[courseID] = [];
        const courseData = getSections(db, subjectID, classID);
        const newCourseData = filterAvailable(courseData);
        for(let course of courseData) {
            if(course['sectionID'].length == 1) {
                courseMap[courseID].push(course['sectionID']);
                courseMap[courseID].push([]);
            }
        }
        for(let section of courseData) {
            if(section['sectionID'].length == 2) {
                for(let i = 0; i < courseMap[courseID].length; i++) {
                    if(courseMap[courseID][i][0] == section['sectionID'][0]) {
                        courseMap[courseID][i][1].push(section['sectionID']);
                        break;
                    }
                }
            }
        }
    }

    let possibilities = getAllPossibilities(courseMap);

    const validSchedules = [];
    for(let poss of possibilities) {
        if(!hasConflicts(poss)) {
            validSchedules.push(poss);
        }
    }
    return poss;
}