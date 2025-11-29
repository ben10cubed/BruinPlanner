import React, { useState, useEffect } from "react";
import Timetable from "../components/Timetable.jsx";
import SubjectSearch from "../components/SubjectSearch.jsx";
import ClassSearch from "../components/ClassSearch.jsx";
import ChosenClasses from "../components/ChosenClasses.jsx";

export default function MainPage({ onLogout }) {
  const [allSubjects, setAllSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [subjectResults, setSubjectResults] = useState([]);
  const [classResults, setClassResults] = useState([]);

  const [subjectQuery, setSubjectQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");

  const [subjectFocused, setSubjectFocused] = useState(false);
  const [classFocused, setClassFocused] = useState(false);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [chosenClasses, setChosenClasses] = useState([]);

  // Schedules from backend
  const [schedules, setSchedules] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sections ready for timetable
  const [displayedSections, setDisplayedSections] = useState([]);


  /* -------------------------------------------
     Load all subjects once
  ------------------------------------------- */
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/subjects");
        if (!res.ok) return;
        const data = await res.json();
        setAllSubjects(data);
        setSubjectResults(data);
      } catch (err) {
        console.error("Subject fetch error:", err);
      }
    }
    loadSubjects();
  }, []);


  /* -------------------------------------------
     Subject search filtering
  ------------------------------------------- */
  useEffect(() => {
    if (isSelecting) return;
    const text = subjectQuery.trim().toUpperCase();
    if (!text) setSubjectResults(allSubjects);
    else {
      setSubjectResults(
        allSubjects.filter((s) =>
          s.subjectName.toUpperCase().includes(text)
        )
      );
    }
  }, [subjectQuery, allSubjects, isSelecting]);


  async function handleSubjectSelect(subj) {
    setIsSelecting(true);
    setSelectedSubject(subj);
    setSubjectQuery(subj.subjectName);
    setSubjectResults([]);

    try {
      const res = await fetch(`/api/classes?subject=${subj.subjectID}`);
      if (!res.ok) return;
      const data = await res.json();

      setAllClasses(
        data.map((c) => ({
          ...c,
          full: `${c.classID} - ${c.className}`
        }))
      );
      setClassQuery("");
      setClassResults([]);
    } catch (err) {
      console.error("Class fetch failed:", err);
    }
  }


  /* -------------------------------------------
     Class search filtering
  ------------------------------------------- */
  useEffect(() => {
    const text = classQuery.trim().toUpperCase();
    if (!text) setClassResults(allClasses);
    else {
      setClassResults(
        allClasses.filter((c) => c.full.toUpperCase().includes(text)).slice(0, 8)
      );
    }
  }, [classQuery, allClasses]);


  /* -------------------------------------------
     Add/remove classes
  ------------------------------------------- */
  function handleAddClass(cls) {
    if (!chosenClasses.some((c) =>
      c.classID === cls.classID &&
      c.subjectID === selectedSubject.subjectID
    )) {
      setChosenClasses([
        ...chosenClasses,
        { ...cls, subjectID: selectedSubject.subjectID }
      ]);
    }
  }

  function handleDelete(classID, subjectID) {
    setChosenClasses(
      chosenClasses.filter(
        (c) => !(c.classID === classID && c.subjectID === subjectID)
      )
    );
  }


  /* -------------------------------------------
     NEXT / PREVIOUS schedule
  ------------------------------------------- */
  function handleNext() {
    if (schedules.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % schedules.length);
  }

  function handlePrev() {
    if (schedules.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + schedules.length) % schedules.length);
  }

  function handleClear() {
    setSchedules([]);
    setDisplayedSections([]);
    setCurrentIndex(0);
  }


  /* -------------------------------------------
     Fetch schedules from backend
  ------------------------------------------- */
  async function handleGenerate() {
    const payload = {
      classes: chosenClasses.map((c) => ({
        subjectID: c.subjectID,
        classID: c.classID
      }))
    };

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Received schedules:", data);

    setSchedules(data);
    setCurrentIndex(0);
  }


  /* ------------------------------------------------------------------
     EXPAND ENTRIES: Main -> "MWF" | "1000-1050|1000-1100|..." -> entries[]
  ------------------------------------------------------------------ */
  function expandSectionEntries({ data }) {
    if (!data.day || data.day.startsWith("Not") ||
        !data.time || data.time.startsWith("Not")) return [];

    const days = data.day.split("|");
    const times = data.time.split("|");
    const locs = data.location.split("|");

    const map = { M:"1", T:"2", W:"3", R:"4", F:"5", S:"6", U:"0" };

    const result = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const time = times[i];
      const loc = locs[i] ?? locs[locs.length - 1];

      if (!time.includes("-")) continue;

      const [s, e] = time.split("-");
      const start = `${s.slice(0,2)}:${s.slice(2)}`;
      const end   = `${e.slice(0,2)}:${e.slice(2)}`;

      result.push({
        dayIndex: map[day],
        start,
        end,
        location: loc
      });
    }

    return result;
  }


  /* ------------------------------------------------------------------
     Convert 1 DB row → multiple timetable events
  ------------------------------------------------------------------ */
  function convertDBRowToTimetableSections(row) {
    const expanded = expandSectionEntries({ data: row });
    if (!expanded || expanded.length === 0) return [];

    const dayMapBack = {
      "0": "Sun",
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat"
    };

    return expanded.map(entry => ({
      id: `${row.subjectID}-${row.classID}-${row.sectionID}-${entry.dayIndex}`,
      courseId: `${row.subjectID} ${row.classID}`,
      label: row.sectionID,
      days: [dayMapBack[entry.dayIndex]],
      start: entry.start,
      end: entry.end,
      location: entry.location
    }));
  }


  /* -------------------------------------------
     Convert which schedule is selected → sections[]
  ------------------------------------------- */
  useEffect(() => {
    async function loadSections() {
      if (schedules.length === 0) {
        setDisplayedSections([]);
        return;
      }

      const schedule = schedules[currentIndex];
      let result = [];

      for (const [courseKey, secList] of Object.entries(schedule)) {
        const [subjectID, classID] = courseKey.split("+");

        for (const secID of secList) {
          const res = await fetch(
            `/api/sections?subjectID=${subjectID}&classID=${classID}&sectionID=${secID}`
          );

          if (!res.ok) {
            console.error(`Failed to fetch section ${secID}`);
            continue;
          }

          const dbRow = await res.json();
          console.log(dbRow);


          const converted = convertDBRowToTimetableSections(dbRow);
          result.push(...converted);

        }
      }

      setDisplayedSections(result);
    }

    loadSections();
  }, [schedules, currentIndex]);


  /* -------------------------------------------
     Render
  ------------------------------------------- */
  return (
    <div className="page-container">
      <div className="top-row">
        <SubjectSearch
          subjectQuery={subjectQuery}
          setSubjectQuery={setSubjectQuery}
          subjectResults={subjectResults}
          handleSubjectSelect={handleSubjectSelect}
          subjectFocused={subjectFocused}
          setSubjectFocused={setSubjectFocused}
          isSelecting={isSelecting}
          setIsSelecting={setIsSelecting}
        />

        <ClassSearch
          classQuery={classQuery}
          setClassQuery={setClassQuery}
          classResults={classResults}
          handleAddClass={handleAddClass}
          classFocused={classFocused}
          setClassFocused={setClassFocused}
        />

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="bottom-row">
        <div className="timetable-area">
          <Timetable sections={displayedSections} />
        </div>

        <ChosenClasses
          chosenClasses={chosenClasses}
          handleDelete={handleDelete}
          handleGenerate={handleGenerate}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handleClear={handleClear}
        />
      </div>
    </div>
  );
}
