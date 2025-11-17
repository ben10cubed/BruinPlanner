import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

import {
  initDB,
  createSubjectEntry,
  searchSubjectArea,
  searchClass,
  getClassEntries,
} from "./dbQueries.js";

import { getSubjectID } from "./getSubjectID.js";

/* ------------------------- Helper functions ------------------------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 8;
const END_HOUR = 20;

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
  return [...new Set(res)];
}

function toHHMM(numStr) {
  if (!numStr) return "";
  const s = numStr.padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

function sectionRowToSection(subjectID, classID, className, row) {
  const rawDay = row.day;
  const rawTime = row.time;
  let start = "";
  let end = "";

  if (rawTime && !rawTime.toLowerCase().includes("tbd")) {
    const first = rawTime.split("|")[0];
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

/* ------------------------- Main App ------------------------- */

export default function App() {
  const [page, setPage] = useState("login");
  const [db, setDb] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Initialize DB + load subjects
useEffect(() => {
  (async () => {
    try {
      console.log("Starting app init…");
      const dbInstance = await initDB();
      console.log("DB initialized OK");

      const subjects = await getSubjectID("26W");
      console.log("Fetched subjects:", subjects.length);
      console.log("First subject:", subjects[0]);

      for (const subj of subjects) {
        // subj = { subjectID, subjectName }
        createSubjectEntry(dbInstance, [subj.subjectID, subj.subjectName]);
      }
      console.log("Inserted subjects into DB");

      setDb(dbInstance);
    } catch (e) {
      console.error("Startup error:", e);
      setDbError(`Failed to initialize DB: ${e.message || e}`);
    } finally {
      setLoadingDb(false);
    }
  })();
}, []);


  if (loadingDb) return <div>Loading database...</div>;
  if (dbError) return <div>{dbError}</div>;

  return (
    <div>
      {page === "login" ? (
        <LoginPage onLogin={() => setPage("main")} />
      ) : (
        <MainPage db={db} />
      )}
    </div>
  );
}

/* ------------------------- Login Page ------------------------- */

function LoginPage({ onLogin }) {
  return (
    <div className="login-card">
      <h2>Dummy Login</h2>
      <p>Click to continue to the scheduler.</p>
      <button onClick={onLogin}>Login</button>
    </div>
  );
}

/* ------------------------- Main Page ------------------------- */

function MainPage({ db }) {
  const [subjectQuery, setSubjectQuery] = useState("");
  const [subjectResults, setSubjectResults] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [classQuery, setClassQuery] = useState("");
  const [courseResults, setCourseResults] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  /* --- Subject autocomplete search --- */
  useEffect(() => {
    if (!db) return;

    const q = subjectQuery.trim().toUpperCase();
    if (!q) {
      setSubjectResults([]);
      return;
    }

    try {
      const rows = searchSubjectArea(db, q); // matches subject IDs
      setSubjectResults(rows);
    } catch (e) {
      console.error(e);
      setSubjectResults([]);
    }
  }, [subjectQuery, db]);

  /* --- Class search inside selected subject --- */
  useEffect(() => {
    if (!db || !selectedSubject) {
      setCourseResults([]);
      return;
    }

    const sTerm = classQuery.trim().toUpperCase();

    try {
      const rows = searchClass(db, selectedSubject.subjectID, sTerm);

      const formatted = rows.map((cls) => {
        const entries = getClassEntries(db, cls.subjectID, cls.classID);
        const sections = entries.map((row) =>
          sectionRowToSection(cls.subjectID, cls.classID, cls.className, row)
        );

        return {
          id: `${cls.subjectID}-${cls.classID}`,
          subject: cls.subjectID,
          number: cls.classID,
          title: cls.className,
          sections,
        };
      });

      setCourseResults(formatted);
    } catch (e) {
      console.error(e);
      setCourseResults([]);
    }
  }, [classQuery, selectedSubject, db]);

  /* --- Add/remove timetable sections --- */
  const addSection = (sec) => {
    setSelectedSections((prev) =>
      prev.some((s) => s.id === sec.id) ? prev : [...prev, sec]
    );
  };

  const removeSection = (id) => {
    setSelectedSections((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAll = () => setSelectedSections([]);

  return (
    <div className="main-container">
      {/* Left Panel */}
      <div className="search-panel">
        <h2>Class Search</h2>

        {/* SUBJECT INPUT */}
        <label>Subject ID</label>
        <input
          value={subjectQuery}
          onChange={(e) => {
            setSubjectQuery(e.target.value);
            setSelectedSubject(null);
            setCourseResults([]);
          }}
          placeholder="e.g. COM SCI, MATH"
        />

        {subjectResults.length > 0 && (
          <div className="dropdown">
            {subjectResults.map((s) => (
              <div
                key={s.subjectID}
                className="dropdown-item"
                onClick={() => {
                  setSelectedSubject(s);
                  setSubjectQuery(`${s.subjectID} – ${s.subjectName}`);
                  setSubjectResults([]);
                }}
              >
                <strong>{s.subjectID}</strong> — {s.subjectName}
              </div>
            ))}
          </div>
        )}

        {/* CLASS INPUT */}
        <label>Class (Number or Title)</label>
        <input
          value={classQuery}
          onChange={(e) => setClassQuery(e.target.value)}
          disabled={!selectedSubject}
          placeholder="e.g. 31 or Linear Algebra"
        />

        <div className="search-results">
          <h4>Search Results</h4>

          {selectedSubject && courseResults.length === 0 && (
            <p>No matching classes.</p>
          )}

          {courseResults.map((c) => (
            <div key={c.id} className="course-card">
              <strong>
                {c.subject} {c.number}
              </strong>{" "}
              — {c.title}
              <div style={{ marginLeft: "10px", marginTop: "4px" }}>
                {c.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="section-row"
                  >
                    <span>
                      {sec.label}: {sec.days.join(", ")} {sec.start}-{sec.end}
                      {sec.location ? ` @ ${sec.location}` : ""}
                    </span>
                    <button onClick={() => addSection(sec)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="selection-panel">
        <h3>Timetable Preview</h3>

        <Timetable sections={selectedSections} />

        <div className="selection-list">
          <div className="list-header">
            <strong>Selected Sections</strong>
            <button onClick={clearAll}>Clear</button>
          </div>

          {selectedSections.length === 0 && <p>None yet.</p>}

          {selectedSections.map((s) => (
            <div key={s.id} className="selected-item">
              <span>
                {s.courseId} {s.label} — {s.start}-{s.end}
              </span>
              <button onClick={() => removeSection(s.id)}>X</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Timetable Component ------------------------- */

function Timetable({ sections }) {
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
      {sections.map((sec) =>
        sec.days.map((day) => {
          const color = colorMap.get(sec.courseId);
          return (
            <div
              key={`${sec.id}-${day}`}
              className="time-block"
              style={{
                background: `${color}33`,
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
