import React, { useRef, useState } from "react";

export default function ClassSearch({
  classQuery,
  setClassQuery,
  classResults,
  handleAddClass,
  classFocused,
  setClassFocused,
  isLoading,
}) {
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isOpen = classFocused && classResults.length > 0;

  function selectClass(course) {
    handleAddClass(course);
    setClassQuery(course.full);
    setActiveIndex(-1);
    setClassFocused(false);
  }

  function handleKeyDown(event) {
    if (!isOpen) {
      if (event.key === "ArrowDown" && classResults.length > 0) {
        event.preventDefault();
        setClassFocused(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, classResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectClass(classResults[activeIndex]);
    } else if (event.key === "Escape") {
      setActiveIndex(-1);
      setClassFocused(false);
    }
  }

  return (
    <div className={`search-box-panel${isLoading ? " search-loading" : ""}`}>
      <h3>Class Search</h3>

      <label htmlFor="class-search">Class ID</label>
      <input
        ref={inputRef}
        id="class-search"
        value={classQuery}
        placeholder={isLoading ? "Loading..." : "e.g. 31, 151B, 132"}
        disabled={isLoading}
        role="combobox"
        aria-autocomplete="list"
        aria-controls="class-results"
        aria-expanded={isOpen}
        aria-activedescendant={activeIndex >= 0 ? `class-result-${activeIndex}` : undefined}
        onFocus={() => {
          setClassFocused(true);
          setActiveIndex(-1);
        }}
        onBlur={() => window.setTimeout(() => setClassFocused(false), 100)}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setClassFocused(true);
          setClassQuery(e.target.value);
          setActiveIndex(-1);
        }}
        className="class-input"
      />

      {isOpen && (
        <div id="class-results" className="dropdown" role="listbox" aria-label="Class results">
          {classResults.map((c, index) => (
            <button
              key={c.classID}
              id={`class-result-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`dropdown-item${index === activeIndex ? " active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectClass(c)}
            >
              {c.full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
