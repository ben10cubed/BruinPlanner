import he from "he";

//Use REGEX to scrape all class related information from fetched HTML
function getClassData(classHTML, subjectID, classID, lecture_num=null) {

    //Order of data in regex
    const Column = Object.freeze({
      ENROLL:     0,
      SECTION:    1,
      STATUS:     2,
      WAITLIST:   3,
      INFO:       4,
      DAY:        5,
      TIME:       6,
      LOCATION:   7,
      UNITS:      8,
      INSTRUCTOR: 9
    });

    const regexPatterns = [
        new RegExp("enrollColumn[^>]*>([^<>]*<[^>]*>){2}Select (?<data>[^<]*)</label>", "g"), 
        new RegExp("sectionColumn[^>]*>([^<>]*<[^>]*>){6}\\s*(?<data>[^<]*)<span", "g"),
        new RegExp('<div\\s+class="statusColumn"([^>]*?)>\\s*<p[^>]*>(?<data>[\\s\\S]*?)<\\/p>\\s*<\\/div>','gi'),
        new RegExp("waitlistColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("infoColumn[^>]*>([^<>]*<[^>]*>){4}\\s*(?<data>[^<]*)</span>", "g"), 
        //Fixed. TODO: Based on Oliver request, even if same time across different days, split it up ie MW|F -> M|W|F
        new RegExp('dayColumn[\\s\\S]*?<div[^>]*?days_data[^>]*?>[\\s\\S]*?<p[^>]*>(?<data>[\\s\\S]*?)<\\/p>','gi'), 
        //Same as above todo
        new RegExp("timeColumn[^>]*>[\\s\\S]*?</div>\\s*<p[^>]*>\\s*(?<data>[\\s\\S]*?)</p>", "gi"),
        //Fixed
        new RegExp('locationColumn[^>]*>\\s*<p[^>]*>(?:(?<data>[\\s\\S]*?))\\s*</p>', 'gi'), 
        new RegExp("unitsColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("instructorColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*([^<>]*<[^>]*>){0,11}[^<]*)</p>", "g")
    ];
    // Create separate replacement characters for time calculation and storing in database
    const brReplacementChar = "|";
    const brReplacementCharForTime = "-";
    const regexRemoveBreaks = new RegExp("<w?br\\s*/?>", "gi");
    const regexWbr = new RegExp("<wbr\\s*/?>", "gi");
    const regexBr = new RegExp("<br\\s*/?>", "gi");
    const regexPipeSpaces = new RegExp("\\s*\\|\\s*", "gi");
    const regexTimeCleanup = new RegExp("(?<hour>[0-9]{1,2})(?<minutes>:[0-9]{2})?(?<dayPart>[ap]m)", "g");
    // const regexTimeCleanup = new RegExp("(?<hour>[0-9]{1,2})(:(?<minutes>[0-9]{2}))?(?<dayPart>(a|p)m)", "g");
    const indexTimeColumn = 6; // Index of time column in allMatches array (later in code)
    
    // Retrieve all matches from each pattern into allMatches. This matches the form [enrollMatches[], sectionMatches[], ...]
    let allMatches = [];
    for (let i = 0; i < regexPatterns.length; i++) {
        let patternMatches = [];
        switch (i){
        case Column.TIME:
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                let timeData = match.groups.data
                        .replace(regexWbr, '')   // remove <wbr>
                        .replace(regexBr, '|')   // convert <br> to '|'
                        .replace(/\s+/g, '')           // remove spaces
                        .replace(regexTimeCleanup, convertTo24Hour);    // convert to 24 hour time format
                // Case 2: detect "Not scheduled"
                if (!timeData && />Not\s*scheduled</i.test(match[0])) {
                    timeData = 'Not scheduled';
                }
                // Case 3: no time or schedule text at all
                if (!timeData) {
                    timeData = 'No time scheduled';
                }
                patternMatches.push(timeData); 
            }
            break;
        case Column.LOCATION:
            /*
                There are two types of locations: Online, Physical
                    1. Online
                        - Has buttons inside regex
                        - And split into Asyn Recorded and just normal Online
                    2. Physical is just splitting by tags
            */
            for (const m of classHTML.matchAll(regexPatterns[i])) {
                let trimmed_data = he.decode(m.groups.data.trim());
                if (trimmed_data.includes("button")) {
                    let trimmed_data = he.decode(m.groups.data.toLowerCase());
                    if (trimmed_data.includes("asynchronous")) {
                        patternMatches.push("Online - Asynchronous");
                    } 
                    else if (trimmed_data.includes("recorded")) {
                        patternMatches.push("Online - Recorded");
                    } 
                    else {
                        patternMatches.push("Online");
                    }
                } else {
                    const cleaned = he.decode(
                        trimmed_data
                            .replace(regexBr, "|")   // turn <br> into pipe
                            .replace(regexPipeSpaces, "|")      // remove spaces around all pipes
                            .replace(/\s+/g, " ")           // collapse remaining multiple spaces
                            .trim()
                    );
                    patternMatches.push(cleaned);
                }
            }
            break;
        case Column.DAY:
            /*
                There are a few types of day allocation: Not Schedule, Days-of-Week, (Some weird ones, such as empty, ---)
                    1. Not Scheduled
                        - Detect prescence
                    2. Days-of-Week
                        - Different time slots split by <br>
                    3. Rest
                        - Group as scheduled
            */
            for (const m of classHTML.matchAll(regexPatterns[i])) {
                let trimmed_data = m.groups.data.trim();

                if (/not\s+scheduled/i.test(trimmed_data)) {
                    patternMatches.push("Not scheduled");
                    continue;
                }

                // Button means normal data
                if (trimmed_data.includes("button")) {
                    const subMatch = trimmed_data.match(/<button[^>]*>([\s\S]*?)<\/button>/i);
                    if (subMatch) {
                        let text = he.decode(
                            subMatch[1]
                                .replace(regexBr, "|")   // convert <br> to |
                                .replace(regexPipeSpaces, "|")      // clean spacing around |
                                .replace(/\s+/g, " ")           // collapse multiple spaces
                                .trim()
                        );
                        patternMatches.push(text);
                    } else {
                        patternMatches.push("Not scheduled");
                    }
                } else {
                    patternMatches.push("Not scheduled");
                }
            }
            break;
        case Column.STATUS:
            /* 
                There are a few types of status: Closed, Cancelled, Waitlist, Open, Tentative (This is my guess S - Suspended, hasn't shown up yet)
                    1. Using a silly method, since formatting is pretty different. Just detect the string
            */
            for (const m of classHTML.matchAll(regexPatterns[i])) {
                const inner = m.groups.data;
                const lower = inner.toLowerCase();
                if (lower.includes("closed by dept")) {
                    patternMatches.push("Closed by Dept");
                    continue;
                }
                if (lower.includes("cancelled")) {
                    patternMatches.push("Cancelled");
                    continue;
                }

                if (lower.includes("waitlist")) {
                    patternMatches.push("Waitlist");
                    continue;
                }

                if (lower.includes("tentative")) {
                    patternMatches.push("Tentative");
                    continue;
                }

                if (lower.includes("suspended")) {
                    patternMatches.push("Suspended");
                    continue;
                }

                let fixed = m.groups.data.trim();
                if (!fixed.endsWith("<")) {
                    fixed += "<";
                }
                const textPieces = [...fixed.matchAll(/>([^<>]+)</g)]
                    .map(x => he.decode(x[1].trim()))
                    .filter(x => x.length > 0);

                const cleaned = textPieces.join("|");
                patternMatches.push(cleaned);
            }
            break;
        case Column.SECTION:
            //Check if discussion number matches lecture number
            if (lecture_num != null) {
                for (const match of classHTML.matchAll(regexPatterns[i])) {
                    let regex_data = he.decode(
                            match.groups.data
                                .replace(regexRemoveBreaks, brReplacementChar)
                                .trim()
                        )

                    //Mismatch between lecture and discussion, return emtpy to inform to fetch a second round
                    if (regex_data.includes(String(lecture_num)) == false) return []
                    patternMatches.push(regex_data);
                }
                break;
            }

        case Column.WAITLIST:
        case Column.INFO:
        case Column.UNITS:
        case Column.INSTRUCTOR:
        default:
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                patternMatches.push(
                    he.decode(
                        match.groups.data
                            .replace(regexRemoveBreaks, brReplacementChar)
                            .trim()
                    )
                );
            }
            break;
        }

        //Push results of one Column into array
        allMatches.push(patternMatches);
    }

    //Safety measure.
    //In case some regex fails and we have non-rectangular matrix
    //If it does fail, it'll mess up the data, but at least the format will be correct
    let maxLength = 0;
    for (const arr of allMatches) {
        if (Array.isArray(arr)) {
            maxLength = Math.max(maxLength, arr.length);
        }
    }

    // Step 2: Pad every list to match the longest length
    for (let i = 0; i < allMatches.length; i++) {
        if (!Array.isArray(allMatches[i])) {
            allMatches[i] = [];
        }

        while (allMatches[i].length < maxLength) {
            allMatches[i].push("");
        }
    }

    // Formats Day Column to split individual days sharing a single time
    // Formats Time Column to match day column splits
    for (let entry = 0; entry < allMatches[Column.DAY].length; entry++){
        if (allMatches[Column.TIME][entry] &&
            allMatches[Column.DAY][entry] &&
            allMatches[Column.TIME][entry][0] != 'N' &&
            allMatches[Column.DAY][entry][0] != 'N'){
            let dayParts = allMatches[Column.DAY][entry].split('|');    // Splits Day Column by | into a list
            let timeParts = allMatches[Column.TIME][entry].split('|');  // Splits Time Column by | into a list
            let locationParts = allMatches[Column.LOCATION][entry].split('|');  // Splits Location Column by | into a list
            let newDayString = "";
            let newTimeString = "";
            let newLocationString = "";
            for (let dayPart = 0; dayPart < dayParts.length; dayPart++){    // For each part of the Day Column (split by |)
                for(const dayChar of dayParts[dayPart]){    // For each individual day in a single day part
                    newDayString += dayChar + "|";  // Separate each individual day by |
                    newTimeString += timeParts[dayPart] + "|";  // For each day, split its respective time by | as well
                    newLocationString += locationParts[dayPart] + "|";  // For each day, split its respective location by | as well
                }
            }
            allMatches[Column.DAY][entry] = newDayString.slice(0, -1);      // Update the day entry
            allMatches[Column.TIME][entry] = newTimeString.slice(0, -1);    // Update the time entry
            allMatches[Column.LOCATION][entry] = newLocationString.slice(0, -1);    // Update the location entry
        }
    }

    const subjectArr = Array(maxLength).fill(subjectID);
    const classArr = Array(maxLength).fill(classID);

    allMatches.unshift(subjectArr, classArr);

    // Convert allMatches into allClassData by flipping rows/columns of the 2d array
    const rotated = Array.from({ length: maxLength }, (_, row) =>
        allMatches.map(col => col[row])
    );
    return rotated;
}

