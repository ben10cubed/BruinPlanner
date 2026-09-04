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
  handleForceRefresh,
  classCount,
  scheduleCount,
  isBusy,
}) {
  const hasClasses = classCount > 0;
  const hasSchedules = scheduleCount > 0;

  return (
    <div className="chosen-classes-panel">

      <div className="chosen-header">
        <h3>Chosen Classes</h3>
      </div>
      <div className="header-actions">
          <button className="preferences-btn" onClick={onOpenFilters} title="Set schedule preferences" disabled={isBusy}>
            Filters
          </button>
          <button className="generate-btn primary-action" onClick={handleGenerate} disabled={!hasClasses || isBusy}>
            {isBusy ? "Generating..." : "Generate"}
          </button>
          <button className="refresh-btn" onClick={handleForceRefresh} title="Re-scrape UCLA data (limit: once/min)" disabled={!hasClasses || isBusy}>
            Refresh
          </button>
          <button className="save-btn" onClick={handleSave} disabled={!hasSchedules || isBusy}>
            Save
          </button>
        </div>

      <div className="chosen-list">
        {chosenClasses.length === 0 && (
          <div className="empty-msg">Choose a subject and class above to start building a schedule.</div>
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
        <button onClick={handlePrev} disabled={!hasSchedules || isBusy}>Previous</button>
        <button className="clear-btn" onClick={handleClear} disabled={!hasClasses || isBusy}>Clear</button>
        <button onClick={handleNext} disabled={!hasSchedules || isBusy}>Next</button>
      </div>

    </div>
  );
}
