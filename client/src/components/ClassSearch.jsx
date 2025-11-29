import React from "react";

export default function ClassSearch({
  classQuery,
  setClassQuery,
  classResults,
  handleAddClass,
  classFocused,
  setClassFocused,
}) {
  return (
    <div className="search-box-panel">
      <h3>Class Search</h3>

      <label>Class ID</label>
      <input
        value={classQuery}
        placeholder="e.g. 31, 151B, 003, 132"
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
