// node testFetchCourse.js

import { fetchCourse } from "./getLectures.js";   // ← update path if necessary

async function test() {

    const subject = "COM SCI";     // Subject code (as it appears online, e.g. "COM SCI")
    const courseID = "M51A";     // Course number
    const term = "26W";         // UCLA term code (e.g., "26W")

    console.log(`Fetching course info for: ${subject} ${courseID}, term ${term}`);

    try {
        const html = await fetchCourse(subject, courseID, term);

        if (!html) {
            console.log("❌ No data returned.");
            return;
        }

        console.log("\n✅ Raw HTML response received:\n");
        console.log(html.substring(0, 1000));   // print first 1000 chars to avoid terminal spam
        console.log("\n... (output truncated)\n");

    } catch (err) {
        console.error("⚠️ Error:", err);
    }
}

test();
