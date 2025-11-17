// server.js  (CJS + compatible fetch)

const express = require("express");
const cors = require("cors");

// Use global fetch if on Node 18+, otherwise lazy-load node-fetch (ESM)
const fetch =
  global.fetch ||
  ((...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args)));

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ---- SERVER-SIDE getSubjectID ----
async function fetchSubjectID(term = "26W") {
  const timestamp = Date.now();
  const url = `https://sa.ucla.edu/ro/ClassSearch/Public/Search/GetSimpleSearchData?term_cd=${term}&ses_grp_cd=&search_type=subject&_=${timestamp}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };

  console.log("Fetching UCLA subjects for term:", term);
  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`UCLA fetch failed: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const htmlPattern = /SearchPanelSetup\('\[(.*)\]'/;
  const match = htmlPattern.exec(text);

  if (!match) {
    console.error("Could not find SearchPanelSetup block. Body snippet:");
    console.error(text.slice(0, 500));
    throw new Error("Failed to find majors in HTML response.");
  }

  const parts = match[1]
    .split(/(?<=\})(?=,\{)/)
    .map((p) => p.replace(/^,\s*/, "").replace(/\\u0026/g, "&"));

  const pattern =
    /\{&quot;label&quot;:&quot;(.*?)&quot;,&quot;value&quot;:&quot;([A-Za-z0-9 &\\-]{7})&quot;\}/;

  const data = [];
  for (const p of parts) {
    const m = pattern.exec(p);
    if (m) {
      const [_, label, value] = m;
      data.push({
        subjectID: value.trim(),
        subjectName: label.trim(),
      });
    }
  }

  if (data.length === 0) {
    throw new Error(
      "No majors found after parsing. Likely entered an invalid term."
    );
  }

  return data;
}

// ---- API route ----
app.get("/api/subjects", async (req, res) => {
  const term = req.query.term || "26W";
  console.log("GET /api/subjects term:", term);

  try {
    let subjects;

    try {
      // Try REAL UCLA scrape first
      subjects = await fetchSubjectID(term);
      console.log("Subjects fetched from UCLA:", subjects.length);
    } catch (scrapeErr) {
      // If scraping fails, log and fall back so frontend still works
      console.error("Scrape failed, falling back to minimal subjects:", scrapeErr);

      subjects = [
        { subjectID: "COM SCI", subjectName: "Computer Science" },
        { subjectID: "MATH   ", subjectName: "Mathematics" },
        { subjectID: "PHYS   ", subjectName: "Physics" },
        { subjectID: "ECON   ", subjectName: "Economics" },
      ];
    }

    res.json(subjects);
  } catch (err) {
    console.error("Error in /api/subjects outer handler:", err);
    res
      .status(500)
      .json({ error: err.message || "Internal server error in /api/subjects" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
