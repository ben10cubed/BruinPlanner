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



// ---------------- MAIN FUNCTION ----------------

/*inputs
    subject_code: subject ID (e.g. "COM SCI") - retrieved from Ben's code
    course_ID: course number (e.g. "35L") - retrieved from Ben's code
    term: e.g. "26W" - set manually
    lecture_num: optional parameter; if it is entered, then it returns the discussion sections corresponding to that lecture. If not, then it just returns the lectures
*/

export async function fetchCourse(subject_code, course_ID, term, lecture_num = null) {
    const url_base = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";

    const Token = generateToken(subject_code, course_ID);

    const model = {
        Term: term,
        SubjectAreaCode: subject_code,
        CatalogNumber: getCatalogStrPadded(course_ID),
        IsRoot: lecture_num == null,
        SessionGroup: "%",
        ClassNumber: lecture_num === null ? null : ` 00${lecture_num}  `,
        SequenceNumber: null,
        Path: getSubjectCodeWithoutSpace(subject_code) + getCatalogStr(course_ID),
        MultiListedClassFlag: isMultiListed(course_ID),
        Token
    };

    const model_encoded = new URLSearchParams({ model: JSON.stringify(model) }).toString();

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

    const FilterFlags_encoded = new URLSearchParams({
        FilterFlags: JSON.stringify(FilterFlags)
    }).toString();

    // unique “timestamp” and extra random param
    const timestamp = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    const url = `${url_base}${model_encoded}&${FilterFlags_encoded}&_=${timestamp}&r=${Math.floor(Math.random() * 1e6)}`;

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/117.0.2045.43"
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    const headers = {
        "User-Agent": randomUA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://sa.ucla.edu/ro/Public/SOC/Results",
        "X-Requested-With": "XMLHttpRequest",
        "Connection": "keep-alive"
    };

    try {
        const response = await fetch(url, { headers });
        return await response.text();
    } catch (err) {
        console.error("Request failed:", err);
        return null;
    }
}
// console.log(await fetchCourse("MGMTEX", "260B", "26W"));