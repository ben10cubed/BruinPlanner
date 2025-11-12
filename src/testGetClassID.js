// testGetClassID.js

import { getClassID } from './getClassID.js';

async function test() {
    const term = "26W";       // Example term
    const subjectID = "MATH"; // Subject to test

    try {
        console.log(`Fetching classes for subject: ${subjectID}, term: ${term}`);

        const classes = await getClassID(term, subjectID);

        console.log(`Total classes found: ${classes.length}`);
        classes.forEach((cls, idx) => {
            console.log(`${idx + 1}: ${cls.classID} - ${cls.className}`);
        });

    } catch (err) {
        console.error("Error fetching classes:", err);
    }
}

test();
