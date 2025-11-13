//Takes in HTML file that contains class/discussion information and scrapes for desired data.
export function getClassData(classHTML, subjectID, classID) {
    const urlBase = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";
    const subjectCode = "COM SCI";
    const courseID = "35L";
    const term = "25F";
    const regexPatterns = [
        new RegExp("enrollColumn[^>]*>([^<>]*<[^>]*>){2}Select (?<data>[^<]*)</label>", "g"), 
        new RegExp("sectionColumn[^>]*>([^<>]*<[^>]*>){6}\\s*(?<data>[^<]*)<span", "g"),

        //This works if class isn't closed, otherwise it returns undefined, which is fine imo
        //If class is closed, we don't really need the data anyways
        new RegExp("statusColumn[^>]*>([^<>]*<[^>]*>){3}\\s*[^<]*<br( /)?>(?<data>[^<]*(<br( /)?>[^<]*)*)</p>", "g"),
        new RegExp('<div class="statusColumn"[^>]*>.*?</i>\\s*(?<data>[^<]+)', 'g'), 
        new RegExp("waitlistColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("infoColumn[^>]*>([^<>]*<[^>]*>){4}\\s*(?<data>[^<]*)</span>", "g"), 
        //Need to be able to get multiple lines of days
        //Different days can have different times
        new RegExp("dayColumn[^>]*>([^<>]*<[^>]*>){3}\\s*(?<data>[^<]*)</button>", "g"), 

        //@Xavier you probably need to do a check before calculating the time. Sometimes when time is online, it gets messed up
        //I haven't been able to reproduce this bug, but it happened once before
        new RegExp("timeColumn[^>]*>([^<>]*<[^>]*>){7}\\s*(?<data>[^<]*<wbr( /)?>[^<]*)</p>", "g"), 
        //Need to be able to get Online -> Different types of Online. Online Online - Asynchronous   Online - Recorded
        //I made a small change to the regex to allow for commas in location. Some of the locations have commas in them
        new RegExp("locationColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<][A-Za-z0-9 ,]*)\\s*</p>", "g"), 
        new RegExp("unitsColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        //This is pretty much fixed now, which is good
        new RegExp("instructorColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*([^<>]*<[^>]*>){0,11}[^<]*)</p>", "g")
    ];
    // Create separate replacement characters for time calculation and storing in database
    const brReplacementChar = "|";
    const brReplacementCharForTime = "-";
    const regexRemoveBreaks = new RegExp("<w?br\\s*/?>", "g");
    const regexTimeCleanup = new RegExp(`^(?<startHour>[0-9]{1,2})(?<startMinutes>(:[0-9]{2})?)(?<startDayPart>(a|p)m)${brReplacementCharForTime}-(?<endHour>[0-9]{1,2})(?<endMinutes>(:[0-9]{2})?)(?<endDayPart>(a|p)m)$`);
    const indexTimeColumn = 7; // Index of time column in allMatches array (later in code)

    // TODO: Regex other information such as "No Waitlist, 0 of 40 Taken"
    
    // Retrieve all matches from each pattern into allMatches. This matches the form [enrollMatches[], sectionMatches[], ...]
    let allMatches = [];
    for (let i = 0; i < regexPatterns.length; i++) {
        let patternMatches = [];
        if (i === indexTimeColumn){ // Retrieve start/end times from timeColumn
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                let timeSlot = match.groups.data.replace(regexRemoveBreaks, brReplacementCharForTime).match(regexTimeCleanup);
                let startTime = convertTo24Hour(timeSlot.groups.startHour, timeSlot.groups.startMinutes.slice(1), timeSlot.groups.startDayPart); // Convert time to 24hr format
                patternMatches.push(startTime);
            }
            allMatches.push(patternMatches); // Push start times to allMatches
            patternMatches = []; // Reset patternMatches for end times
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                let timeSlot = match.groups.data.replace(regexRemoveBreaks, brReplacementCharForTime).match(regexTimeCleanup);
                let endTime = convertTo24Hour(timeSlot.groups.endHour, timeSlot.groups.endMinutes.slice(1), timeSlot.groups.endDayPart); // Convert time to 24hr format
                patternMatches.push(endTime);
            }
        }
        else{
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                patternMatches.push(match.groups.data.replace(regexRemoveBreaks, brReplacementChar).trim());
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
            if (allMatches[i][j] == null){  // If a value is undefined/null, set it as an empty string
                individualClassData.push("");
            }
            else{
                individualClassData.push(allMatches[i][j]);
            }
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