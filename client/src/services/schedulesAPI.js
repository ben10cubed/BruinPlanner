export async function generateSchedules(chosenClasses, filters = [], settings = { showWaitlist: false, showClosed: false }, forceRefresh = false) {
  const payload = {
    classes: chosenClasses.map(c => ({
      subjectID: c.subjectID,
      classID: c.classID,
    })),
    filters,
    settings,
    forceRefresh,
  };

  const res = await fetch("/api/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { ok: res.ok, data };
}
