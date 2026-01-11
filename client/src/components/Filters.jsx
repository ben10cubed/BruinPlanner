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

const TIMES = ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Added = [] as a safeguard to prevent "cannot read length of undefined"
export default function Filters({ priorities = [], setPriorities }) {
  
  const addFilter = () => {
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
      newPriorities[index].id = newValue;
      if (newValue === "no_early_classes") newPriorities[index].value = "10am";
      else if (newValue === "no_late_classes") newPriorities[index].value = "2pm";
      else if (newValue === "no_classes_on_day") newPriorities[index].value = "Friday";
      else newPriorities[index].value = "";
    } else {
      newPriorities[index][field] = newValue;
    }
    setPriorities(newPriorities);
  };

  return (
    <div className="filters-container">
      {/* Header with Title and Clear Button */}
      <div className="filters-header">
        <h3 className="filters-title">Schedule Priorities</h3>
        {priorities.length > 0 && (
          <button className="clear-filters-link" onClick={clearAll}>
            Clear All
          </button>
        )}
      </div>
      
      <div className="filters-list">
        {priorities.map((item, i) => (
          <div key={i} className="priority-row">
            <span className="priority-number">{i + 1}.</span>

            <select
              className="priority-select-main"
              value={item.id}
              onChange={(e) => updateFilter(i, "id", e.target.value)}
            >
              {FILTER_OPTIONS.map((opt) => (
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
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <button className="remove-filter-btn" onClick={() => removeFilter(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-filter-btn" onClick={addFilter}>
        + Add Another Priority
      </button>
    </div>
  );
}