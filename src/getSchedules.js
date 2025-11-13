//Assumes db already exists

import { getClassData } from "./dbQueries.js"

function filterAvailable(courseData) {
    const newCourseData = []
    for(var data of courseData) {
        if(data['avail']) {
            newCourseData.push(data);
        }
    }
    return newCourseData;
}

function hasConflicts(courseArr, indices) {

}

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @param {Promise<Array>} courses - array that stores requested course subject ID's and course numbers
 * @returns {Promise<Array>} 2D array that specifies which sections are in the schedule (course, lecture #, discussion #).
 */

export async function getSchedules(term="26W", courses) {
    const schedules = [];
    const courseArr = [];

    const numCourses = courses.length;

    for(var course of courses) {
        let subjectID = course[0];
        let classID = course[1];
        const courseData = getClassData(db, subjectID, classID);
        courseArr.push(filterAvailable(courseData));
    }

    let numPossibilities = 1;
    const possibilities = [];
    const indices = [];
    for(let i = 0; i < numCourses; i++) {
        numPossibilities *= courseArr[i].length;
        possibilities.push(courseArr[i].length);
        indices[i] = 0;
    }
    indices[0] = -1;

    for(let num = 0; num < numPossibilities; num++) {
        indices[0]++;
        let i = 0;
        while(indices[i] == possibilities[i]) {
            indices[i] = 0;
            indices[i+1]++;
            i++;
        }

        if(!hasConflicts(courseArr, indices)) {
            const schedule = [];
            for(let j = 0; j < numCourses; j++) {
                schedule.push(courseArr[j][indices[j]]['sectionID']);
            }
            schedules.push(schedule);
        }
    }
    return schedules;
}