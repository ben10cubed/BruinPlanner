export function createSectionEntry(db, sectionData) {
    db.run(`INSERT INTO sectionData (subjectID, classID, enroll, sectionID, status, waitlist, info, day, time, location, units, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(subjectID, classID, sectionID)
            DO UPDATE SET
            enroll = excluded.enroll,
            status = excluded.status,
            waitlist = excluded.waitlist,
            info = excluded.info,
            day = excluded.day,
            time = excluded.time,
            location = excluded.location,
            units = excluded.units,
            instructor = excluded.instructor,
            timeStamp = excluded.timeStamp;`, sectionData);
}