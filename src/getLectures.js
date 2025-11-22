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
    const base = Buffer.from(getTokenStr(subjectCode, courseID), "utf8").toString("base64");
    const salt = Math.floor(Math.random() * 1e6);
    return `${base}${salt}`;
}

async function fetchLectures(subject_code, course_ID, term) {
    const url_base = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";

    const Token = Buffer.from(getTokenStr(subject_code, course_ID), "utf8").toString("base64");

    const model = {
        Term: term,
        SubjectAreaCode: subject_code,
        CatalogNumber: getCatalogStrPadded(course_ID),
        IsRoot: true,
        SessionGroup: "%",
        ClassNumber: null,
        SequenceNumber: null,
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

function generateCourseCode(subjectID, courseID) { //ex: MATH0031A
    // Extract numeric part and letter part
    const match = courseID.match(/^(\d+)([A-Z]*)$/i);
    if (!match) throw new Error("Invalid courseID format");

    let [_, numPart, letterPart] = match;
    // Pad numeric part to 4 digits
    numPart = numPart.padStart(4, '0');
    return subjectID + numPart + letterPart.toUpperCase();
}

function extractLectureIDs(html, courseCode) {
    const regex = new RegExp(`id="(\\d+)_${courseCode}"`, 'g');
    const ids = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

async function fetchDiscussions(subject_code, course_ID, term, lecture_num) {
    // Fetch the main lectures HTML
    const lectureHTML = await fetchLectures(subject_code, course_ID, term);

    // Generate the course code (e.g., "MATH0031A")
    const courseCode = generateCourseCode(subject_code, course_ID);

    // Extract lecture IDs from the HTML
    const ids = extractLectureIDs(lectureHTML, courseCode);
    
    if (!ids || ids.length === 0) {
        console.warn(`No lecture IDs found for ${courseCode}`);
        return null;
    }

    // Pick the lecture ID corresponding to lecture_num
    // Assumes ids are in order: Lec 1 = ids[0], Lec 2 = ids[1], etc.
    const lectureID = ids[lecture_num - 1];
    if (!lectureID) {
        console.warn(`Lecture ID not found for lecture number ${lecture_num}`);
        return null;
    }

    const url_base = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";

    // Generate token (base64) for this lecture
    const Token = Buffer.from(getTokenStr(subject_code, course_ID, lectureID), "utf8").toString("base64");

    const model = {
        Term: term,
        SubjectAreaCode: subject_code,
        CatalogNumber: getCatalogStrPadded(course_ID),
        IsRoot: false,
        SessionGroup: null,
        ClassNumber: ` 00${lecture_num}  `,
        SequenceNumber: "1",
        Path: lectureID,  // Use the unique lecture ID in Path
        MultiListedClassFlag: isMultiListed(course_ID),
        Token: Token
    };

    let model_encoded = new URLSearchParams({ model: JSON.stringify(model) }).toString();

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

    try {
        const response = await fetch(url, { headers });
        const text = await response.text();
        return text;
    } catch (err) {
        console.error("Request failed:", err);
        return null;
    }
}


// ---------------- MAIN FUNCTION ----------------

/*inputs
    subject_code: subject ID (e.g. "COM SCI") - retrieved from Ben's code
    course_ID: course number (e.g. "35L") - retrieved from Ben's code
    term: e.g. "26W" - set manually
    lecture_num: optional parameter; if it is entered, then it returns the discussion sections corresponding to that lecture. If not, then it just returns the lectures
*/

export async function fetchCourse(subject_code, course_ID, term, lecture_num=null) {
    if(lecture_num === null) {
        return fetchLectures(subject_code, course_ID, term);
    }
    return fetchDiscussions(subject_code, course_ID, term, lecture_num);
}

// console.log(await fetchCourse("MGMTEX", "260B", "26W"));