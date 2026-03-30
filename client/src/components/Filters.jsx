import React from "react";
import "../mainPageCss/Filters.css";

const FILTER_OPTIONS = [
  { id: "none", label: "Select a preference..." },
  { id: "no_early_classes", label: "No Classes Before" },
  { id: "no_late_classes", label: "No Classes After" },
  { id: "no_classes_on_day", label: "No Classes on" },
  { id: "compact", label: "Compact Schedule" },
  { id: "min_days", label: "Minimize Days" },
];

const UNIQUE_FILTER_IDS = [
  "no_early_classes",
  "no_late_classes",
  "compact",
  "min_days"
];

const TIMES = ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Filters({ priorities = [], setPriorities, settings, setSettings}) {

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const MAX_FILTERS = 5;

  const addFilter = () => {
    if (priorities.length >= MAX_FILTERS) return;
    setPriorities([...priorities, { id: "none", value: "" }]);
  };

  const removeFilter = (index) => {
    setPriorities(priorities.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setPriorities([]);
  };

  const updateFilter = (index, field, newValue) => {
    const newPriorities = [...priorities];
    if (field === "id") {
      // Block duplicate filter IDs (except no_classes_on_day which supports multiple days)
      const isDuplicate =
        newValue !== "none" &&
        newValue !== "no_classes_on_day" &&
        priorities.some((p, i) => i !== index && p.id === newValue);
      if (isDuplicate) return;

      newPriorities[index].id = newValue;
      if (newValue === "no_early_classes") newPriorities[index].value = "10am";
      else if (newValue === "no_late_classes") newPriorities[index].value = "2pm";
      else if (newValue === "no_classes_on_day") {
        // Default to first day not already in use
        const usedDays = priorities.filter((p, i) => i !== index && p.id === "no_classes_on_day").map(p => p.value);
        newPriorities[index].value = DAYS.find(d => !usedDays.includes(d)) ?? "Monday";
      }
      else newPriorities[index].value = "";
    } else if (field === "value" && newPriorities[index].id === "no_classes_on_day") {
      // Block picking a day already used by another no_classes_on_day filter
      const usedDays = priorities.filter((p, i) => i !== index && p.id === "no_classes_on_day").map(p => p.value);
      if (usedDays.includes(newValue)) return;
      newPriorities[index].value = newValue;
    } else {
      newPriorities[index][field] = newValue;
    }
    setPriorities(newPriorities);
  };

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3 className="filters-title">Schedule Priorities</h3>
        {priorities.length > 0 && (
          <button className="clear-filters-link" onClick={clearAll}>
            Clear All
          </button>
        )}
      </div>

      {/* Toggles*/}
      <div className="global-settings-box">
        <label className="settings-row">
          <input
            type="checkbox"
            checked={settings.showWaitlist}
            onChange={() => toggleSetting("showWaitlist")}
          />
          Show Waitlist Classes
        </label>
        <label className="settings-row">
          <input
            type="checkbox"
            checked={settings.showClosed}
            onChange={() => toggleSetting("showClosed")}
          />
          Show Closed Classes
        </label>
      </div>

      <hr />

      <div className="filters-list">
        {priorities.map((item, i) => {
          const usedUniqueIds = priorities
            .filter((_, idx) => idx !== i)
            .map(p => p.id)
            .filter(id => id !== "no_classes_on_day" && id !== "none");
          const daysTakenByOthers = priorities
            .filter((_, idx) => idx !== i)
            .filter(p => p.id === "no_classes_on_day")
            .map(p => p.value);
          const allDaysBlockedByOthers = DAYS.every(d => daysTakenByOthers.includes(d));
          const availableOptions = FILTER_OPTIONS.filter(opt => {
            if (opt.id === "none") return true;
            if (opt.id === "no_classes_on_day") {
              return item.id === "no_classes_on_day" || !allDaysBlockedByOthers;
            }
            return !usedUniqueIds.includes(opt.id);
          });

          return (
            <div key={i} className="priority-row">
              <span className="priority-number">{i + 1}.</span>

              <select
                className="priority-select-main"
                value={item.id}
                onChange={(e) => updateFilter(i, "id", e.target.value)}
              >
                {availableOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>

              {(item.id === "no_early_classes" || item.id === "no_late_classes") && (
                <select
                  className="priority-select-param"
                  value={item.value}
                  onChange={(e) => updateFilter(i, "value", e.target.value)}
                >
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}

              {item.id === "no_classes_on_day" && (
                <select
                  className="priority-select-param"
                  value={item.value}
                  onChange={(e) => updateFilter(i, "value", e.target.value)}
                >
                  {DAYS.map(d => (
                    <option key={d} value={d} disabled={daysTakenByOthers.includes(d)}>
                      {d} {daysTakenByOthers.includes(d) ? "(Already Selected)" : ""}
                    </option>
                  ))}
                </select>
              )}

              <button className="remove-filter-btn" onClick={() => removeFilter(i)}>
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button className="add-filter-btn" onClick={addFilter} disabled={priorities.length >= MAX_FILTERS}>
        {priorities.length >= MAX_FILTERS ? `Max ${MAX_FILTERS} priorities reached` : "+ Add Another Priority"}
      </button>
    </div>
  );
}
