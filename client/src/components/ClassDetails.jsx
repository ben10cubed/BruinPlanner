import React, { useMemo } from "react";
import "../mainPageCss/ClassDetails.css";

export default function ClassDetails({ sections }) {
  
  const groupedData = useMemo(() => {
    if (!sections) return [];

    // 1. Create a dictionary to hold courses
    const coursesMap = {};

    sections.forEach((sec) => {
      const courseKey = sec.courseId; // e.g., "CS 31"
      const sectionKey = sec.label;   // e.g., "1" or "1A"

      // Initialize Course if missing
      if (!coursesMap[courseKey]) {
        coursesMap[courseKey] = {
          courseId: sec.courseId,
          units: sec.units,
          uniqueSections: {} // We will group sections here by their Label/ID
        };
      }

      // Initialize Section if missing (e.g. "Lecture 1")
      if (!coursesMap[courseKey].uniqueSections[sectionKey]) {
        coursesMap[courseKey].uniqueSections[sectionKey] = {
          ...sec, // Copy static props (Instructor, Enroll, Status)
          meetings: [] // Prepare array for multiple time slots
        };
      }

      // Add the specific meeting time to this section
      coursesMap[courseKey].uniqueSections[sectionKey].meetings.push({
        days: sec.days,
        start: sec.start,
        end: sec.end,
        location: sec.location
      });
    });

    // Convert the Maps into Arrays so React can map() over them
    return Object.values(coursesMap).map(course => ({
      ...course,
      sections: Object.values(course.uniqueSections)
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
                {/* --- SECTIONS LIST --- */}
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
                      
                      {/* MEETING TIMES (Iterate over the grouped times) */}
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
                        <div className="val">{sec.instructor || "TBA"}</div>
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