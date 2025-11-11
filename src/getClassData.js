import { time } from "node:console";

//Takes in HTML file that contains class/discussion information and scrapes for desired data.
export function getClassData(classHTML, subjectID, classID) {
    const urlBase = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";
    const subjectCode = "COM SCI";
    const courseID = "35L";
    const term = "25F";
    const regexPatterns = [
        new RegExp("enrollColumn[^>]*>([^<>]*<[^>]*>){2}Select (?<data>[^<]*)</label>", "g"), 
        new RegExp("sectionColumn[^>]*>([^<>]*<[^>]*>){6}\\s*(?<data>[^<]*)<span", "g"),
        new RegExp("statusColumn[^>]*>([^<>]*<[^>]*>){3}\\s*[^<]*<br( /)?>(?<data>[^<]*(<br( /)?>[^<]*)*)</p>", "g"),
        new RegExp("statusColumn[^>]*>([^<>]*<[^>]*>){3}\\s*(?<data>[CO])[^<]*(<br( /)?>[^<]*)*</p>", "g"), 
        new RegExp("waitlistColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("infoColumn[^>]*>([^<>]*<[^>]*>){4}\\s*(?<data>[^<]*)</span>", "g"), 
        new RegExp("dayColumn[^>]*>([^<>]*<[^>]*>){3}\\s*(?<data>[^<]*)</button>", "g"), 
        new RegExp("timeColumn[^>]*>([^<>]*<[^>]*>){7}\\s*(?<data>[^<]*<wbr( /)?>[^<]*)</p>", "g"), 
        new RegExp("locationColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<][A-Za-z0-9 ]*)\\s*</p>", "g"), 
        new RegExp("unitsColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("instructorColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g")
    ];
    const regexRemoveBreaks = new RegExp("<w?br\\s*/?>");
    const regexTimeCleanup = new RegExp("^(?<startHour>[0-9]{1,2})(?<startMinutes>(:[0-9]{2})?)(?<startDayPart>(a|p)m)--(?<endHour>[0-9]{1,2})(?<endMinutes>(:[0-9]{2})?)(?<endDayPart>(a|p)m)$");
    const indexTimeColumn = 7; // Index of time column in allMatches array (later in code)

    // TODO: Regex other information such as "No Waitlist, 0 of 40 Taken"
    
    // Retrieve all matches from each pattern into allMatches. This matches the form [enrollMatches[], sectionMatches[], ...]
    let allMatches = [];
    for (let i = 0; i < regexPatterns.length; i++) {
        let patternMatches = [];
        if (i === indexTimeColumn){ // Retrieve start/end times from timeColumn
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                let timeSlot = match.groups.data.replace(regexRemoveBreaks, "-").match(regexTimeCleanup);
                let startTime = convertTo24Hour(timeSlot.groups.startHour, timeSlot.groups.startMinutes.slice(1), timeSlot.groups.startDayPart); // Convert time to 24hr format
                patternMatches.push(startTime);
            }
            allMatches.push(patternMatches); // Push start times to allMatches
            patternMatches = []; // Reset patternMatches for end times
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                let timeSlot = match.groups.data.replace(regexRemoveBreaks, "-").match(regexTimeCleanup);
                let endTime = convertTo24Hour(timeSlot.groups.endHour, timeSlot.groups.endMinutes.slice(1), timeSlot.groups.endDayPart); // Convert time to 24hr format
                patternMatches.push(endTime);
            }
        }
        else{
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                patternMatches.push(match.groups.data.replace(regexRemoveBreaks, "-").trim());
            }
        }
        allMatches.push(patternMatches);
    }

    // Convert allMatches into allClassData by flipping rows/columns of the 2d array
    const minLength = Math.min(...allMatches.map(patternMatchArr => patternMatchArr.length));
    let allClassData = [];
    for (let j = 0; j < allMatches[minLength].length; j++) {
        let individualClassData = [subjectID, classID];
        for (let i = 0; i < allMatches.length; i++) {
            individualClassData.push(allMatches[i][j]);
            // console.log(allMatches[i][j]);
        }
        allClassData.push(individualClassData);
    }
    return allClassData;
}

// Convert 12-hour time to 24-hour time in HHMM format (string)
function convertTo24Hour(hour, minutes, dayPart) {
    let convertedTime = parseInt(hour) * 100;
    if (dayPart === "pm"){
        if (convertedTime !== 1200){
            convertedTime += 1200;
        }
    }
    else{
        if (convertedTime === 1200){
            convertedTime = 0;
        }
    }
    convertedTime += parseInt(minutes) ? parseInt(minutes) : 0;
    return convertedTime.toString().padStart(4, '0');;
}