export async function fetchSection(subjectID, classID, sectionID) {
  const res = await fetch(
    `/api/sections?subjectID=${subjectID}&classID=${classID}&sectionID=${sectionID}`
  );

  return res.ok ? await res.json() : null;
}
