import he from "he";

export async function getClassID(term="26W", subjectID) {
  const urlFirstPageCheck = `https://sa.ucla.edu/ro/public/soc/Results?t=${term}&sBy=subject&subj=${encodeURIComponent(subjectID)}&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex`;
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
    subj_area_cd: subjectID,
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
