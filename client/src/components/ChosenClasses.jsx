import React from "react";

export default function ChosenClasses({
  chosenClasses,
  handleDelete,
  handleGenerate,
  handleNext,
  handlePrev,
  handleClear,
  handleSave,
  onOpenFilters,
  filters,
  settings,
  handleForceRefresh,
}) {
  return (
    <div className="chosen-classes-panel">

      <div className="chosen-header">
        <h3>Chosen Classes</h3>
      </div>
      <div className="header-actions">
          <button className="preferences-btn" onClick={onOpenFilters}>
            Filters
          </button>
          <button className="generate-btn" onClick={handleGenerate}>
            Generate
          </button>
          <button className="generate-btn" onClick={handleForceRefresh} title="Re-scrape UCLA data (limit: once/min)">
            Refresh
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save
          </button>
        </div>

      <div className="chosen-list">
        {chosenClasses.length === 0 && (
          <div className="empty-msg">No classes chosen.</div>
        )}

        {chosenClasses.map((c) => (
          <div key={c.classID + c.subjectID} className="chosen-item">
            <span>{c.subjectID} {c.full}</span>
            <button
              className="delete-btn"
              onClick={() => handleDelete(c.classID, c.subjectID)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="chosen-fixed-footer">
        <button onClick={handlePrev}>Previous</button>
        <button className="clear-btn" onClick={handleClear}>Clear</button>
        <button onClick={handleNext}>Next</button>
      </div>

    </div>
  );
}
