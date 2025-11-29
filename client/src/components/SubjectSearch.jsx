import React from "react";

export default function SubjectSearch({
  subjectQuery,
  setSubjectQuery,
  subjectResults,
  handleSubjectSelect,
  subjectFocused,
  setSubjectFocused,
  isSelecting,
  setIsSelecting,
}) {
  return (
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
  );
}
