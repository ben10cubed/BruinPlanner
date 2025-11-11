/**
 * Fetches UCLA course titles for a given subject and term.
 * @param {string} term - Term code (e.g., "26W")
 * @param {string} subjectId - Subject area code (e.g., "SCAND")
 * @returns {Promise<string[]>} List of course titles.
 */
export async function getClassID(term, subjectId) {
  //This change is made specifically to accomodate ARTS ED major
  //For some reason, the original link couldn't get data for this major.
  //So to compromise, I do a first page check with this, link.
  //And then for other majors, the next link will take car of following pages.
  const urlFirstPageCheck = `https://sa.ucla.edu/ro/public/soc/Results?t=${term}&sBy=subject&subj=${encodeURIComponent(subjectId)}&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex`;
  let results = [];

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
  };

  try {
    const response = await fetch(urlFirstPageCheck, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const text = await response.text();

    const regex = /aria-disabled="false">(.*?)</g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1].length === 0) continue;
      results.push(match[1]);
    }

  } catch (err) {
    console.error("⚠️ Error fetching UCLA course data:", err.message);
    return [];
  }

  //In case there are multiple pages of results, this link will handle the rest of it.
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
    meet_days: "M,T,W,R,F",
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
    summer_session: null,
  };

  const modelEncoded = new URLSearchParams({ model: JSON.stringify(model) });
  const filterFlagsEncoded = new URLSearchParams({ FilterFlags: JSON.stringify(filterFlags) });

  const timestamp = Date.now();
  let pageNum = 2;


  // Loop through paginated results
  while (true) {
    const url = `${urlFurtherPageCheck}${modelEncoded}&pageNumber=${pageNum}&${filterFlagsEncoded}&_=${timestamp}`;
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

  return results
    .map(item => {
      const [classID, ...rest] = item.split(" - ");
      const className = rest.join(" - ").trim();
      return { classID: classID?.trim() || "", className: className || "" };
    })
    .filter(entry => entry.classID && entry.className);
}

console.log(await getClassID("26W", "BIOL CH"));