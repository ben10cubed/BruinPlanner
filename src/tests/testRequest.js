import fs from "fs";

async function test() {
    const term = "26W";
    const subject = "MATH";
    const catalogNumber = "0031A";

    // Example: replace with the full GetCourseSummary URL if needed
    const url = `https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?model={"Term":"${term}","SubjectAreaCode":"${subject}","CatalogNumber":"${catalogNumber}","IsRoot":true}&FilterFlags={"enrollment_status":"O,W,C,X,T,S"}`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        if (!response.ok) {
            console.error("Request failed:", response.status, response.statusText);
            return;
        }

        const html = await response.text();

        console.log(html);

        // Save raw HTML to file
        fs.writeFileSync("response1.html", html, "utf8");
        console.log("✅ Response written to response.html");

    } catch (err) {
        console.error("Error fetching classes:", err);
    }
}

test();