// Convert 12-hour time to 24-hour time in HHMM format (string)
function convertTo24Hour(timeString, hour, minutes, dayPart) {
    if (minutes){
        minutes = minutes.slice(1);
    }
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

// ---------------- FUNCTIONS FROM BEFORE ----------------
function getCatalogStr(courseID) {
    let index1 = 0;
    while (index1 < courseID.length && /[A-Za-z]/.test(courseID[index1])) index1++;

    let index2 = courseID.length - 1;
    while (index2 >= 0 && /[A-Za-z]/.test(courseID[index2])) index2--;
    index2++;

    let prefix = courseID.substring(0, index1);
    let num = courseID.substring(index1, index2);
    let suffix = courseID.substring(index2);

    while (num.length < 4) num = "0" + num;
    return num + suffix + prefix;
}

//Original format was incorrect
//Length is always fixed 8
//Prefix and suffix can both be up to two characters long
//Then pad each of those up to 2 characters
function getCatalogStrPadded(courseID) {
    //Special case scenario
    if (courseID === 'A') {
        return '0000A   ';
    }
    let index1 = 0;
    while (index1 < courseID.length && /[A-Za-z]/.test(courseID[index1])) index1++;

    let index2 = courseID.length - 1;
    while (index2 >= 0 && /[A-Za-z]/.test(courseID[index2])) index2--;
    index2++;

    let prefix = courseID.substring(0, index1).padEnd(2, " ");
    let num = courseID.substring(index1, index2).padStart(4, "0");
    let suffix = courseID.substring(index2).padEnd(2, " ");

    return (num + suffix + prefix);
}

//Previous edition only considered majors where there is one space.
//Fixed this bug -> Consider AN N EA
function getSubjectCodeWithoutSpace(subjectCode) {
    return subjectCode.replaceAll(" ", "");
}

//This still needs to be tested slightly.
//Technically it fails for CM248 STATS, but it does return the correct values
//Maybe this term just doesn't affect the results
function isMultiListed(courseID) {
    for(let i = 0; i < courseID.length; i++) {
        if(courseID[i] == 'M') {
            return "y";
        }
    }
    return "n";
}

function getTokenStr(subjectCode, courseID) {
    return getCatalogStrPadded(courseID)
        + getSubjectCodeWithoutSpace(subjectCode)
        + getCatalogStr(courseID);
}

function generateToken(subjectCode, courseID) {
    // original base64 token
    const base = Buffer.from(getTokenStr(subjectCode, courseID), "utf8").toString("base64");
    // append a small random salt to make it unique each time
    const salt = Math.floor(Math.random() * 1e6);
    return `${base}${salt}`;
}

/*inputs
    subject_code: subject ID (e.g. "COM SCI") - retrieved from Ben's code
    course_ID: course number (e.g. "35L") - retrieved from Ben's code
    term: e.g. "26S" - set manually
    lecture_num: optional parameter; if it is entered, then it returns the discussion sections corresponding to that lecture. If not, then it just returns the lectures
*/

async function fetchCourse(subject_code, course_ID, term="26S", lecture_num=null, seqNum=null) {
    const url_base = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";

    const Token = Buffer.from(getTokenStr(subject_code, course_ID), "utf8").toString("base64");

    const model = {
        Term: term,
        SubjectAreaCode: subject_code,
        CatalogNumber: getCatalogStrPadded(course_ID),
        IsRoot: lecture_num == null ? true : false,
        SessionGroup: "%",
        ClassNumber: lecture_num === null ? null : " 00"+String(lecture_num)+"  ",
        SequenceNumber: seqNum,
        Path: getSubjectCodeWithoutSpace(subject_code) + getCatalogStr(course_ID),
        MultiListedClassFlag: isMultiListed(course_ID), //From testing, this doesn't actually seem to matter as an input
        Token: Token
    };

    let model_encoded = new URLSearchParams({ model: JSON.stringify(model) }).toString();

    //Ben: Modified impacted
    //We want all of these to be null to get unfiltered results
    //We never noticed this, but previously lots of classes were being filtered out
    const FilterFlags = {
        enrollment_status: "O,W,C,X,T,S",
        advanced: "y",
        meet_days: "M,T,W,R,F,S,U",
        start_time: "8:00 am",
        end_time: "10:00 pm",
        meet_locations: null,
        meet_units: null,
        instructor: null,
        class_career: null,
        impacted: null,
        enrollment_restrictions: null,
        enforced_requisites: null,
        individual_studies: null,
        summer_session: null
    };

    let FilterFlags_encoded = new URLSearchParams({
        FilterFlags: JSON.stringify(FilterFlags)
    }).toString();

    const timestamp = Date.now().toString();

    const url = `${url_base}${model_encoded}&${FilterFlags_encoded}&_=${timestamp}`;
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest"
    };

    // console.log("Requesting:", url);

    try {
        const response = await fetch(url, { headers });
        const text = await response.text();

        // console.log("Status:", response.status);

        // Return the HTML text instead of saving it
        return text;
    } catch (err) {
        console.error("Request failed:", err);
        return null;
    }
}

