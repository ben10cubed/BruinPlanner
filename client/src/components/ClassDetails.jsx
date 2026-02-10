import React, { useMemo, useState } from "react";
import "../mainPageCss/ClassDetails.css";

// --- Sub-component for individual expandable sections ---
const SectionRow = ({ sec, formatDays, formatTime }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    // Added width: "100%" and boxSizing to ensure it fills the space
    <div className="component-row" style={{ width: "100%", boxSizing: "border-box" }}>
      <div 
        className="component-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span className="section-label">
          <span style={{ marginRight: "8px", fontSize: "0.8em" }}>
            {isExpanded ? "▼" : "▶"}
          </span>
          Section {sec.label}
        </span>
        
        {sec.status && (
          <span className={`status-text ${sec.status.split('|')[0].toLowerCase()}`}>
            {sec.status.split('|')[0]}
            {sec.waitlist && sec.waitlist !== "0" && ` (WL: ${sec.waitlist})`}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="component-details" style={{ marginTop: "10px", paddingLeft: "15px", borderLeft: "2px solid #eee" }}>
          
          <div className="info-block time-block">
            <span className="sub-label">Time & Location</span>
            {sec.meetings.map((meet, mIdx) => (
              <div key={mIdx} className="meeting-mini-row">
                <span className="meeting-time">
                  {formatDays(meet.days)} {formatTime(meet.start, meet.end)}
                </span>
                <span className="meeting-loc">
                   {meet.location || "TBA"}
                </span>
              </div>
            ))}
          </div>

          <div className="info-block">
            <span className="sub-label">Instructor</span>
            <div className="val" style={{ display: 'flex', flexDirection: 'column' }}>
              {!sec.instructor ? "TBA" : (
                sec.instructor.split('|').map((inst, i) => (
                  <span key={i} className="instructor-name">
                    {inst.trim()}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="info-block">
              <span className="sub-label">Enrolled</span>
              <div className="val">{sec.enroll || "-"}</div>
          </div>

        </div>
      )}
    </div>
  );
};

export default function ClassDetails({ sections }) {
  
  const groupedData = useMemo(() => {
    if (!sections) return [];

    const dayOrder = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };

    const compareSections = (a, b) => {
      const labelA = a.label || "";
      const labelB = b.label || "";
      const regex = /(\d+)([A-Za-z]*)/;
      
      const matchA = labelA.match(regex);
      const matchB = labelB.match(regex);

      if (!matchA || !matchB) return labelA.localeCompare(labelB);

      const numA = parseInt(matchA[1], 10);
      const suffixA = matchA[2];
      const numB = parseInt(matchB[1], 10);
      const suffixB = matchB[2];

      if (numA !== numB) return numA - numB;
      if (!suffixA && suffixB) return -1; 
      if (suffixA && !suffixB) return 1;
      return suffixA.localeCompare(suffixB);
    };

    const coursesMap = {};

    sections.forEach((sec) => {
      const courseKey = sec.courseId;
      const sectionKey = sec.label;

      if (!coursesMap[courseKey]) {
        coursesMap[courseKey] = {
          courseId: sec.courseId,
          units: sec.units,
          uniqueSections: {}
        };
      } else {
        if (coursesMap[courseKey].units === "0.0" && sec.units !== "0.0") {
            coursesMap[courseKey].units = sec.units;
        }
      }

      if (!coursesMap[courseKey].uniqueSections[sectionKey]) {
        coursesMap[courseKey].uniqueSections[sectionKey] = {
          ...sec,
          meetings: []
        };
      }

      const currentSection = coursesMap[courseKey].uniqueSections[sectionKey];

      const existingMeeting = currentSection.meetings.find(
        (m) => m.start === sec.start && m.end === sec.end && m.location === sec.location
      );

      if (existingMeeting) {
        const mergedDays = [...existingMeeting.days, ...sec.days];
        existingMeeting.days = [...new Set(mergedDays)].sort((a, b) => dayOrder[a] - dayOrder[b]);
      } else {
        currentSection.meetings.push({
          days: sec.days, 
          start: sec.start,
          end: sec.end,
          location: sec.location
        });
      }
    });

    return Object.values(coursesMap).map(course => ({
      ...course,
      sections: Object.values(course.uniqueSections).sort(compareSections)
    }));
  }, [sections]);


  const formatTime = (start, end) => {
    if (!start || !end) return "";
    return `${start} - ${end}`;
  };

  const formatDays = (days) => {
    if (!days || days.length === 0) return "";
    return days.join(", "); 
  };

  return (
    // CHANGED: Removed "class-details-panel" class.
    // Replaced with a simple div that takes 100% width to match the timetable.
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <h3>Schedule Details</h3>

      {!groupedData || groupedData.length === 0 ? (
        <p className="empty-msg">No schedule generated yet.</p>
      ) : (
        <div 
          className="details-list" 
          style={{ 
            maxHeight: "300px", 
            overflowY: "auto", 
            width: "100%", // Ensures the list itself is full width
            boxSizing: "border-box" // Prevents padding from breaking width
          }}
        >
          {groupedData.map((course, idx) => (
            <div 
              key={course.courseId + idx} 
              className="detail-card"
              // Ensure individual cards also fill the width
              style={{ width: "100%", boxSizing: "border-box", marginBottom: "10px" }} 
            >
              
              <div className="card-header main-header">
                <h4>{course.courseId}</h4>
                <span className="units-badge">{course.units} Units</span>
              </div>

              <div className="card-body">
                {course.sections.map((sec, sIdx) => (
                   <SectionRow 
                     key={sIdx} 
                     sec={sec} 
                     formatDays={formatDays} 
                     formatTime={formatTime} 
                   />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}