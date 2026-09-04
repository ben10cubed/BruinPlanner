import React, { useRef, useState } from "react";

export default function SubjectSearch({
  subjectQuery,
  setSubjectQuery,
  subjectResults,
  handleSubjectSelect,
  subjectFocused,
  setSubjectFocused,
  setIsSelecting,
  isLoading,
}) {
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isOpen = subjectFocused && subjectResults.length > 0;

  function selectSubject(subject) {
    setIsSelecting(true);
    handleSubjectSelect(subject);
    setActiveIndex(-1);
    setSubjectFocused(false);
  }

  function handleKeyDown(event) {
    if (!isOpen) {
      if (event.key === "ArrowDown" && subjectResults.length > 0) {
        event.preventDefault();
        setSubjectFocused(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, subjectResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSubject(subjectResults[activeIndex]);
    } else if (event.key === "Escape") {
      setActiveIndex(-1);
      setSubjectFocused(false);
    }
  }

  return (
    <div className={`search-box-panel${isLoading ? " search-loading" : ""}`}>
      <h3>Subject Search</h3>

      <label htmlFor="subject-search">Subject ID</label>
      <input
        ref={inputRef}
        id="subject-search"
        className="subject-input"
        value={subjectQuery}
        placeholder={isLoading ? "Loading..." : "e.g. COM SCI, MATH"}
        disabled={isLoading}
        role="combobox"
        aria-autocomplete="list"
        aria-controls="subject-results"
        aria-expanded={isOpen}
        aria-activedescendant={activeIndex >= 0 ? `subject-result-${activeIndex}` : undefined}
        onFocus={() => {
          setSubjectFocused(true);
          setActiveIndex(-1);
        }}
        onBlur={() => window.setTimeout(() => setSubjectFocused(false), 100)}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setIsSelecting(false);
          setSubjectQuery(e.target.value);
          setActiveIndex(-1);
        }}
      />

      {isOpen && (
        <div id="subject-results" className="dropdown" role="listbox" aria-label="Subject results">
          {subjectResults.map((s, index) => (
            <button
              key={s.subjectID}
              id={`subject-result-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`dropdown-item${index === activeIndex ? " active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSubject(s)}
            >
              {s.subjectName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
