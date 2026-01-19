export function expandSectionEntries({ data }) {
  if (
    !data.day ||
    data.day.startsWith("Not") ||
    !data.time ||
    data.time.startsWith("Not")
  ) {
    return [];
  }

  const days = data.day.split("|");
  const times = data.time.split("|");
  const locs = data.location.split("|");

  const map = { M: "1", T: "2", W: "3", R: "4", F: "5", S: "6", U: "0" };
  const result = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const time = times[i];
    const loc = locs[i] ?? locs[locs.length - 1];

    if (!time.includes("-")) continue;

    const [s, e] = time.split("-");
    const start = `${s.slice(0, 2)}:${s.slice(2)}`;
    const end = `${e.slice(0, 2)}:${e.slice(2)}`;

    result.push({
      dayIndex: map[day],
      start,
      end,
      location: loc,
    });
  }

  return result;
}

export function convertDBRowToTimetableSections(row) {
  const expanded = expandSectionEntries({ data: row });
  if (!expanded || expanded.length === 0) return [];

  const dayMapBack = {
    "0": "Sun",
    "1": "Mon",
    "2": "Tue",
    "3": "Wed",
    "4": "Thu",
    "5": "Fri",
    "6": "Sat",
  };

  // 1. Extract enrollment count from status string (e.g. "56 of 60" from "Open|56 of 60 Enrolled|...")
  // We do this because row.enroll contains the Course Title.
  let enrollCount = "-";
  if (row.status && row.status.includes("Enrolled")) {
    const parts = row.status.split("|");
    const found = parts.find((p) => p.includes("Enrolled"));
    if (found) enrollCount = found.replace(" Enrolled", "").trim();
  }

  return expanded.map((entry) => ({
    id: `${row.subjectID}-${row.classID}-${row.sectionID}-${entry.dayIndex}`,
    courseId: `${row.subjectID} ${row.classID}`,
    label: row.sectionID,
    days: [dayMapBack[entry.dayIndex]],
    start: entry.start,
    end: entry.end,
    location: entry.location,

    // --- Added Fields ---
    units: row.units,
    instructor: row.instructor,
    status: row.status,
    waitlist: row.waitlist,
    enroll: enrollCount, // The count for the UI box
    description: row.enroll, // Capturing the full title/description
  }));
}