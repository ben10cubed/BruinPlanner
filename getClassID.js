/**
 * Fetches UCLA course titles for a given subject and term.
 * @param {string} term - Term code (e.g., "26W")
 * @param {string} subjectId - Subject area code (e.g., "SCAND")
 * @returns {Promise<string[]>} List of course titles.
 */
async function getClasses(term, subjectId) {
  const urlBase = "https://sa.ucla.edu/ro/public/soc/Results/CourseTitlesView?search_by=subject&";

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
    meet_days: "M,T,W,R,F",
    start_time: "8:00 am",
    end_time: "8:00 pm",
    meet_locations: null,
    meet_units: null,
    instructor: null,
    class_career: null,
    impacted: null,
    enrollment_restrictions: null,
    enforced_requisites: null,
    individual_studies: null,
    summer_session: null,
  };

  const modelEncoded = new URLSearchParams({ model: JSON.stringify(model) });
  const filterFlagsEncoded = new URLSearchParams({ FilterFlags: JSON.stringify(filterFlags) });

  const timestamp = Date.now();
  let pageNum = 1;
  let results = [];

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };

  // Loop through paginated results
  while (true) {
    const url = `${urlBase}${modelEncoded}&pageNumber=${pageNum}&${filterFlagsEncoded}&_=${timestamp}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;

    const text = await res.text();
    const regex = /aria-disabled="false">(.*?)</g;
    let matchFound = false;

    for (const match of text.matchAll(regex)) {
      results.push(match[1]);
      matchFound = true;
    }

    if (!matchFound) break;
    pageNum++;
  }

  if (results.length === 0) {
    throw new Error(`No classes found for subject ${subjectId} in term ${term}.`);
  }

  return results;
}

module.exports = { getClasses };