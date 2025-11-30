// node testGetLectures.js

import fs from "fs";
import { fetchCourse } from "../getLectures.js";   // ← update path if necessary
import { getClassData } from "../getClassData.js";

async function test() {

    const subject = "MATH";     // Subject code (as it appears online, e.g. "COM SCI")
    const courseID = "31A";     // Course number
    const term = "26W";         // UCLA term code (e.g., "26W")

    console.log(`Fetching course info for: ${subject} ${courseID}, term ${term}`);

    try {
        const html = await fetchCourse(subject, courseID, term, "Lec 2");

        if (!html) {
            console.log("❌ No data returned.");
            return;
        }

        const sections = getClassData(html, subject, courseID);
        //console.log(html);
        console.log(html.slice(0, 1000));

        console.log(`Number of sections parsed: ${sections.length}`);

        // Write HTML to a fixed file "response.html"
        fs.writeFileSync("response.html", html, "utf-8");

        console.log(`\n✅ HTML response written to: response.html`);

    } catch (err) {
        console.error("⚠️ Error:", err);
    }
}

test();