//className is only useful for FIAT LX 19 special case classes
export async function getSectionInfo(subjectID, classID, className="") {
  if (!subjectID || !classID) {
    return [];
  } 

  const tmp_fiat_ID = classID;
  if (subjectID === "FIAT LX" && classID.includes("19")) {
    classID = "19";
  }

  const term = "26S";

  const courseData = await fetchCourse(subjectID, classID, term);
  const allClassData = getClassData(courseData, subjectID, tmp_fiat_ID);

  let discussionData = [];
  for (let i = 1; i <= allClassData.length; i++) {
    if (subjectID === "FIAT LX" && classID === "19") {
        //Name has to match the new fiatlx
        if (allClassData[i-1][2].toLowerCase().includes(className.toLowerCase()) == false) {
            continue;
        }
        discussionData.push(allClassData[i-1]);
    }

    //Most common working fetching seqNum input
    let disHTML = await fetchCourse(subjectID, classID, term, i, "1");
    let classDiscussionData = getClassData(disHTML, subjectID, tmp_fiat_ID, i);

    if (classDiscussionData.length == 0) {
        //Try to fetch with different seqNum
        disHTML = await fetchCourse(subjectID, classID, term, i, null);
        classDiscussionData = getClassData(disHTML, subjectID, tmp_fiat_ID, i);
    }

    if (classDiscussionData.length > 0) {
        discussionData.push(...classDiscussionData);
    }
  }

  if (subjectID === "FIAT LX" && classID.includes("19")) {
    return discussionData
  }
  
  return [...allClassData, ...discussionData];
}
