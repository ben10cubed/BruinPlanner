import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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

  const [subjectFocused, setSubjectFocused] = useState(false);
  const [classFocused, setClassFocused] = useState(false);

  const [chosenClasses, setChosenClasses] = useState([]);

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
  
  function handleAddClass(c) {
  // Avoid duplicates
    if (!chosenClasses.some(x => x.classID === c.classID && c.subjectID === x.subjectID)) {
      setChosenClasses([...chosenClasses, {
          ...c,
          subjectID: selectedSubject.subjectID
      }]);
    }
  }

  function handleDelete(classID, subjectID) {
    setChosenClasses(chosenClasses.filter(c => c.classID !== classID || c.subjectID !== subjectID));
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

  const sections = [
  {
    id: "TEST-CS31",
    courseId: "COM SCI 31",
    label: "Lec 1",
    days: ["Mon", "Wed", "Fri"],
    start: "09:15",
    end: "10:50",
    location: "Boelter 3400"
  },
  {
    id: "TEST-MATH33A",
    courseId: "MATH 33A",
    label: "Lec 2",
    days: ["Tue", "Thu"],
    start: "14:00",
    end: "15:15",
    location: "Math Sciences 4000"
  },
  {
    id: "TEST-MATH32A",
    courseId: "MATH 32A",
    label: "Lec 2",
    days: ["Tue", "Sun", "Fri"],
    start: "10:00",
    end: "11:15",
    location: "Math Sciences 4000"
  },
  {
    id: "TEST-PHYS1A",
    courseId: "PHYSICS 1A",
    label: "Lab",
    days: ["Fri"],
    start: "10:00",
    end: "11:00",
    location: "PAB 1200"
  }
];
//Fix bug of text going outside the bugs
  
  return (
  <div className="page-container">

    {/* -------- TOP ROW: SEARCH BARS -------- */}
    <div className="top-row">

      {/* SUBJECT SEARCH */}
      <div className="search-box-panel">
        <h3>Subject Search</h3>

        <label>Subject ID</label>
        <input
          className="subject-input"
          value={subjectQuery}
          placeholder="e.g. COM SCI, MATH"
          onFocus={() => setSubjectFocused(true)}
          onBlur={() => setSubjectFocused(false)}
          onChange={(e) => {
            setIsSelecting(false);
            setSubjectQuery(e.target.value);
            setSelectedSubject(null);
          }}
        />

        {subjectFocused && subjectResults.length > 0 && (
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

      {/* CLASS SEARCH */}
      <div className="search-box-panel">
        <h3>Class Search</h3>

        <label>Class ID</label>
        <input
          value={classQuery}
          placeholder="e.g. 31, 151B, 003, 132"
          onFocus={() => setClassFocused(true)}
          onBlur={() => setClassFocused(false)}
          onChange={(e) => {
            setClassFocused(true);
            setClassQuery(e.target.value);
          }}
          className="class-input"
        />

        {classFocused && classResults.length > 0 && (
          <div className="dropdown">
            {classResults.map((c) => (
              <div
                key={c.classID}
                className="dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddClass(c);
                  setClassQuery(c.full);
                  setClassFocused(false);
                }}
              >
                {c.full}
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="logout-btn" onClick={onLogout}>Logout</button>

    </div>

    {/* -------- SECOND ROW: TIMETABLE + CHOSEN -------- */}
    <div className="bottom-row">

      {/* PLACEHOLDER TIMETABLE BOX */}
      <div className="timetable-area">
        <Timetable sections={sections} />
      </div>

      {/* CHOSEN CLASSES PANEL */}
      <div className="chosen-classes-panel">
        <h3>Chosen Classes</h3>

        <div className="chosen-list">
          {chosenClasses.length === 0 && (
            <div className="empty-msg">No classes chosen.</div>
          )}

          {chosenClasses.map((c) => (
            <div key={c.classID} className="chosen-item">
              <span>{c.subjectID} {c.full}</span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(c.classID, c.subjectID)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>

  </div>
);


}


function Timetable({ sections }) {
  const [hasWeekend, setHasWeekend] = useState(false);

  // Convert day names → FullCalendar day numbers
  function convertDay(d) {
    const map = {
      Mon: "1",
      Tue: "2",
      Wed: "3",
      Thu: "4",
      Fri: "5",
      Sat: "6",
      Sun: "0",
    };
    let ret = map[d];
    if (ret === '6' || ret === '0') setHasWeekend(true);
    return ret;
  }
  // Convert UCLA sections → FullCalendar events
  const events = useMemo(() =>
    sections.flatMap((sec) =>
      sec.days.map((day) => ({
        id: sec.id + "-" + day,
        title: `${sec.courseId} ${sec.label}`,
        startTime: sec.start,
        endTime: sec.end,
        daysOfWeek: [convertDay(day)],
        extendedProps: {
          location: sec.location,    // ⭐ add this
        }
      }))
    ),
  [sections]);

  function getLatestEndTime(sections) {
  let maxMinutes = 18 * 60; // Default = 6PM

  for (const sec of sections) {
    if (!sec.end) continue;

    const [h, m] = sec.end.split(":").map(Number);
    const minutes = h * 60 + m;

    if (minutes > maxMinutes) {
      maxMinutes = minutes;
    }
  }

  // Round up to the next hour for clean grid
  const roundedHour = Math.ceil(maxMinutes / 60);
  return `${String(roundedHour).padStart(2, "0")}:00:00`;
}

const dynamicSlotMax = getLatestEndTime(sections);

  return (
    <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
      <FullCalendar
        dayHeaderFormat={{
          weekday: 'short',  // "Mon"
          month: undefined,
          day: undefined,
          omitCommas: true
        }}
        firstDay={1}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"

        /* 🚫 Disable week navigation */
        headerToolbar={false}          // hides arrows + buttons
        navLinks={false}               // disable clicking days
        editable={false}               // no drag/move
        selectable={false}


        /* ⏱ Time settings */
        slotDuration="01:00:00"
        slotMinTime="08:00:00"
        slotMaxTime={dynamicSlotMax}
        allDaySlot={false}
        weekends={hasWeekend}

        events={events}
        height="800px"
        eventContent={(info) => {
        const title = info.event.title;
        const location = info.event.extendedProps.location;

        return {
          html: `
            <div style="padding: 2px 4px; font-size: 11px;">
              <div style="font-weight: 600; font-size: 12px;">
                ${title}
              </div>
              <div style="opacity: 0.8;">
                ${location || ""}
              </div>
            </div>
          `
        };
      }}
      />
    </div>
  );
}

