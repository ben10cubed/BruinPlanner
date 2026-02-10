// Fetches subjects from UCLA SOC UI
export async function fetchSubjectID(term = "26S") {
  const timestamp = Date.now();
  const url = `https://sa.ucla.edu/ro/ClassSearch/Public/Search/GetSimpleSearchData?term_cd=${term}&ses_grp_cd=&search_type=subject&_=${timestamp}`;

  const headers = {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };

  const res = await fetch(url, { headers });
  const text = await res.text();

  // Extract the JSON-like pattern inside SearchPanelSetup('...')
  const htmlPattern = /SearchPanelSetup\('\[(.*)\]'/;
  const match = htmlPattern.exec(text);
  if (!match) throw new Error("Failed to extract subject list from UCLA");

  // Split & clean items
  const parts = match[1]
    .split(/(?<=\})(?=,\{)/)
    .map((p) => p.replace(/^,\s*/, "").replace(/\\u0026/g, "&"));

  const pattern =
    /\{&quot;label&quot;:&quot;(.*?)&quot;,&quot;value&quot;:&quot;([A-Za-z0-9 &\\-]{7})&quot;\}/;

  const subjects = [];
  for (const p of parts) {
    const m = pattern.exec(p);
    if (m) {
      subjects.push({
        subjectID: m[2].trim(),
        subjectName: m[1].trim(),
      });
    }
  }

  return subjects;
}
