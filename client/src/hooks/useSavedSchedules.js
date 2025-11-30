import { useState } from "react";
import { loadSchedules, saveSchedule, deleteSchedule } from "../services/usersAPI";

export default function useSavedSchedules(userID) {
  const [saved, setSaved] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Load saved schedules from backend
  async function reload() {
    const res = await loadSchedules(userID);
    if (res.success) {
      setSaved(res.schedules);
    }
  }

  // Save a schedule (overwrite = true deletes first)
  async function save(name, schedule, overwrite = false) {
    if (overwrite) {
      await deleteSchedule(userID, name);
    }
    return await saveSchedule(userID, name, schedule);
  }

  // Delete saved schedule
  async function remove(name) {
    await deleteSchedule(userID, name);
    await reload();
  }

  return {
    saved,
    activeIndex,
    setActiveIndex,
    reload,
    save,
    remove,
  };
}
