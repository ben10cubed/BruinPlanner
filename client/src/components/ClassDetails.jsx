import React, { useMemo } from "react";
import "../mainPageCss/ClassDetails.css";

export default function ClassDetails({ sections }) {
  
  const groupedData = useMemo(() => {
    if (!sections) return [];

    // --- Helper: Sort Days Chronologically ---
    const dayOrder = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };

    // --- Helper: Section Comparator (Lec 1 vs Dis 1A) ---
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

      // 1. Initialize Course
      if (!coursesMap[courseKey]) {
        coursesMap[courseKey] = {
          courseId: sec.courseId,
          units: sec.units,
          uniqueSections: {}
        };
      } else {
        // Fix: Update units if we captured "0.0" previously but found a real value
        if (coursesMap[courseKey].units === "0.0" && sec.units !== "0.0") {
            coursesMap[courseKey].units = sec.units;
        }
      }

      // 2. Initialize Section
      if (!coursesMap[courseKey].uniqueSections[sectionKey]) {
        coursesMap[courseKey].uniqueSections[sectionKey] = {
          ...sec,
          meetings: []
        };
      }

      const currentSection = coursesMap[courseKey].uniqueSections[sectionKey];

      // 3. GROUPING LOGIC: Check for existing meeting with same Time & Location
      const existingMeeting = currentSection.meetings.find(
        (m) => m.start === sec.start && m.end === sec.end && m.location === sec.location
      );

      if (existingMeeting) {
        // CASE A: Match Found -> Merge Days
        const mergedDays = [...existingMeeting.days, ...sec.days];
        // Remove duplicates (Set) and Sort (Mon, Wed, Fri)
        existingMeeting.days = [...new Set(mergedDays)].sort((a, b) => dayOrder[a] - dayOrder[b]);
      } else {
        // CASE B: No Match -> Add New Meeting
        currentSection.meetings.push({
          days: sec.days, // e.g. ["Mon"]
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
    return days.join(", "); // e.g., "Mon, Wed"
  };

  return (
    <div className="class-details-panel">
      <h3>Schedule Details</h3>

      {!groupedData || groupedData.length === 0 ? (
        <p className="empty-msg">No schedule generated yet.</p>
      ) : (
        <div className="details-list">
          {groupedData.map((course, idx) => (
            <div key={course.courseId + idx} className="detail-card">
              
              {/* --- COURSE HEADER --- */}
              <div className="card-header main-header">
                <h4>{course.courseId}</h4>
                <span className="units-badge">{course.units} Units</span>
              </div>

              <div className="card-body">
                {course.sections.map((sec, sIdx) => (
                  <div key={sIdx} className="component-row">
                    
                    {/* Section Header */}
                    <div className="component-header">
                      <span className="section-label">Section {sec.label}</span>
                      {sec.status && (
                        <span className={`status-text ${sec.status.split('|')[0].toLowerCase()}`}>
                          {sec.status.split('|')[0]}
                          {sec.waitlist && sec.waitlist !== "0" && ` (WL: ${sec.waitlist})`}
                        </span>
                      )}
                    </div>

                    {/* Section Details */}
                    <div className="component-details">
                      
                      {/* MEETING TIMES */}
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

                      {/* INSTRUCTOR (Vertical Stack) */}
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}