/**
 * Fetches and parses UCLA subject codes for a given term.
 * @param {string} term - The UCLA term code (e.g. "26W").
 * @returns {Promise<Array<{classID: string, className: string}>>} List of majors/subjects.
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
        classID: value.trim(),   // was "value"
        className: label.trim()  // was "label"
      });
    }
  }

  if (data.length === 0) {
    throw new Error("No majors found after parsing. Likely entered an invalid term.");
  }

  return data;
}

// Example usage:
// console.log(await getSubjectID("26W"));
