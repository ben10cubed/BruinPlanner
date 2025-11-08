import React, { useState, useMemo } from "react";

//mock classes just to test

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

//helpers
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
    <div style={{ fontFamily: "sans-serif", padding: "16px" }}>
      {page === "login" ? (
        <LoginPage onLogin={() => setPage("main")} />
      ) : (
        <MainPage />
      )}
    </div>
  );
}




function LoginPage({ onLogin }) {
  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px"
      }}
    >
      <h2>Dummy Login</h2>
      <p style={{ fontSize: "14px", marginBottom: "16px" }}>
        Placeholder only. Click to continue to the scheduler.
      </p>
      <button
        onClick={onLogin}
        style={{
          padding: "10px 16px",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Login
      </button>
    </div>
  );
}




function MainPage() {
  const [subjectQuery, setSubjectQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);

  // filter classes based on search inputs
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


  //just basic class adding function for manual add AFTER schedule generation (hasn't been implemented)
  const handleAddSection = (course, section) => {
    setSelectedSections((prev) => {
      if (prev.some((s) => s.id === section.id)) return prev; // dedupe
      return [
        ...prev,
        {
          ...section,
          courseId: course.id,
          courseTitle: course.title
        }
      ];
    });
  };

  const handleRemoveSection = (id) => {
    setSelectedSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClear = () => {
    setSelectedSections([]);
  };

  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
      {/* LEFT: search + results */}
      <div style={{ flex: 1 }}>
        <h2>Class Search</h2>

        <div
          style={{
            marginBottom: "12px",
            padding: "10px",
            border: "1px solid #eee",
            borderRadius: "8px"
          }}
        >
          <h4>Search by Subject & Class</h4>
          <div style={{ marginBottom: "6px" }}>
            <label
              style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}
            >
              Subject ID
            </label>
            <input
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="e.g. COM SCI, MATH, PHYSICS"
              style={{ width: "100%", padding: "6px", fontSize: "12px" }}
            />
          </div>
          <div>
            <label
              style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}
            >
              Class (Number or Title)
            </label>
            <input
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="e.g. 31 or Linear Algebra"
              style={{ width: "100%", padding: "6px", fontSize: "12px" }}
            />
          </div>
        </div>

        <div
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "8px",
            fontSize: "11px"
          }}
        >
          <h4>Search Results</h4>
          {filteredCourses.length === 0 && <p>No matching courses.</p>}

          {filteredCourses.map((course) => (
            <div
              key={course.id}
              style={{
                borderBottom: "1px solid #f3f3f3",
                paddingBottom: "6px",
                marginBottom: "6px"
              }}
            >
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
                    <button
                      onClick={() => handleAddSection(course, sec)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        cursor: "pointer"
                      }}
                    >
                      Add to timetable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: timetable + selected sections */}
      <div style={{ flex: 1 }}>
        <h3>Timetable Preview</h3>
        <Timetable sections={selectedSections} />

        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            border: "1px solid #eee",
            borderRadius: "8px",
            fontSize: "11px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Selected Sections</strong>
            <button
              onClick={handleClear}
              style={{
                padding: "2px 6px",
                fontSize: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer"
              }}
            >
              Clear
            </button>
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
              <button
                onClick={() => handleRemoveSection(s.id)}
                style={{
                  padding: "1px 6px",
                  fontSize: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  cursor: "pointer"
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}






//basic timetable, might edit later
function Timetable({ sections }) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "4px",
        fontSize: "9px",
        height: "340px",
        maxWidth: "800px"
      }}
    >
      {/*days */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `40px repeat(${DAYS.length}, 1fr)`,
          fontWeight: "bold",
          fontSize: "9px",
          marginBottom: "2px"
        }}
      >
        <div />
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center" }}>
            {d}
          </div>
        ))}
      </div>

      {/* time */}
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: `40px repeat(${DAYS.length}, 1fr)`,
          gridTemplateRows: `repeat(${END_HOUR - START_HOUR}, 1fr)`,
          gap: "1px",
          height: "calc(100% - 16px)"
        }}
      >
        {/* hours, and time "blocks" */}
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
          const hour = START_HOUR + i;
          return (
            <React.Fragment key={hour}>
              <div
                style={{
                  fontSize: "8px",
                  textAlign: "right",
                  paddingRight: "2px"
                }}
              >
                {hour}:00
              </div>
              {DAYS.map((d) => (
                <div
                  key={d + hour}
                  style={{
                    borderTop: "1px solid #f5f5f5",
                    borderLeft: "1px solid #f5f5f5"
                  }}
                />
              ))}
            </React.Fragment>
          );
        })}

        {/* render blocks for selected sections */}
        {sections.map((sec) =>
          sec.days.map((day) => {
            const col = DAYS.indexOf(day);
            if (col === -1) return null;

            const start = timeToMinutes(sec.start);
            const end = timeToMinutes(sec.end);
            const total = (END_HOUR - START_HOUR) * 60;

            const top = ((start - START_HOUR * 60) / total) * 100;
            const height = ((end - start) / total) * 100;

            return (
              <div
                key={sec.id + day}
                style={{
                  position: "absolute",
                  left: `${
                    ((col + 1) / (DAYS.length + 1)) * 100
                  }%`,
                  width: `${
                    (1 / (DAYS.length + 1)) * 100 - 1
                  }%`,
                  top: `${top}%`,
                  height: `${height}%`,
                  borderRadius: "4px",
                  border: "1px solid #555",
                  padding: "2px",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  background: "#eef"
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "7px"
                  }}
                >
                  {sec.courseId}
                </div>
                <div>
                  {sec.label} {sec.start}-{sec.end}
                </div>
                <div>{sec.location}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
