import React, { useState, useMemo } from "react";
import "./App.css";

// Mock class data
const ALL_CLASSES = [
  {
    id: "COMSCI-31",
    subject: "COM SCI",
    number: "31",
    title: "Introduction to Computer Science I",
    sections: [
      {
        id: "COMSCI-31-LEC1",
        label: "LEC 1",
        days: ["Mon", "Wed", "Fri"],
        start: "10:00",
        end: "10:50",
        location: "Boelter 3400"
      },
      {
        id: "COMSCI-31-LEC2",
        label: "LEC 2",
        days: ["Mon", "Wed", "Fri"],
        start: "12:00",
        end: "12:50",
        location: "Boelter 3400"
      }
    ]
  },
  {
    id: "MATH-33A",
    subject: "MATH",
    number: "33A",
    title: "Linear Algebra",
    sections: [
      {
        id: "MATH-33A-LEC1",
        label: "LEC 1",
        days: ["Tue", "Thu"],
        start: "09:30",
        end: "10:45",
        location: "MS 4000"
      },
      {
        id: "MATH-33A-LEC2",
        label: "LEC 2",
        days: ["Tue", "Thu"],
        start: "14:00",
        end: "15:15",
        location: "MS 4000"
      }
    ]
  },
  {
    id: "PHY-1A",
    subject: "PHYSICS",
    number: "1A",
    title: "Intro Physics",
    sections: [
      {
        id: "PHY-1A-LEC1",
        label: "LEC 1",
        days: ["Mon", "Wed"],
        start: "11:00",
        end: "12:15",
        location: "PAB 1234"
      },
      {
        id: "PHY-1A-LEC2",
        label: "LEC 2",
        days: ["Tue", "Thu"],
        start: "11:00",
        end: "12:15",
        location: "PAB 1234"
      }
    ]
  }
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 8;
const END_HOUR = 20;

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function App() {
  const [page, setPage] = useState("login");
  return (
    <div>
      {page === "login" ? (
        <LoginPage onLogin={() => setPage("main")} />
      ) : (
        <MainPage />
      )}
    </div>
  );
}

/* LOGIN PAGE */
function LoginPage({ onLogin }) {
  return (
    <div className="login-card">
      <h2>Dummy Login</h2>
      <p>Placeholder only. Click to continue to the scheduler.</p>
      <button onClick={onLogin}>Login</button>
    </div>
  );
}

/* MAIN PAGE */
function MainPage() {
  const [subjectQuery, setSubjectQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);

  const filteredCourses = useMemo(() => {
    const s = subjectQuery.trim().toLowerCase();
    const c = classQuery.trim().toLowerCase();
    return ALL_CLASSES.filter((course) => {
      const subjectMatches = !s || course.subject.toLowerCase().includes(s);
      const classMatches =
        !c ||
        course.number.toLowerCase().includes(c) ||
        course.title.toLowerCase().includes(c);
      return subjectMatches && classMatches;
    });
  }, [subjectQuery, classQuery]);

  const handleAddSection = (course, section) => {
    setSelectedSections((prev) => {
      if (prev.some((s) => s.id === section.id)) return prev;
      return [...prev, { ...section, courseId: course.id, courseTitle: course.title }];
    });
  };

  const handleRemoveSection = (id) => {
    setSelectedSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClear = () => setSelectedSections([]);

  return (
    <div className="main-container">
      {/* LEFT SEARCH PANEL */}
      <div className="search-panel">
        <h2>Class Search</h2>

        <div className="search-box">
          <h4>Search by Subject & Class</h4>
          <label>Subject ID</label>
          <input
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            placeholder="e.g. COM SCI, MATH, PHYSICS"
          />
          <label>Class (Number or Title)</label>
          <input
            value={classQuery}
            onChange={(e) => setClassQuery(e.target.value)}
            placeholder="e.g. 31 or Linear Algebra"
          />
        </div>

        <div className="search-results">
          <h4>Search Results</h4>
          {filteredCourses.length === 0 && <p>No matching courses.</p>}
          {filteredCourses.map((course) => (
            <div key={course.id} className="course-card">
              <strong>
                {course.subject} {course.number}
              </strong>{" "}
              — {course.title}
              <div style={{ marginLeft: "10px", marginTop: "2px" }}>
                {course.sections.map((sec) => (
                  <div
                    key={sec.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "2px"
                    }}
                  >
                    <span>
                      {sec.label}: {sec.days.join(", ")} {sec.start}-{sec.end} @{" "}
                      {sec.location}
                    </span>
                    <button onClick={() => handleAddSection(course, sec)}>
                      Add to timetable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="selection-panel">
        <h3>Timetable Preview</h3>
        <Timetable sections={selectedSections} />

        <div className="selection-list">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Selected Sections</strong>
            <button onClick={handleClear}>Clear</button>
          </div>
          {selectedSections.length === 0 && <p>None yet.</p>}
          {selectedSections.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "4px"
              }}
            >
              <span>
                {s.courseId} {s.label} — {s.days.join(", ")} {s.start}-{s.end}
              </span>
              <button onClick={() => handleRemoveSection(s.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* TIMETABLE */
function Timetable({ sections }) {
  const COLORS = [
    "#2563eb", "#16a34a", "#dc2626", "#eab308", "#9333ea",
    "#f97316", "#0ea5e9", "#10b981", "#d946ef", "#f43f5e",
    "#3b82f6", "#a16207", "#6d28d9", "#059669", "#ef4444",
    "#0284c7", "#ca8a04", "#7c3aed", "#facc15", "#ea580c"
  ];

  const colorMap = useMemo(() => {
    const map = new Map();
    let idx = 0;
    for (const sec of sections) {
      const key = sec.courseId || sec.subject + sec.number || sec.title;
      if (!map.has(key)) {
        map.set(key, COLORS[idx % COLORS.length]);
        idx++;
      }
    }
    return map;
  }, [sections]);

  const getRowFromTime = (time) => {
    const [h, m] = time.split(":").map(Number);
    return (h - START_HOUR) * 4 + Math.floor(m / 15) + 1;
  };

  // Define visible time range (8 AM to 6 PM)
  const visibleEndHour = 18;

  // Determine if any classes go beyond 6 PM — extend scrollable grid
  const maxHour =
    sections.length > 0
      ? Math.max(
          ...sections.map((s) => parseInt(s.end.split(":")[0]) || visibleEndHour)
        )
      : visibleEndHour;

  const totalRows = (maxHour - START_HOUR) * 4;

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div className="time-col"></div>
        {DAYS.map((d) => (
          <div key={d} className="day-header">{d}</div>
        ))}
      </div>

      <div
        className="timetable-grid"
        style={{
          gridTemplateColumns: `70px repeat(${DAYS.length}, 1fr)`,
          gridTemplateRows: `repeat(${totalRows}, 1fr)`,
          height: `${(visibleEndHour - START_HOUR) * 50}px` // about 10 hours visible
        }}
      >
        {/* Time Labels */}
        {Array.from({ length: (maxHour - START_HOUR) }).map((_, i) => {
          const hour = START_HOUR + i;
          return (
            <div
              key={hour}
              className="time-label"
              style={{ gridRow: `${i * 4 + 1} / span 4`, gridColumn: 1 }}
            >
              {hour}:00
            </div>
          );
        })}

        {/* Empty grid cells */}
        {DAYS.map((_, colIdx) =>
          Array.from({ length: totalRows }).map((_, rowIdx) => (
            <div
              key={`${colIdx}-${rowIdx}`}
              className="grid-cell"
              style={{
                gridColumn: colIdx + 2,
                gridRow: rowIdx + 1
              }}
            />
          ))
        )}

        {/* Class Blocks */}
        {sections.map((sec) =>
          sec.days.map((day) => {
            const col = DAYS.indexOf(day);
            if (col === -1) return null;

            const startRow = getRowFromTime(sec.start);
            const endRow = getRowFromTime(sec.end);
            const color = colorMap.get(sec.courseId || sec.title) || "#3b82f6";

            return (
              <div
                key={`${sec.id}-${day}`}
                className="timetable-block"
                style={{
                  gridColumn: col + 2,
                  gridRow: `${startRow} / ${endRow}`,
                  background: `${color}22`,
                  borderColor: color,
                  color
                }}
              >
                <div className="block-title">{sec.courseId}</div>
                <div className="block-label">{sec.label}</div>
                <div className="block-time">{sec.start}-{sec.end}</div>
                <div className="block-loc">{sec.location}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
