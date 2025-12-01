export default function SaveModal({
  visible,
  mode,
  setMode,
  nameNew,
  setNameNew,
  nameExisting,
  setNameExisting,
  existingNames,
  onSave,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Save Schedule</h2>

        <label>
          <input
            type="radio"
            checked={mode === "new"}
            onChange={() => setMode("new")}
          />
          Save as new schedule
        </label>

        {mode === "new" && (
          <input
            className="modal-input"
            value={nameNew}
            onChange={e => setNameNew(e.target.value)}
            placeholder="Enter schedule name"
          />
        )}

        <hr />

        <label>
          <input
            type="radio"
            checked={mode === "existing"}
            onChange={() => setMode("existing")}
          />
          Save to existing schedule
        </label>

        {mode === "existing" && (
          <select
            className="modal-input"
            value={nameExisting}
            onChange={e => setNameExisting(e.target.value)}
          >
            <option value="">Select existing schedule</option>
            {existingNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}

        <div className="modal-buttons">
          <button onClick={onSave}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
