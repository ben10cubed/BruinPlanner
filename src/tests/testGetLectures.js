// node testFetchCourse.js

import { fetchCourse } from "../getLectures.js";   // ← update path if necessary
import { getClassData } from "../getClassData.js";

async function test() {

    const subject = "MATH";     // Subject code (as it appears online, e.g. "COM SCI")
    const courseID = "182";     // Course number
    const term = "26W";         // UCLA term code (e.g., "26W")

    console.log(`Fetching course info for: ${subject} ${courseID}, term ${term}`);

    try {
        const html = await fetchCourse(subject, courseID, term);
        console.log(getClassData(html, subject, courseID).length);

        if (!html) {
            console.log("❌ No data returned.");
            return;
        }

        console.log("\n✅ Raw HTML response received:\n");
        console.log(html);   // print first 1000 chars to avoid terminal spam

    } catch (err) {
        console.error("⚠️ Error:", err);
    }
}

test();
