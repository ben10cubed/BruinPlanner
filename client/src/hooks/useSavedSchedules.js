import { useCallback, useState } from "react";
import { loadSchedules, saveSchedule, deleteSchedule } from "../services/usersAPI";

export default function useSavedSchedules(userID) {
  const [saved, setSaved] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Load saved schedules from backend
  const reload = useCallback(async () => {
    const res = await loadSchedules(userID);
    if (res.success) {
      setSaved(res.schedules);
    }
  }, [userID]);

  // Save a schedule (overwrite = true deletes first)
  const save = useCallback(async (name, schedule, overwrite = false) => {
    if (overwrite) {
      await deleteSchedule(userID, name);
    }
    return await saveSchedule(userID, name, schedule);
  }, [userID]);

  // Delete saved schedule
  const remove = useCallback(async (name) => {
    await deleteSchedule(userID, name);
    await reload();
  }, [userID, reload]);

  return {
    saved,
    activeIndex,
    setActiveIndex,
    reload,
    save,
    remove,
  };
}
