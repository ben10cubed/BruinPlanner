// getAllClasses.js

import { getSubjectID } from './getSubjectID.js';
import { getClassID } from './getClassID.js';
import { fetchCourse } from './getLectures.js';
import { getClassData } from './scrapingUtils.js';

/**
 * Fetches all class data for all subjects in a given term.
 * @param {string} term - UCLA term code (e.g., "26W").
 * @returns {Promise<Array>} Array of all class data rows.
 */
export async function getAllClasses(term = "26W") {
    const allClassData = [];

    try {
        const subjects = await getSubjectID(term);

        for (const subject of subjects) {
            const subjectID = subject.value;

            console.log(`Fetching classes for subject: ${subject.label} (${subjectID})`);

            let classes = [];
            try {
                classes = await getClassID(term, subjectID);
            } catch (err) {
                console.error(`Failed to get classes for ${subjectID}:`, err);
                continue;
            }

            for (const cls of classes) {
                const { classID, className } = cls;

                console.log(`Fetching lectures for class: ${classID} - ${className}`);

                let classHTML = null;
                try {
                    classHTML = await fetchCourse(subjectID, classID, term);
                } catch (err) {
                    console.error(`Failed to fetch lectures for ${classID}:`, err);
                    continue;
                }

                if (!classHTML) {
                    console.warn(`No HTML returned for ${classID}`);
                    continue;
                }

                try {
                    const parsedData = getClassData(classHTML, subjectID, classID);
                    allClassData.push(...parsedData);
                } catch (err) {
                    console.error(`Failed to parse class data for ${classID}:`, err);
                }
            }
        }

        console.log(`Finished fetching all classes. Total rows: ${allClassData.length}`);
        return allClassData;
    } catch (err) {
        console.error("Failed to fetch all classes:", err);
        return [];
    }
}
