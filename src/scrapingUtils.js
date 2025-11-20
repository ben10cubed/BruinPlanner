//Takes in HTML file that contains class/discussion information and scrapes for desired data.
import he from "he";

/**
 * Fetches and parses UCLA subject codes for a given term.
 * @param {string} term - The UCLA term code (e.g. "26W").
 * @returns {Promise<Array<{subjectID: string, subjectName: string}>>} List of majors/subjects.
 */
export async function getSubjectID(term = "26W") {
  const timestamp = Date.now();
  const url = `https://sa.ucla.edu/ro/ClassSearch/Public/Search/GetSimpleSearchData?term_cd=${term}&ses_grp_cd=&search_type=subject&_=${timestamp}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const htmlPattern = /SearchPanelSetup\('\[(.*)\]'/;
  const match = htmlPattern.exec(text);

  if (!match) {
    throw new Error("Failed to find majors in HTML response.");
  }

  // Split JSON-like chunks similar to the Python version
  const parts = match[1]
    .split(/(?<=\})(?=,\{)/)
    .map((p) => p.replace(/^,\s*/, "").replace(/\\u0026/g, "&"));

  const pattern = /\{&quot;label&quot;:&quot;(.*?)&quot;,&quot;value&quot;:&quot;([A-Za-z0-9 &\-]{7})&quot;\}/;

  const data = [];
  for (const p of parts) {
    const m = pattern.exec(p);
    if (m) {
      const [_, label, value] = m;
      data.push({
        subjectID: value.trim(),   // was "classID"
        subjectName: label.trim()  // was "className"
      });
    }
  }

  if (data.length === 0) {
    throw new Error("No majors found after parsing. Likely entered an invalid term.");
  }

  return data;
}

/*
 * Fetches UCLA course titles for a given subject and term.
 * Cleans double-encoded HTML entities and handles duplicate classIDs intelligently.
 */
export async function getClassID(term, subjectId) {
  const urlFirstPageCheck = `https://sa.ucla.edu/ro/public/soc/Results?t=${term}&sBy=subject&subj=${encodeURIComponent(subjectId)}&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex`;
  const results = [];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
  };

  let lastClassID = null;
  let lastClassEntry = null;

  const splitParts = (name) => name.split(":").map(s => s.trim());
  const hasKeywordAnywhere = (name) => /lecture|seminar/i.test(name);

  async function processText(text) {
    const regex = /aria-disabled="false">(.*?)</g;
    for (const match of text.matchAll(regex)) {
      // Decode twice to handle double-encoded HTML entities like &amp;#39;
      const rawLine = he.decode(he.decode(match[1].trim()));
      if (!rawLine) continue;

      const [classID, ...rest] = rawLine.split(" - ");
      const className = he.decode(he.decode(rest.join(" - ").trim()));
      const trimmedID = (classID || "").trim();
      if (!trimmedID) continue;

      if (trimmedID !== lastClassID) {
        // New course ID
        if (lastClassEntry) results.push(lastClassEntry);
        lastClassID = trimmedID;
        lastClassEntry = { classID: trimmedID, className };
      } else {
        // Duplicate course ID → apply smart selection
        const prev = lastClassEntry.className;
        const curr = className;

        const prevHasKey = hasKeywordAnywhere(prev);
        const currHasKey = hasKeywordAnywhere(curr);

        if (prevHasKey && currHasKey) {
          // Both have Lecture/Seminar → remove last colon-separated part
          const parts = splitParts(curr);
          const shortened = parts.slice(0, -1).join(" : ").trim();
          lastClassEntry = { classID: trimmedID, className: shortened };
        } else if (prevHasKey && !currHasKey) {
          // Only previous has keyword → take current
          lastClassEntry = { classID: trimmedID, className: curr };
        } else if (!prevHasKey && currHasKey) {
          // Only current has keyword → keep previous (do nothing)
          continue;
        } else {
          // Neither has keyword → keep the first
          continue;
        }
      }
    }
  }

  // Fetch first page
  try {
    const response = await fetch(urlFirstPageCheck, { headers });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const text = await response.text();
    await processText(text);
  } catch (err) {
    console.error("Error fetching data:", err.message);
    return [];
  }

  // Paginated results
  const urlFurtherPageCheck = "https://sa.ucla.edu/ro/public/soc/Results/CourseTitlesView?search_by=subject&";
  const model = {
    subj_area_cd: subjectId,
    search_by: "Subject",
    term_cd: term,
    ActiveEnrollmentFlag: "n",
    HasData: "True",
  };
  const filterFlags = {
    enrollment_status: "O,W,C,X,T,S",
    advanced: "y",
    meet_days: "M,T,W,R,F,S,U",
    start_time: "8:00 am",
    end_time: "10:00 pm",
  };

  const modelEncoded = new URLSearchParams({ model: JSON.stringify(model) });
  const filterFlagsEncoded = new URLSearchParams({ FilterFlags: JSON.stringify(filterFlags) });
  const timestamp = Date.now();
  let pageNum = 2;

  while (true) {
    const url = `${urlFurtherPageCheck}${modelEncoded}&pageNumber=${pageNum}&${filterFlagsEncoded}&_=${timestamp}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;

    const text = await res.text();
    const before = results.length;
    await processText(text);
    if (results.length === before) break;
    pageNum++;
  }

  if (lastClassEntry) results.push(lastClassEntry);

  return results.filter(e => e.classID && e.className);
}

//Use REGEX to scrape all class related information from fetched HTML
export function getClassData(classHTML, subjectID, classID) {

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
            let newDayString = "";
            let newTimeString = "";
            for (let dayPart = 0; dayPart < dayParts.length; dayPart++){    // For each part of the Day Column (split by |)
                for(const dayChar of dayParts[dayPart]){    // For each individual day in a single day part
                    newDayString += dayChar + "|";  // Separate each individual day by |
                    newTimeString += timeParts[dayPart] + "|";  // For each day, split its respective time by | as well
                }
            }
            allMatches[Column.DAY][entry] = newDayString.slice(0, -1);      // Update the day entry
            allMatches[Column.TIME][entry] = newTimeString.slice(0, -1);    // Update the time entry
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
    term: e.g. "26W" - set manually
    lecture_num: optional parameter; if it is entered, then it returns the discussion sections corresponding to that lecture. If not, then it just returns the lectures
*/

export async function fetchCourse(subject_code, course_ID, term, lecture_num=null) {
    const url_base = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";

    const Token = Buffer.from(getTokenStr(subject_code, course_ID), "utf8").toString("base64");

    const model = {
        Term: term,
        SubjectAreaCode: subject_code,
        CatalogNumber: getCatalogStrPadded(course_ID),
        IsRoot: lecture_num == null ? true : false,
        SessionGroup: "%",
        ClassNumber: lecture_num === null ? null : " 00"+String(lecture_num)+"  ",
        SequenceNumber: lecture_num == null ? null : "1",
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
