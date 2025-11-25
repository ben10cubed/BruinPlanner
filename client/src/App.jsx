import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

/* ============================================================
   Helper functions for formatting + transforming raw DB rows
   ============================================================
*/

//Fix this, need all 7 days
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 8;
const END_HOUR = 20;

/**
 * Input format: M|W|F -> Split and push days
 */
function normalizeDays(dayStr) {
  if (!dayStr) return [];
  const parts = dayStr.split("|");
  const res = [];
  for (const p of parts) {
    for (const ch of p) {
      if (ch === "M") res.push("Mon");
      if (ch === "T") res.push("Tue");
      if (ch === "W") res.push("Wed");
      if (ch === "R") res.push("Thu");
      if (ch === "F") res.push("Fri");
    }
  }
  // allow duplicates!!!
  // W|W|W => this is valid
  return [...new Set(res)];
}

/** Convert "1300" → "13:00" */
function toHHMM(numStr) {
  if (!numStr) return "";
  const s = numStr.padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

/**
 * Converts a DB "row" for a given section into a consistent
 * "section object" with id, label, days[], start/end, location, etc.
 * Each course's section is uniquely identified by:
 *     subjectID-classID-sectionID
 */
function sectionRowToSection(subjectID, classID, className, row) {
  const rawDay = row.day;
  const rawTime = row.time;
  let start = "";
  let end = "";

  // SOC returns times like "0800-0950" or "0800-0950|1000-1050".
  // If time is "TBD", skip it.
  // BUGGED
  if (rawTime && !rawTime.toLowerCase().includes("tbd")) {
    const first = rawTime.split("|")[0]; // take first meeting time only
    const [s, e] = first.split("-");
    start = toHHMM(s);
    end = toHHMM(e);
  }

  return {
    id: `${subjectID}-${classID}-${row.sectionID}`,
    label: row.sectionID,
    days: normalizeDays(rawDay),
    start,
    end,
    location: row.location || "",
    courseId: `${subjectID} ${classID}`,
    courseTitle: className,
  };
}

/* ============================================================
   App Component — handles DB init + login page switch
   ============================================================
*/

export default function App() {
  const [page, setPage] = useState("login");

  return (
    <div>
      {page === "login" ? (
        <LoginPage onLogin={() => setPage("main")} />
      ) : (
        <MainPage onLogout={() => setPage("login")} />
      )}
    </div>
  );
}

/* ============================================================
   Login Page (dummy)
   ============================================================
*/
function LoginPage({ onLogin }) {
  return (
    <div className="login-card">
      <h2>Dummy Login</h2>
      <p>Click to continue to the scheduler.</p>
      <button onClick={onLogin}>Login</button>
    </div>
  );
}

/* ============================================================
   SUBJECT SEARCH — Database-free frontend,
   uses backend-loaded static subject list
   ============================================================ */

function MainPage({ onLogout }) {
  // The entire subject list fetched once from backend
  const [allSubjects, setAllSubjects] = useState([]);
  // User's input in subject search field
  const [subjectQuery, setSubjectQuery] = useState("");
  // Filtered auto-complete results
  const [subjectResults, setSubjectResults] = useState([]);
  // The chosen subject object { subjectID, subjectName }
  const [selectedSubject, setSelectedSubject] = useState(null);
  // Prevent program to search immediately after a subject is chosen
  const [isSelecting, setIsSelecting] = useState(false);

  const [allClasses, setAllClasses] = useState([]);
  const [classQuery, setClassQuery] = useState("");
  const [classResults, setClassResults] = useState([]);

  /* -------------------------------------------------------------
     Fetch ALL SUBJECTS once, when MainPage loads.
  ------------------------------------------------------------- */
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/subjects");

        if (!res.ok) {
          console.error(`Backend responded but with HTTP ${res.status}`);
          return;
        }

        const data = await res.json();
        setAllSubjects(data);

      } catch (err) {
        const msg = String(err.message || "");
        // Catches error if backend is off
        if (msg.includes("Failed to fetch")) {
          console.log(
            "%c[Frontend] Backend not running (ECONNREFUSED by proxy)",
            "color: orange"
          );
        } else {
          console.error("[Frontend] Unexpected fetch error:", err);
        }
      }
    }
    loadSubjects();
  }, []);
  /* -------------------------------------------------------------
     Frontend-only search algorithm.
  ------------------------------------------------------------- */
  useEffect(() => {
    if (isSelecting) return; // prevent dropdown reopening after selection

    const text = subjectQuery.trim().toUpperCase();

    if (!text) {
      setSubjectResults(allSubjects);
      return;
    }

    const filtered = allSubjects.filter(subj =>
      subj.subjectName.toUpperCase().includes(text)
    );

    setSubjectResults(filtered);
  }, [subjectQuery, allSubjects, isSelecting]);
  /* -------------------------------------------------------------
     When user clicks on one subject from dropdown
  ------------------------------------------------------------- */
  async function handleSubjectSelect(subj) {
    setIsSelecting(true); // prevent search from running
    setSelectedSubject(subj);
    setSubjectQuery(subj.subjectName);
    setSubjectResults([]);
    try {
      const res = await fetch(`/api/classes?subject=${encodeURIComponent(subj.subjectID)}`);

      if (!res.ok) {
        console.error("Failed to load classes:", res.status);
        return;
      }

      const data = await res.json();
      setAllClasses(
        data.map(cls => ({
          ...cls,
          full: `${cls.classID} - ${cls.className}`
        }))
      );
      setClassQuery("");         // reset class search
      setClassResults([]);

    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  }
  
  useEffect(() => {
    const text = classQuery.trim().toUpperCase();

    if (!text) {
      setClassResults(allClasses);
      return;
    }

    const filtered = allClasses.filter(cls =>
      cls.full.toUpperCase().includes(text)
    );

    setClassResults(filtered.slice(0, 8));

  }, [classQuery, allClasses]);
  return (
    <div className="main-container">

      {/* NEW: top navigation bar */}
      <div className="top-bar">
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="search-panel">
        <h2>Subject Search</h2>

        <label>Subject ID</label>
        <input
          className="subject-input"
          value={subjectQuery}
          placeholder="e.g. COM SCI, MATH"
          onChange={(e) => {
            setIsSelecting(false);
            setSubjectQuery(e.target.value);
            setSelectedSubject(null);
          }}
        />

        {subjectResults.length > 0 && (
          <div className="dropdown">
            {subjectResults.map((s) => (
              <div
                key={s.subjectID}
                className="dropdown-item"
                onMouseDown={() => handleSubjectSelect(s)}
              >
                {s.subjectName}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* CLASS SEARCH PANEL */}
      <div className="class-search-panel">
        <h3>Class Search</h3>

        <label>Class ID</label>
        <input
          value={classQuery}
          placeholder="e.g. 31, 151B, 003, 132"
          onChange={(e) => {
            setClassQuery(e.target.value);
          }}
          className="class-input"
        />

        {classResults.length > 0 && (
          <div className="dropdown">
            {classResults.map((c) => (
              <div key={c.classID} className="dropdown-item">
                {c.full}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}


/* ============================================================
   Timetable Component
   ============================================================
   Renders colored blocks for each section on each day.
   Uses useMemo to assign consistent colors per course.
*/

function Timetable({ sections }) {
  // Assign a persistent unique color PER COURSE
  const colorMap = useMemo(() => {
    const colors = [
      "#2563eb", "#16a34a", "#dc2626", "#eab308", "#9333ea",
      "#f97316", "#0ea5e9", "#10b981", "#d946ef", "#f43f5e"
    ];

    const map = new Map();
    let idx = 0;

    sections.forEach((s) => {
      const key = s.courseId;
      if (!map.has(key)) map.set(key, colors[idx++ % colors.length]);
    });

    return map;
  }, [sections]);

  return (
    <div className="timetable">

      {/* For each section, create a block for EACH DAY it meets */}
      {sections.map((sec) =>
        sec.days.map((day) => {
          const color = colorMap.get(sec.courseId);
          return (
            <div
              key={`${sec.id}-${day}`}
              className="time-block"
              style={{
                background: `${color}33`, // transparent version
                borderColor: color,
              }}
            >
              <div>{sec.courseId}</div>
              <div>{sec.label}</div>
              <div>{sec.start}-{sec.end}</div>
              <div>{sec.location}</div>
            </div>
          );
        })
      )}

    </div>
  );
}
