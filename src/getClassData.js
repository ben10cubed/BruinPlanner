//Takes in HTML file that contains class/discussion information and scrapes for desired data.
import he from "he";

//Do we still need the subjectID, classID params?
export function getClassData(classHTML, subjectID, classID) {
    const regexPatterns = [
        new RegExp("enrollColumn[^>]*>([^<>]*<[^>]*>){2}Select (?<data>[^<]*)</label>", "g"), 
        new RegExp("sectionColumn[^>]*>([^<>]*<[^>]*>){6}\\s*(?<data>[^<]*)<span", "g"),
        //Big modification
        //I grouped the statuses
        //Previous we had 2 of 5 enrolled, waitlist together, and then Open/Closed separately
        //Instead, group them together, we will probably have to split this up when storing in DB.
        new RegExp('<div\\s+class="statusColumn"([^>]*?)>\\s*<p[^>]*>(?<data>[\\s\\S]*?)<\\/p>\\s*<\\/div>','gi'),
        new RegExp("waitlistColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("infoColumn[^>]*>([^<>]*<[^>]*>){4}\\s*(?<data>[^<]*)</span>", "g"), 
        //Fixed. TODO: Based on Oliver request, even if same time across different days, split it up ie MW|F -> M|W|F
        new RegExp('dayColumn[\\s\\S]*?<div[^>]*?days_data[^>]*?>[\\s\\S]*?<p[^>]*>(?<data>[\\s\\S]*?)<\\/p>','gi'), 
        //Same as above todo
        new RegExp("timeColumn[^>]*>[\\s\\S]*?</div>\\s*<p[^>]*>\\s*(?<data>[\\s\\S]*?)</p>", "gi"),
        //Fixed
        new RegExp('locationColumn[^>]*>\\s*<p[^>]*>(?:(?<data>[\\s\\S]*?))\\s*</p>', 'gi'), 
        //No bugs detected
        new RegExp("unitsColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        //Fixed, hard code 11 could be better fixed in the future
        new RegExp("instructorColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*([^<>]*<[^>]*>){0,11}[^<]*)</p>", "g")
    ];
    // Create separate replacement characters for time calculation and storing in database
    const brReplacementChar = "|";
    const brReplacementCharForTime = "-";
    const regexRemoveBreaks = new RegExp("<w?br\\s*/?>", "g");
    const regexWbr = new RegExp("<wbr\\s*/?>", "g");
    const regexBr = new RegExp("<br\\s*/?>", "g")
    const regexTimeCleanup = new RegExp("(?<hour>[0-9]{1,2})(?<minutes>(:[0-9]{2})?)(?<dayPart>(a|p)m)", "g");
    // const regexTimeCleanup = new RegExp("(?<hour>[0-9]{1,2})(:(?<minutes>[0-9]{2}))?(?<dayPart>(a|p)m)", "g");
    const indexTimeColumn = 6; // Index of time column in allMatches array (later in code)
    
    // Retrieve all matches from each pattern into allMatches. This matches the form [enrollMatches[], sectionMatches[], ...]
    let allMatches = [];
    for (let i = 0; i < regexPatterns.length; i++) {
        let patternMatches = [];
        if (i === indexTimeColumn) {
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                let timeData = match.groups.data
                        .replace(regexWbr, '')   // remove <wbr>
                        .replace(regexBr, '|')   // convert <br> to '|'
                        .replace(/\s+/g, '')           // remove spaces
                        .replace(regexTimeCleanup, convertTo24Hour);    // convert to 24 hour time format
                // Case 2: detect "Not scheduled"
                if (!timeData && />Not\s*scheduled</i.test(m[0])) {
                    timeData = 'Not scheduled';
                }
                // Case 3: no time or schedule text at all
                if (!timeData) {
                    timeData = 'No time scheduled';
                }
                patternMatches.push(timeData); 
            }
        } else if (i == 7) { // locationColumn needs special handling for buttons and multiple locations
            for (const m of classHTML.matchAll(regexPatterns[i])) {
                // Case 1: Online / button popover
                let trimmed_data = he.decode(m.groups.data.trim());
                if (trimmed_data.includes("button")) {
                    let trimmed_data = he.decode(m.groups.data.toLowerCase());
                    if (trimmed_data.includes("asynchronous")) {
                        patternMatches.push("Online - Asynchronous");
                    } 
                    else if (trimmed_data.includes("recorded")) {
                        patternMatches.push("Online - Recorded");
                    } 
                    else {
                        patternMatches.push("Online");
                    }
                } else {
                    const cleaned = he.decode(
                        trimmed_data
                            .replace(/<br\s*\/?>/gi, "|")   // turn <br> into pipe
                            .replace(/\s*\|\s*/g, "|")      // remove spaces around all pipes
                            .replace(/\s+/g, " ")           // collapse remaining multiple spaces
                            .trim()
                    );
                    patternMatches.push(cleaned);
                }
            }
        } else if (i == 5) { // dayColumn
            for (const m of classHTML.matchAll(regexPatterns[i])) {
                let trimmed_data = m.groups.data.trim();

                // Case 1: Explicit "Not scheduled"
                if (/not\s+scheduled/i.test(trimmed_data)) {
                    patternMatches.push("Not scheduled");
                    continue;
                }
                // Case 2: Contains a <button> element
                if (trimmed_data.includes("button")) {

                    const subMatch = trimmed_data.match(/<button[^>]*>([\s\S]*?)<\/button>/i);
                    if (subMatch) {
                        let text = he.decode(
                            subMatch[1]
                                .replace(/<br\s*\/?>/gi, "|")   // convert <br> to |
                                .replace(/\s*\|\s*/g, "|")      // clean spacing around |
                                .replace(/\s+/g, " ")           // collapse multiple spaces
                                .trim()
                        );

                        patternMatches.push(text);
                    } else {
                        // In case nothing detected, likely means not scheduled
                        patternMatches.push("Not scheduled");
                    }
                } else {
                    // Case 3: No button → automatically Not scheduled
                    patternMatches.push("Not scheduled");
                }
            }
        } else if (i == 2) { // Status
            //Fix bug of not detecting last section
            for (const m of classHTML.matchAll(regexPatterns[i])) {
                const inner = m.groups.data;
                const lower = inner.toLowerCase();
                if (lower.includes("closed by dept")) {
                    patternMatches.push("Closed by Dept");
                    continue;
                }
                if (lower.includes("cancelled")) {
                    patternMatches.push("Cancelled");
                    continue;
                }
                if (lower.includes("waitlist")) {
                    patternMatches.push("Waitlist");
                    continue;
                }
                // 2. For normal cases, ensure there is a trailing '<'
                // so that the regex >(...?)< works on the last line
                let fixed = m.groups.data.trim();
                if (!fixed.endsWith("<")) {
                    fixed += "<";
                }
                const textPieces = [...fixed.matchAll(/>([^<>]+)</g)]
                    .map(x => he.decode(x[1].trim()))
                    .filter(x => x.length > 0);

                const cleaned = textPieces.join("|");
                patternMatches.push(cleaned);
            }
        } else {
            for (const match of classHTML.matchAll(regexPatterns[i])) {
                patternMatches.push(
                    he.decode(
                        match.groups.data
                            .replace(regexRemoveBreaks, brReplacementChar)
                            .trim()
                    )
                );
            }
        }
        allMatches.push(patternMatches);
    }

    //Safety measure.
    //In case some regex fails and we have non-rectangular matrix
    //If it does fail, it'll mess up the data, but at least the format will be correct
    let maxLength = 0;
    for (const arr of allMatches) {
        if (Array.isArray(arr)) {
            maxLength = Math.max(maxLength, arr.length);
        }
    }

    // Step 2: Pad every list to match the longest length
    for (let i = 0; i < allMatches.length; i++) {
        if (!Array.isArray(allMatches[i])) {
            allMatches[i] = [];
        }

        while (allMatches[i].length < maxLength) {
            allMatches[i].push("");
        }
    }

    // Convert allMatches into allClassData by flipping rows/columns of the 2d array
    const rotated = Array.from({ length: maxLength }, (_, row) =>
        allMatches.map(col => col[row])
    );
    return rotated;
}

// Convert 12-hour time to 24-hour time in HHMM format (string)
function convertTo24Hour(timeString, hour, minutes, dayPart) {
    minutes = minutes.slice(1)
    let convertedTime = parseInt(hour) * 100;
    if (dayPart === "pm"){
        if (convertedTime !== 1200){
            convertedTime += 1200;
        }
    }
    else{
        if (convertedTime === 1200){
            convertedTime = 0;
        }
    }
    convertedTime += parseInt(minutes) ? parseInt(minutes) : 0;
    return convertedTime.toString().padStart(4, '0');;
}
