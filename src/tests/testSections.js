// node testFetchLectures.js

import fs from "fs";
import { fetchCourse } from "../sections.js";   // ← update path if needed
import { getClassData } from "../sections.js";    // same file exports everything

async function test() {

    const subject = "MATH";     // example subject
    const courseID = "31A";     // example course
    const term = "26W";         // UCLA term code (Y2W = Winter)
    const sectionName = "Lec 2";  // optional selector exactly like your reference test

    console.log(`Fetching lectures for: ${subject} ${courseID}, term ${term}`);

    try {
        const html = await fetchCourse(subject, courseID, term, sectionName);

        if (!html) {
            console.log("❌ No data returned.");
            return;
        }

        // Preview the first 1000 chars like your example
        console.log(html.slice(0, 1000));

        // Parse sections using your parser
        const sections = getClassData(html, subject, courseID);
        console.log(`Number of sections parsed: ${sections.length}`);

        // Save to fixed file "response.html"
        fs.writeFileSync("response.html", html, "utf-8");
        console.log(`\n✅ HTML response written to: response.html`);

    } catch (err) {
        console.error("⚠️ Error:", err);
    }
}

test();
