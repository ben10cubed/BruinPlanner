import { useState, useEffect } from "react";
import { fetchSection } from "../services/sectionsAPI";
import { convertDBRowToTimetableSections } from "../utils/timetableConversion";

export default function useTimetableLoader(schedules, currentIndex) {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    async function load() {
      if (!schedules || schedules.length === 0) {
        setSections([]);
        return;
      }

      const schedule = schedules[currentIndex];
      let combined = [];

      for (const [key, secList] of Object.entries(schedule)) {
        const [subjectID, classID] = key.split("+");

        for (const sec of secList) {
          const row = await fetchSection(subjectID, classID, sec);
          if (row) {
            combined.push(...convertDBRowToTimetableSections(row));
          }
        }
      }

      setSections(combined);
    }

    load();
  }, [schedules, currentIndex]);

  return sections;
}
