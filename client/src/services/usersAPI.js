export async function loadSchedules(userID) {
  const res = await fetch("/api/users/load", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userID }),
  });

  return await res.json();
}

export async function saveSchedule(userID, name, schedule) {
  const res = await fetch("/api/users/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userID, name, schedule }),
  });

  return await res.json();
}

export async function deleteSchedule(userID, name) {
  const res = await fetch("/api/users/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userID, name }),
  });

  return await res.json();
}
