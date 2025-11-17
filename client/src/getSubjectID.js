// frontend getSubjectID

export async function getSubjectID(term = "26W") {
  const res = await fetch(`/api/subjects?term=${encodeURIComponent(term)}`);

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse error; will be handled by !res.ok
  }

  if (!res.ok) {
    const backendMsg = data && data.error ? ` - ${data.error}` : "";
    throw new Error(
      `Failed to fetch subjects: ${res.status} ${res.statusText}${backendMsg}`
    );
  }

  return data; // [{ subjectID, subjectName }]
}
