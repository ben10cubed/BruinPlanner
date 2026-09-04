export default function SavedSchedulesSidebar({
  saved,
  activeIndex,
  onLoad,
  onDelete,
}) {
  return (
    <div className="saved-schedules-sidebar">
      <h3>Saved Schedules</h3>

      {saved.length === 0 && <p className="empty-msg">No saved schedules.</p>}

      {saved.map((item, idx) => (
        <div
          key={item.name}
          className={`saved-schedule-item ${
            idx === activeIndex ? "active" : ""
          }`}
        >
          <button
            type="button"
            className="schedule-name"
            onClick={() => onLoad(idx)}
            aria-current={idx === activeIndex ? "true" : undefined}
          >
            {item.name}
          </button>

          <button className="delete-btn" onClick={() => onDelete(item.name)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
