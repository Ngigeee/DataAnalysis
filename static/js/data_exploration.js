/* ═══════════════════════════════════════════════
   INSPECTION
═══════════════════════════════════════════════ */
function cols(){ return DATA.length ? Object.keys(DATA[0]) : []; }

//showfirst   five rows
async function showHead() {
    try {
        
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/head");
        const rows = await response.json();

        showResultTable(rows, "Head — first 5 rows");
        addLog("Viewed head (5 rows)");

    } catch (err) {
        console.error(err);
        toast("Failed to load head", "error");
    }
}

//last five  rows
// Last five rows
async function showTail() {
    try {

        // Make sure the dataset workspace is visible
        showDatasetWorkspace();

        const response = await fetch("/tail");

        if (!response.ok) {
            throw new Error("Failed to load tail");
        }

        const result = await response.json();

        showResultTable(result, "Tail — last 5 rows");

        addLog("Viewed tail (5 rows)");

    } catch (err) {

        console.error(err);
        toast("Failed to load tail", "error");

    }
}

//show     columns
async function showColumns() {
    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/columns");
        const result = await response.json();

        const out = result.map((c, i) => `[${i}] ${c}`)
            .join("\n");

        showConsole(`Columns (${result.length}):\n${out}`);
        addLog("Viewed columns");

    } catch (err) {
        toast("Failed to load columns", "error");
    }
}


//show shape  of  data
async function showShape() {
    try {
         // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/shape");
        const result = await response.json();

        showConsole(
            `Shape: ${result.rows} rows × ${result.columns} columns`
        );

        addLog("Viewed shape");

    } catch (err) {
        toast("Failed to load shape", "error");
    }
}

//show  data  types
async function showDtypes() {
    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/dtypes");
        const result = await response.json();

        const rows = Object.entries(result).map(([column, dtype]) => ({
            Column: column,
            DataType: dtype
        }));

        showResultTable(rows, "Data Types");
        addLog("Viewed dtypes");

    } catch (err) {
        console.error(err);
        toast("Failed to load data types", "error");
    }
}
//describe   the dataset
async function showDescribe() {
    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/describe");
        const result = await response.json();


        const rows = Object.entries(result).map(([column, stats]) => ({
            Column: column,
            ...stats
        }));


        showResultTable(rows, "Describe");
        addLog("Ran describe");

    } catch (err) {
        console.error(err);
        toast("Failed to generate description", "error");
    }
}


//show more infor     about the dataset

async function showInfo() {
    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/info");
        const result = await response.json();

        showConsole(result.info);

        addLog("Viewed info");

    } catch (err) {
        toast("Failed to load info", "error");
    }
}


//show duplicated   data
async function showDuplicates() {
    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/duplicates");
        let result = await response.json();

        // If the server returned a single object instead of an array
        if (!Array.isArray(result) && typeof result === "object" && result !== null) {
            result = [result];
        }

        // Ensure we always have an array
        if (!Array.isArray(result)) {
            throw new Error("Unexpected response format.");
        }

        // Handle no duplicates
        if (result.length === 0) {
            showConsole("No duplicate rows found.");
            toast("No duplicates", "info");
            addLog("Found 0 duplicate row(s)");
            return;
        }

        showResultTable(
            result,
            `Duplicates — ${result.length} row(s)`
        );

        addLog(`Found ${result.length} duplicate row(s)`);

    } catch (err) {
        console.error(err);
        toast("Failed to check duplicates", "error");
    }
}
//show missing values
async function showMissing() {
    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/missing");
        let result = await response.json();

        // If the server returned an object, convert it to an array
        if (!Array.isArray(result) && typeof result === "object" && result !== null) {
            result = Object.entries(result).map(([column, missing]) => ({
                Column: column,
                Missing: missing
            }));
        }

        // If it's not a valid array after conversion
        if (!Array.isArray(result)) {
            throw new Error("Unexpected response format.");
        }

        // Handle empty results
        if (result.length === 0) {
            showConsole("No missing values found.");
            toast("No missing values", "info");
            addLog("No missing values found");
            return;
        }

        showResultTable(result, "Missing Values per Column");
        addLog("Viewed missing values");

    } catch (err) {
        console.error(err);
        toast("Failed to calculate missing values", "error");
    }
}
