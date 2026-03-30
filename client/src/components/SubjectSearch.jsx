import React, { useRef, useEffect } from "react";

export default function SubjectSearch({
  subjectQuery,
  setSubjectQuery,
  subjectResults,
  handleSubjectSelect,
  subjectFocused,
  setSubjectFocused,
  isSelecting,
  setIsSelecting,
  isLoading,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.blur();
      setSubjectFocused(false);
    }
  }, [isLoading]);

  return (
    <div className={`search-box-panel${isLoading ? " search-loading" : ""}`}>
      <h3>Subject Search</h3>

      <label>Subject ID</label>
      <input
        ref={inputRef}
        className="subject-input"
        value={subjectQuery}
        placeholder={isLoading ? "Loading..." : "e.g. COM SCI, MATH"}
        disabled={isLoading}
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
