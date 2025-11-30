import React from "react";

export default function ChosenClasses({
  chosenClasses,
  handleDelete,
  handleGenerate,
  handleNext,
  handlePrev,
  handleClear,
  handleSave
}) {
  return (
    <div className="chosen-classes-panel">

      {/* Header */}
      <div className="chosen-header">
        <h3>Chosen Classes</h3>
        <button className="generate-btn" onClick={handleGenerate}>
          Generate
        </button>
        <button className="save-btn" onClick={handleSave}>
          Save
        </button>
      </div>

      {/* Scrollable list */}
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

      {/* FIXED FOOTER BUTTONS */}
      <div className="chosen-fixed-footer">
        <button onClick={handlePrev}>Previous</button>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleNext}>Next</button>
      </div>

    </div>
  );
}
