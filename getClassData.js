function getClassData(classHTML) {
    const urlBase = "https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?";
    const subjectCode = "COM SCI";
    const courseID = "35L";
    const term = "25F";
    const regexPatterns = [
        new RegExp("enrollColumn[^>]*>([^<>]*<[^>]*>){2}Select (?<data>[^<]*)</label>", "g"), 
        new RegExp("sectionColumn[^>]*>([^<>]*<[^>]*>){6}\\s*(?<data>[^<]*)<span", "g"),
        new RegExp("statusColumn[^>]*>([^<>]*<[^>]*>){3}\\s*(?<data>[CO])[^<]*(<br( /)?>[^<]*)*</p>", "g"), 
        new RegExp("waitlistColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("infoColumn[^>]*>([^<>]*<[^>]*>){4}\\s*(?<data>[^<]*)</span>", "g"), 
        new RegExp("dayColumn[^>]*>([^<>]*<[^>]*>){3}\\s*(?<data>[^<]*)</button>", "g"), 
        new RegExp("timeColumn[^>]*>([^<>]*<[^>]*>){7}\\s*(?<data>[^<]*<wbr( /)?>[^<]*)</p>", "g"), 
        new RegExp("locationColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<][A-Za-z0-9 ]*)\\s*</p>", "g"), 
        new RegExp("unitsColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g"), 
        new RegExp("instructorColumn[^>]*>([^<>]*<[^>]*>){1}\\s*(?<data>[^<]*)</p>", "g")
    ];
    const regexRemoveBreaks = new RegExp("<w?br\\s*/?>");
    
    // Retrieve all matches from each pattern into allMatches. This matches the form [enrollMatches[], sectionMatches[], ...]
    let allMatches = [];
    for (let i = 0; i < regexPatterns.length; i++) {
        let patternMatches = [];
        for (const match of classHTML.matchAll(regexPatterns[i])) {
            patternMatches.push(match.groups.data.replace(regexRemoveBreaks, "-"));
        }
        allMatches.push(patternMatches);
    }

    // Convert allMatches into allClassData by flipping rows/columns of the 2d array
    const minLength = Math.min(...allMatches.map(patternMatchArr => patternMatchArr.length));
    let allClassData = [];
    for (let j = 0; j < allMatches[minLength].length; j++) {
        let individualClassData = [];
        for (let i = 0; i < allMatches.length; i++) {
            individualClassData.push(allMatches[i][j]);
            // console.log(allMatches[i][j]);
        }
        allClassData.push(individualClassData);
    }
    return allClassData;
}

module.exports = { getClassData };
