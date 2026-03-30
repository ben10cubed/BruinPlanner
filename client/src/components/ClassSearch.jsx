import React, { useRef, useEffect } from "react";

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

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.blur();
      setClassFocused(false);
    }
  }, [isLoading]);

  return (
    <div className={`search-box-panel${isLoading ? " search-loading" : ""}`}>
      <h3>Class Search</h3>

      <label>Class ID</label>
      <input
        ref={inputRef}
        value={classQuery}
        placeholder={isLoading ? "Loading..." : "e.g. 31, 151B, 132"}
        disabled={isLoading}
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
  );
}
