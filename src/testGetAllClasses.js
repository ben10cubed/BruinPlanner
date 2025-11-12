import { getAllClasses } from './getAllClasses.js';

async function test() {
    const term = "26W"; // Example term
    try {
        console.log("Fetching all classes for term:", term);
        const allClasses = await getAllClasses(term);

        console.log("Total classes fetched:", allClasses.length);

        // Print the first 5 rows for inspection
        console.log("First 5 rows:");
        allClasses.slice(0, 5).forEach((row, idx) => {
            console.log(`${idx + 1}:`, row);
        });

    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
