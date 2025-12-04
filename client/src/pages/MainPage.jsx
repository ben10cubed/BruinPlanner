import React, { useState, useEffect } from "react";

import Timetable from "../components/Timetable.jsx";
import SubjectSearch from "../components/SubjectSearch.jsx";
import ClassSearch from "../components/ClassSearch.jsx";
import ChosenClasses from "../components/ChosenClasses.jsx";
import SavedSchedulesSidebar from "../components/SavedSchedulesSidebar.jsx";
import SaveModal from "../components/SaveModal.jsx";

import useScheduleGenerator from "../hooks/useScheduleGenerator.js";
import useSavedSchedules from "../hooks/useSavedSchedules.js";
import useTimetableLoader from "../hooks/useTimetableLoader.js";

export default function MainPage({ userID, onLogout }) {
  /* -------------------------------------------
     Search and class selection state
  ------------------------------------------- */
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

  /* -------------------------------------------
     Schedules (generated via backend)
  ------------------------------------------- */
  const {
    schedules,
    currentIndex,
    setCurrentIndex,
    generate,
    loadFromSaved,
  } = useScheduleGenerator();

  /* -------------------------------------------
     Saved schedules (user's named schedules)
  ------------------------------------------- */
  const {
    saved,
    activeIndex,
    setActiveIndex,
    reload: reloadSaved,
    save: saveSchedule,
    remove: removeSaved,
  } = useSavedSchedules(userID);

  /* -------------------------------------------
     Timetable sections derived from schedules[currentIndex]
  ------------------------------------------- */
  const displayedSections = useTimetableLoader(schedules, currentIndex);

  /* -------------------------------------------
     Save modal state
  ------------------------------------------- */
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMode, setSaveMode] = useState("new"); // "new" | "existing" -> either save timetable as new or overwrite existing
  const [saveName, setSaveName] = useState("");
  const [saveExistingName, setSaveExistingName] = useState("");


  /* -------------------------------------------
     Load saved schedules once per userID
  ------------------------------------------- */
  useEffect(() => {
    reloadSaved();
  }, [userID]);


  /* -------------------------------------------
     Load subjects once
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
    if (!text) {
      setSubjectResults(allSubjects);
    } else {
      setSubjectResults(
        allSubjects.filter((s) =>
          s.subjectName.toUpperCase().includes(text)
        )
      );
    }
  }, [subjectQuery, allSubjects, isSelecting]);


  /* -------------------------------------------
     Subject selection → load classes for subject
  ------------------------------------------- */
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
          full: `${c.classID} - ${c.className}`,
        }))
      );
      setClassQuery("");
      setClassResults([]);
    } catch (err) {
      console.error("Class fetch failed:", err);
    } finally {
      setIsSelecting(false);
    }
  }


  /* -------------------------------------------
     Class search filtering
  ------------------------------------------- */
  useEffect(() => {
    const text = classQuery.trim().toUpperCase();
    if (!text) {
      setClassResults(allClasses);
    } else {
      setClassResults(
        allClasses
          .filter((c) => c.full.toUpperCase().includes(text))
          .slice(0, 8)
      );
    }
  }, [classQuery, allClasses]);


  /* -------------------------------------------
     Add / Remove classes from chosenClasses
  ------------------------------------------- */
  function handleAddClass(cls) {
    if (
      !selectedSubject ||
      chosenClasses.some(
        (c) =>
          c.classID === cls.classID &&
          c.subjectID === selectedSubject.subjectID
      )
    ) {
      return;
    }

    setChosenClasses((prev) => [
      ...prev,
      { ...cls, subjectID: selectedSubject.subjectID },
    ]);
  }

  function handleDelete(classID, subjectID) {
    setChosenClasses((prev) =>
      prev.filter(
        (c) => !(c.classID === classID && c.subjectID === subjectID)
      )
    );
  }


  /* -------------------------------------------
     Generate schedules (backend)
  ------------------------------------------- */
  async function handleGenerate() {
    if (chosenClasses.length === 0) {
      alert("Please add at least one class before generating.");
      return;
    }

    const result = await generate(chosenClasses);

    if (result.error) {
      alert("Error generating schedules: " + result.error);
      return;
    }

    // New generated schedules → not associated with a saved schedule
    setActiveIndex(null);
  }


  /* -------------------------------------------
     Next / Prev over generated schedules
  ------------------------------------------- */
  function handleNext() {
    if (schedules.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % schedules.length);
  }

  function handlePrev() {
    if (schedules.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + schedules.length) % schedules.length);
  }


  /* -------------------------------------------
     Clear chosen classes and timetable
  ------------------------------------------- */
  function handleClear() {
    setChosenClasses([]);
    setActiveIndex(null);
    loadFromSaved({});
  }


  /* -------------------------------------------
     Load saved schedule into timetable when clicked
  ------------------------------------------- */
  function handleLoadSaved(index) {
    const item = saved[index];
    if (!item) return;

    loadFromSaved(item.schedule);
    setActiveIndex(index);
  }


  /* -------------------------------------------
     Delete a saved schedule by name
  ------------------------------------------- */
  async function handleDeleteSaved(name) {
    const firstConfirm = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      `This action cannot be undone.\n\nDelete "${name}" permanently?`
    );
    if (!secondConfirm) return;

    const idx = saved.findIndex((s) => s.name === name);
    if (idx === activeIndex) {
      setActiveIndex(null);
    }

    await removeSaved(name);

    alert(`Schedule "${name}" deleted successfully.`);
  }


  /* -------------------------------------------
     Save button → open modal
  ------------------------------------------- */
  function handleSave() {
    if (schedules.length === 0) {
      alert("No schedule to save. Generate or load a schedule first.");
      return;
    }

    setSaveMode("new");
    setSaveName("");
    setSaveExistingName("");
    setShowSaveModal(true);
  }


  /* -------------------------------------------
     Confirm save (new or overwrite existing)
  ------------------------------------------- */
  async function handleSaveConfirm() {
    if (schedules.length === 0) {
      alert("No schedule to save.");
      return;
    }

    const schedule = schedules[currentIndex];
    let nameToUse = "";

    if (saveMode === "new") {
      if (!saveName.trim()) {
        alert("Please enter a name for the new schedule.");
        return;
      }
      nameToUse = saveName.trim();
    } else {
      if (!saveExistingName) {
        alert("Please select an existing schedule to overwrite.");
        return;
      }
      nameToUse = saveExistingName;
    }

    const overwrite = saveMode === "existing";

    const res = await saveSchedule(nameToUse, schedule, overwrite);

    if (!res.success) {
      if (res.nameConflict) {
        alert("A schedule with that name already exists.");
      } else {
        alert("Save failed.");
      }
      return;
    }

    if (res.duplicate) {
      alert("This exact schedule was already saved.");
    } else {
      alert("Schedule saved!");
    }

    setShowSaveModal(false);
    await reloadSaved();
  }


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

        <div>
          <ChosenClasses
            chosenClasses={chosenClasses}
            handleDelete={handleDelete}
            handleGenerate={handleGenerate}
            handleNext={handleNext}
            handlePrev={handlePrev}
            handleClear={handleClear}
            handleSave={handleSave}
          />
        </div>

        <SavedSchedulesSidebar
          saved={saved}
          activeIndex={activeIndex}
          onLoad={handleLoadSaved}
          onDelete={handleDeleteSaved}
        />
      </div>

      <SaveModal
        visible={showSaveModal}
        mode={saveMode}
        setMode={setSaveMode}
        nameNew={saveName}
        setNameNew={setSaveName}
        nameExisting={saveExistingName}
        setNameExisting={setSaveExistingName}
        existingNames={saved.map((s) => s.name)}
        onSave={handleSaveConfirm}
        onCancel={() => setShowSaveModal(false)}
      />
    </div>
  );
}
