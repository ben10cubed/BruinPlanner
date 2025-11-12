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

function getCatalogStrPadded(courseID) {
    let index1 = 0;
    while (index1 < courseID.length && /[A-Za-z]/.test(courseID[index1])) index1++;

    let index2 = courseID.length - 1;
    while (index2 >= 0 && /[A-Za-z]/.test(courseID[index2])) index2--;
    index2++;

    let prefix = courseID.substring(0, index1);
    let num = courseID.substring(index1, index2);
    let suffix = courseID.substring(index2);

    while (num.length < 4) num = "0" + num;

    if (suffix.length === 0) suffix = " ";

    return (num + suffix + " " + prefix).padEnd(8, " ");
}

function getSubjectCodeWithoutSpace(subjectCode) {
    const idx = subjectCode.indexOf(" ");
    return idx === -1 ? subjectCode : subjectCode.slice(0, idx) + subjectCode.slice(idx + 1);
}

function isMultiListed(courseID) {
    return courseID[0] === "M" ? "y" : "n";
}

function getTokenStr(subjectCode, courseID) {
    return getCatalogStrPadded(courseID)
        + getSubjectCodeWithoutSpace(subjectCode)
        + getCatalogStr(courseID);
}

// ---------------- MAIN FUNCTION ----------------

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
        IsRoot: false,
        SessionGroup: "%",
        ClassNumber: lecture_num === null ? null : " 00"+String(lecture_num)+"  ",
        SequenceNumber: null,
        Path: getSubjectCodeWithoutSpace(subject_code) + getCatalogStr(course_ID),
        MultiListedClassFlag: isMultiListed(course_ID),
        Token: Token
    };

    let model_encoded = new URLSearchParams({ model: JSON.stringify(model) }).toString();

    const FilterFlags = {
        enrollment_status: "O,W,C,X,T,S",
        advanced: "y",
        meet_days: "M,T,W,R,F",
        start_time: "8:00 am",
        end_time: "10:00 pm",
        meet_locations: null,
        meet_units: null,
        instructor: null,
        class_career: null,
        impacted: "N",
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

    //console.log("Requesting:", url);

        try {
        const response = await fetch(url, { headers });
        const text = await response.text();

        console.log("Status:", response.status);

        // Return the HTML text instead of saving it
        return text;
    } catch (err) {
        console.error("Request failed:", err);
        return null;
    }
}
