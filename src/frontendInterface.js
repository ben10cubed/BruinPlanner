import { getSubjectID } from "./getSubjectID.js";
import { getClassID } from "./getClassID.js";
import { getSchedules } from "./getSchedules.js";
import { initDB, createSubjectEntry, searchSubjectArea, searchClass, createClassEntry } from "./dbQueries.js";

const schoolTerm = "26W";
let db = null;

// Function to initialize an instance of the DB + update the subject table
// Return:  no return value
export async function initGlobalDB(){
    if (db == null){
        db = await initDB();
        const subjectID = await getSubjectID(schoolTerm);
        for (let i=0; i<subjectID.length; i++) {
            createSubjectEntry(db, [subjectID[i].subjectID, subjectID[i].subjectName]);
        }
    }
}

// Function to search for subjects given a search term
// Params:  searchTerm: the search term for the subjects you are looking for
// Return:  a list of subjects in the form (e.g.): 
//          [{ subjectID: 'COMM', subjectName: 'Communication (COMM)' },
//          {subjectID: 'COM HLT', subjectName: 'Community Health Sciences (COM HLT)'}]
export async function searchSubjects(searchTerm){
    return searchSubjectArea(db, searchTerm);
}

// Function to update the class table of the requested subjectID (update all class info of that subject)
// Params:  subjectID: the subjectID of the subject whose classes you wish to update
// Return:  no return value
export async function updateSubjectClasses(subjectID) {
    const retrievedClass = await getClassID(schoolTerm, subjectID);
    for (let i = 0; i < retrievedClass.length; i++) {
        createClassEntry(db, [subjectID, retrievedClass[i].classID, retrievedClass[i].className]);
    }
}

// Function to search for classes in a specific subject given a search term
// Params:  subjectID: the subjectID of the subject whose classes you wish to search for
//          searchTerm: the search term for the classes you are looking for
// Return:  a list of classes in the form (e.g.): 
//          [{subjectID: 'COM SCI', classID: '31', className: 'Introduction to Computer Science I'},
//          {subjectID: 'COM SCI', classID: '32', className: 'Introduction to Computer Science II'}]
export async function searchClasses(subjectID, searchTerm){
    return searchClass(db, subjectID, searchTerm);
}

// TODO (after ben gets the server db implementation done)
// Function to save the updated database to the server
export async function saveDB(){

}

//Function to get all possible schedules given a list of courses
//Params: courses: array of courses that the user wants to take
//Example input: courses = [
                        //     ['MATH', '31A'],
                        //     ['MATH', '32A'],
                        //     ['MATH', '131BH']
                        // ];
//Returns: Array of plain value Maps, where each map represents a unique valid schedule:
//          [{
//              courseID#1: [lectureNum, discussionNum],
//              courseID#2: [lectureNum, discussionNum],
//              ...
//          },
//          {
//              courseID#1: [lectureNum, discussionNum],
//              courseID#2: [lectureNum, discussionNum],
//              ...
//          },
//          ...
//          ]
// note: courseID is subjectID+classID. For example, the course ID for MATH 31A would be 'MATH+31A'
//Example output:
// [{
//   'MATH+31A': [ '3', '3F' ],
//   'MATH+32A': [ '4', '4E' ],
//   'MATH+131BH': [ '1', '1A' ]
// },
// {
//   'MATH+31A': [ '3', '3F' ],
//   'MATH+32A': [ '4', '4F' ],
//   'MATH+131BH': [ '1', '1A' ]
// }]
export async function getSchedules(courses) {
    return getSchedules(db, courses);
}

// EXAMPLE IMPLEMENTATION OF frontendInterface
// Run node frontendInterface.js to see example
// Not intended to actually be utilized
async function main() {
    await initGlobalDB();
    let listSubjects = await searchSubjects("CO");
    console.log("Subject List based on search: ");
    console.log(listSubjects);
    await updateSubjectClasses("COM SCI");
    let listClasses = await searchClasses("COM SCI", "3");
    console.log("Class list based on search: ");
    console.log(listClasses);
}

main();