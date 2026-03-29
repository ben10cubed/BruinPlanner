import { useState } from "react";
import { generateSchedules } from "../services/schedulesAPI";

export default function useScheduleGenerator() {
  const [schedules, setSchedules] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate new schedules from backend
  async function generate(chosenClasses, filters = [], settings = { showWaitlist: false, showClosed: false }) {
    const { ok, data } = await generateSchedules(chosenClasses, filters, settings);

    if (!ok) {
      return { error: data.error || "Server error" };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { error: "No possible schedules found" };
    }

    setSchedules(data);
    setCurrentIndex(0);
    return { success: true };
  }

  // Load schedule directly from saved database entry
  function loadFromSaved(scheduleObj) {
    setSchedules([scheduleObj]);
    setCurrentIndex(0);
  }

  return {
    schedules,
    currentIndex,
    setCurrentIndex,
    generate,
    loadFromSaved,
  };
}
