import React from "react";
import Filters from "./Filters.jsx";

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
  setFilters,
  settings,
  setSettings,
  handleForceRefresh,
}) {
  
  const removeFilter = (indexToRemove) => {
    const updated = filters.filter((_, i) => i !== indexToRemove);
    setFilters(updated);
  };

  // Helper to format the filter ID into a readable label
  const getFilterLabel = (id) => {
    const labels = {
      "no_early_classes": "No Classes Before",
      "no_late_classes": "No Classes After",
      "no_classes_on_day": "No Classes on",
      "compact": "Compact Schedule",
      "min_days": "Minimize Days",
    };
    return labels[id] || id;
  };

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
        <div className="active-filters-summary">
          {settings.showWaitlist && (
            <span className="filter-tag global" onClick={() => setSettings({...settings, showWaitlist: false})}>
              Show Waitlist Classes <span className="remove-x">✕</span>
            </span>
          )}
          {settings.showClosed && (
            <span className="filter-tag global" onClick={() => setSettings({...settings, showClosed: false})}>
              Show Closed Classes <span className="remove-x">✕</span>
            </span>
          )}
          
          {filters.map((f, i) => {
            if (f.id === "none") return null;
            return (
              <span 
                key={i} 
                className="filter-tag" 
                onClick={() => removeFilter(i)}
                title="Click to remove"
              >
                {getFilterLabel(f.id)} {f.value}
                <span className="remove-x">✕</span>
              </span>
            );
          })}
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
