// node testFetchCourse.js

import { fetchCourse } from "./getLectures.js";   // ← update path if necessary

async function test() {

    const subject = "MATH";     // Subject code (as it appears online, e.g. "COM SCI")
    const courseID = "31A";     // Course number
    const term = "26W";         // UCLA term code (e.g., "26W")

    console.log(`Fetching course info for: ${subject} ${courseID}, term ${term}`);

    try {
        const html = await fetchCourse(subject, courseID, term, 3);

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
