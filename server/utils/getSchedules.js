import { getSectionDay, getSectionTime, getSections, getSectionAvail } from "../db/section.js";

const strToDay = {
    "M": 0,
    "T": 1,
    "W": 2,
    "R": 3,
    "F": 4,
    "S": 5,
    "U": 6
}

const dayNameToCode = {
    "Monday":    "M",
    "Tuesday":   "T",
    "Wednesday": "W",
    "Thursday":  "R",
    "Friday":    "F",
};

function parseFilterTime(str) {
    const match = str.match(/^(\d+)(am|pm)$/);
    if (!match) return null;
    let hour = parseInt(match[1]);
    const period = match[2];
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return hour * 100;
}

async function filterAvailable(db, subjectID, classID, courseData, settings = { showWaitlist: false, showClosed: false }) {
    const allowed = new Set(["O"]);
    if (settings.showWaitlist) allowed.add("W");
    if (settings.showClosed) allowed.add("C");

    const newCourseData = [];
    for (const data of courseData) {
        const avail = await getSectionAvail(db, subjectID, classID, data["sectionID"]);
        if (allowed.has(avail)) {
            newCourseData.push(data);
        }
    }
    return newCourseData;
}

async function filterByPreferences(db, subjectID, classID, courseData, filters) {
    if (!filters || filters.length === 0) return courseData;

    const noEarlyFilter = filters.find(f => f.id === "no_early_classes");
    const noLateFilter  = filters.find(f => f.id === "no_late_classes");
    const excludedDays  = filters
        .filter(f => f.id === "no_classes_on_day")
        .map(f => dayNameToCode[f.value])
        .filter(Boolean);

    const minTime = noEarlyFilter ? parseFilterTime(noEarlyFilter.value) : null;
    const maxTime = noLateFilter  ? parseFilterTime(noLateFilter.value)  : null;

    if (minTime === null && maxTime === null && excludedDays.length === 0) return courseData;

    const filtered = [];
    for (const data of courseData) {
        const sectionID = data["sectionID"];
        const daysStr = await getSectionDay(db, subjectID, classID, sectionID);
        const timesStr = await getSectionTime(db, subjectID, classID, sectionID);

        if (isNotScheduled(daysStr) || isNotScheduled(timesStr)) {
            filtered.push(data);
            continue;
        }

        const days  = getDays(daysStr);
        const times = getTimes(timesStr);
        let passes = true;

        for (let i = 0; i < days.length; i++) {
            const day = days[i];
            const [start, end] = times[i] ?? [null, null];

            if (excludedDays.includes(day)) { passes = false; break; }
            if (minTime !== null && start !== null && start < minTime) { passes = false; break; }
            if (maxTime !== null && end   !== null && end   > maxTime) { passes = false; break; }
        }

        if (passes) filtered.push(data);
    }
    return filtered;
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

function isNotScheduled(str) {
  if (!str) return true;
  const lowered = str.toLowerCase();
  return (lowered.includes("not scheduled"));
}


async function hasConflicts(db, sched) {
    const daysArr = new Array(7);
    for(let i = 0; i < 7; i++) {
        daysArr[i] = [];
    }

    for (const [courseID, sectionList] of Object.entries(sched)) {
        let [subjectID, classID] = parseCourseID(courseID);
        for(let sectionID of sectionList) {
            // if(isLecture(sectionID)) {
            //     sectionID = "Lec "+sectionID;
            // } else {
            //     sectionID = "Dis "+sectionID;
            // }
            let daysStr = await getSectionDay(db, subjectID, classID, sectionID);
            let timesStr = await getSectionTime(db, subjectID, classID, sectionID);

            // Skip not-scheduled meetings
            if (isNotScheduled(daysStr) || isNotScheduled(timesStr)) {
                continue;
            }

            let days = getDays(daysStr);
            let times = getTimes(timesStr);


            for(let i = 0; i < days.length; i++) {
                let day = strToDay[days[i]];
                let time = times[i];
                for(const entry of daysArr[day]) {
                    if(hasOverlap(time, entry.time) && entry.courseID !== courseID) {
                        //console.log(time);
                        //console.log(otherTime);
                        return true;
                    }
                }
                daysArr[day].push({time, courseID});
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

function isLecture(sectionID) {
    return !(/[A-Z]/.test(sectionID[sectionID.length-1]));
}

/**
 * Determine if two section IDs belong to the same lecture group.
 * e.g. "1", "1A", "1C", "1E" are the same group.
 * But "1" and "12A" are different groups.
 */
export function sameSectionGroup(id1, id2) {
  // Extract leading digits: "12A" → "12", "1E" → "1"
  const lect1 = id1.match(/^\d+/)?.[0];
  const lect2 = id2.match(/^\d+/)?.[0];

  if (!lect1 || !lect2) {
    // If something malformed, treat them conservatively as different
    return false;
  }

  return lect1 === lect2;
}

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @param {Promise<Array>} courses - array that stores requested course subject ID's and course numbers
 * @param {database} db
 * @returns {Promise<Array>} Array of plain value Maps, where each Map is a possible schedule. Key = subjectID + '+' + classID, and value = [lectureID, discussionID]
 */

export async function getSchedules(db, courses, term="26W", filters=[], settings={ showWaitlist: false, showClosed: false }) {
    const courseMap = {};

    for(let course of courses) {
        let subjectID = course.subjectID;
        let classID = course.classID;
        //Map index
        let courseMapID = subjectID+'+'+classID;
        courseMap[courseMapID] = [];
        const courseData = await getSections(db, subjectID, classID);
        const availData = await filterAvailable(db, subjectID, classID, courseData, settings);
        const prefData = await filterByPreferences(db, subjectID, classID, availData, filters);

        //Find all the root sections
        //Could be Sem Lab Lec, so long as it doesn't end in a letter
        for(let section of prefData) {
            let sectionID = cutSectionID(section['sectionID']);
            if(isLecture(sectionID)) {
                courseMap[courseMapID].push([section['sectionID'], []]);
            }
        }
        //Attach all the subsections to their root sections
        for(let subsection of prefData) {
            let subsectionID = cutSectionID(subsection['sectionID']);
            if(!isLecture(subsectionID)) {
                for(let i = 0; i < courseMap[courseMapID].length; i++) {
                    let sectionID = cutSectionID(courseMap[courseMapID][i][0]);
                    if(sameSectionGroup(sectionID, subsectionID)) {
                        courseMap[courseMapID][i][1].push(subsection['sectionID']);
                        break;
                    }
                }
            }
        }
    }

    let possibilities = getAllPossibilities(courseMap);
    console.log(possibilities);

    const validSchedules = [];
    for(let poss of possibilities) {
        if(!(await hasConflicts(db, poss))) {
            validSchedules.push(poss);
        } else {
            console.log("Conflict detected, skipping schedule");
        }
    }
    return validSchedules;
}
