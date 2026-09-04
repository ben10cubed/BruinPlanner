import React, { useState, useEffect, useCallback } from "react";

import Timetable from "../components/Timetable.jsx";
import ClassDetails from "../components/ClassDetails.jsx";
import SubjectSearch from "../components/SubjectSearch.jsx";
import ClassSearch from "../components/ClassSearch.jsx";
import ChosenClasses from "../components/ChosenClasses.jsx";
import Filters from "../components/Filters.jsx";
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
  const [searchError, setSearchError] = useState("");
  const [plannerNotice, setPlannerNotice] = useState(null);

  /* -------------------------------------------
      Schedule filters / priorities
    ------------------------------------------- */
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [filters, setFilters] = useState([{ id: "none", value: "" }]);
    const [settings, setSettings] = useState({showWaitlist: false, showClosed: false});
    const [isScraping, setIsScraping] = useState(false);

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
  }, [reloadSaved]);


  /* -------------------------------------------
     Load subjects once
  ------------------------------------------- */
  const loadSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects");
      if (!res.ok) {
        throw new Error("Course data is temporarily unavailable.");
      }
      const data = await res.json();
      setAllSubjects(data);
      setSubjectResults(data);
      setSearchError("");
    } catch (err) {
      console.error("Subject fetch error:", err);
      setSearchError("Course data is temporarily unavailable. Please try again shortly.");
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);


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
    setIsScraping(true);
    setSelectedSubject(subj);
    setSubjectQuery(subj.subjectName);
    setSubjectResults([]);
    setSearchError("");

    try {
      const res = await fetch(`/api/classes?subject=${subj.subjectID}`);
      if (!res.ok) {
        throw new Error("Classes could not be loaded for this subject.");
      }
      const data = await res.json();

      setAllClasses(
        data.map((c) => ({
          ...c,
          full: `${c.classID} - ${c.className}`,
        }))
      );
      setClassQuery("");
      setClassResults([]);
      setClassFocused(false);
    } catch (err) {
      console.error("Class fetch failed:", err);
      setSearchError("Classes could not be loaded. Select the subject again to retry.");
    } finally {
      setIsSelecting(false);
      setIsScraping(false);
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
      setPlannerNotice({ type: "error", message: "Add at least one class before generating a schedule." });
      return;
    }

    setPlannerNotice(null);
    setIsScraping(true);
    const result = await generate(chosenClasses, filters, settings, false);
    setIsScraping(false);

    if (result.error) {
      setPlannerNotice({ type: "error", message: `Unable to generate schedules: ${result.error}` });
      return;
    }

    setActiveIndex(null);
    setPlannerNotice({ type: "success", message: "Schedules generated. Use Previous and Next to compare them." });
  }

  async function handleForceRefresh() {
    if (chosenClasses.length === 0) {
      setPlannerNotice({ type: "error", message: "Add at least one class before refreshing course data." });
      return;
    }

    setPlannerNotice(null);
    setIsScraping(true);
    const result = await generate(chosenClasses, filters, settings, true);
    setIsScraping(false);

    if (result.error) {
      setPlannerNotice({ type: "error", message: `Unable to refresh schedules: ${result.error}` });
      return;
    }

    setActiveIndex(null);
    setPlannerNotice({ type: "success", message: "Course data refreshed and schedules regenerated." });
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

    setPlannerNotice({ type: "success", message: `Schedule "${name}" was deleted.` });
  }


  /* -------------------------------------------
     Save button → open modal
  ------------------------------------------- */
  function handleSave() {
    if (schedules.length === 0) {
      setPlannerNotice({ type: "error", message: "Generate or load a schedule before saving." });
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
      setPlannerNotice({ type: "error", message: "There is no schedule to save." });
      return;
    }

    const schedule = schedules[currentIndex];
    let nameToUse = "";

    if (saveMode === "new") {
      if (!saveName.trim()) {
        setPlannerNotice({ type: "error", message: "Enter a name for the new schedule." });
        return;
      }
      nameToUse = saveName.trim();
    } else {
      if (!saveExistingName) {
        setPlannerNotice({ type: "error", message: "Select a saved schedule to overwrite." });
        return;
      }
      nameToUse = saveExistingName;
    }

    const overwrite = saveMode === "existing";

    const res = await saveSchedule(nameToUse, schedule, overwrite);

    if (!res.success) {
      if (res.nameConflict) {
        setPlannerNotice({ type: "error", message: "A schedule with that name already exists." });
      } else {
        setPlannerNotice({ type: "error", message: "Schedule save failed. Please try again." });
      }
      return;
    }

    if (res.duplicate) {
      setPlannerNotice({ type: "info", message: "This exact schedule is already saved." });
    } else {
      setPlannerNotice({ type: "success", message: "Schedule saved." });
    }

    setShowSaveModal(false);
    await reloadSaved();
  }


  /* -------------------------------------------
     Render
  ------------------------------------------- */
  return (
    <div className="page-container">
      <nav className="navbar">
        <span className="navbar-brand">BruinPlanner</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </nav>

      <div className="toolbar">
        <SubjectSearch
          subjectQuery={subjectQuery}
          setSubjectQuery={setSubjectQuery}
          subjectResults={subjectResults}
          handleSubjectSelect={handleSubjectSelect}
          subjectFocused={subjectFocused}
          setSubjectFocused={setSubjectFocused}
          isSelecting={isSelecting}
          setIsSelecting={setIsSelecting}
          isLoading={isScraping}
        />
        <ClassSearch
          classQuery={classQuery}
          setClassQuery={setClassQuery}
          classResults={classResults}
          handleAddClass={handleAddClass}
          classFocused={classFocused}
          setClassFocused={setClassFocused}
          isLoading={isScraping}
        />
      </div>
      {searchError && (
        <div className="search-status" role="alert">
          <span>{searchError}</span>
          <button type="button" onClick={loadSubjects}>
            Retry
          </button>
        </div>
      )}
      {plannerNotice && (
        <div className={`planner-status ${plannerNotice.type}`} role={plannerNotice.type === "error" ? "alert" : "status"}>
          <span>{plannerNotice.message}</span>
          <button type="button" onClick={() => setPlannerNotice(null)} aria-label="Dismiss message">
            Dismiss
          </button>
        </div>
      )}

      <div className="bottom-row">
        <div className="timetable-area">
          <Timetable sections={displayedSections} />
          
          <div style={{ marginTop: "20px" }}>
            <ClassDetails sections={displayedSections} />
          </div>
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
            onOpenFilters={() => setShowFiltersModal(true)}
            handleForceRefresh={handleForceRefresh}
            classCount={chosenClasses.length}
            scheduleCount={schedules.length}
            isBusy={isScraping}
           />
        </div>

        <SavedSchedulesSidebar
          saved={saved}
          activeIndex={activeIndex}
          onLoad={handleLoadSaved}
          onDelete={handleDeleteSaved}
        />
      </div>

      {/* Filters modal */}
      {showFiltersModal && (
        <div className="modal-overlay">
          <div className="filter-modal-content">
            <button className="close-modal-x" onClick={() => setShowFiltersModal(false)}>
              ✕
            </button>
            <Filters priorities={filters} setPriorities={setFilters} settings={settings} setSettings={setSettings}/>
            <button className="modal-done-btn" onClick={() => setShowFiltersModal(false)}>
              Apply
            </button>
          </div>
        </div>
      )}

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
