/* ═══════════════════════════════════════════════
   SAMPLE DATASET — Titanic-style
═══════════════════════════════════════════════ */
let SAMPLE_DATA = [];
/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
let DATA = JSON.parse(JSON.stringify(SAMPLE_DATA));
let ORIGINAL = JSON.parse(JSON.stringify(SAMPLE_DATA));
let COPIES = {};   // name → data[]
let selectedColIdx = null;
let logLines = [];
let currentVizType = '';
let currentModelType = '';
let vizChartInstance = null;
async function loadActiveScreenDataset() {

    try {

        const response = await fetch("/active_dataframe");

        if (!response.ok) {
            throw new Error("Server failed to load active dataset");
        }

        const result = await response.json();

        // -----------------------------------------
        // NO ACTIVE DATASET
        // -----------------------------------------

        if (!result.success) {

            SAMPLE_DATA = [];
            DATA = [];
            ORIGINAL = [];

            renderTable([]);

            console.log(result.message);

            // Don't show it as an error
            toast(
                result.message || "No dataset selected.",
                "info"
            );

            return;
        }


        // -----------------------------------------
        // DATASET FOUND
        // -----------------------------------------

        SAMPLE_DATA = result.data || [];

        DATA = structuredClone(SAMPLE_DATA);

        ORIGINAL = structuredClone(SAMPLE_DATA);


        renderTable(
            DATA,
            result.name
        );


        // -----------------------------------------
        // SHOW DATASET WORKSPACE
        // -----------------------------------------

        if (DATA.length > 0) {

            showDatasetWorkspace();

            toast(
                "Active dataset loaded",
                "success"
            );

        }

    } catch (err) {

        console.error(
            "Active dataset error:",
            err
        );

        SAMPLE_DATA = [];
        DATA = [];
        ORIGINAL = [];

        renderTable([]);

        toast(
            "Unable to load the dataset.",
            "error"
        );
    }
}



window.addEventListener("DOMContentLoaded", () => {
    loadActiveScreenDataset();
});


/* ═══════════════════════════════════════════════
   RENDER TABLE
═══════════════════════════════════════════════ */
function renderTable(data, label) {
    const thead = document.getElementById("thead-row");
    const tbody = document.getElementById("tbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";
    selectedColIdx = null;

    // Empty state
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100" class="empty-state">
                    <div class="empty-state-content">
                        <i class="fas fa-table fa-3x"></i>
                        <h2>Get Started</h2>
                        <p>Upload a CSV or JSON dataset to begin exploring and editing your data.</p>
                    </div>
                </td>
            </tr>
        `;

        if (label) {
            document.getElementById("dataset-label").textContent = label;
        }

        return;
    }

    const cols = Object.keys(data[0]);

    // Index column
    const idxTh = document.createElement("th");
    idxTh.textContent = "#";
    idxTh.style.width = "36px";
    idxTh.style.textAlign = "center";
    thead.appendChild(idxTh);

    // Headers
    cols.forEach((col, ci) => {
        const th = document.createElement("th");
        th.textContent = col;
        th.dataset.col = col;
        th.dataset.ci = ci;
        th.contentEditable = true;

        th.addEventListener("click", () => onHeaderClick(ci, col, th));
        th.addEventListener("blur", () => onHeaderBlur(th, ci));

        thead.appendChild(th);
    });

    // Rows
    data.forEach((row, ri) => {

        const tr = document.createElement("tr");

        // Row number
        const idxTd = document.createElement("td");
        idxTd.className = "row-idx";
        idxTd.textContent = ri;
        tr.appendChild(idxTd);

        cols.forEach((col) => {

            const td = document.createElement("td");
            const val = row[col];

            td.textContent =
                val === "" || val === null || val === undefined
                    ? ""
                    : val;

            td.contentEditable = true;

            if (val === "" || val === null || val === undefined) {
                td.classList.add("missing");
            }

            // Cell selection
            td.addEventListener("click", (e) => {

                if (!e.ctrlKey && !e.shiftKey) {
                    clearSelection();
                }

                td.classList.toggle("selected");

            });

            // Save only when editing finishes
            td.addEventListener("blur", async () => {

                const value = td.textContent.trim();

                // Update local copy
                DATA[ri][col] = value;

                // Missing value styling
                td.classList.toggle("missing", value === "");

                // Save to active dataset
                try {

                    await saveCell(ri, col, value);

                } catch (err) {

                    console.error(err);
                    toast("Failed to save changes", "error");

                }

            });

            tr.appendChild(td);

        });

        tbody.appendChild(tr);

    });

    if (label) {
        document.getElementById("dataset-label").textContent = label;
    }
}
//update row in real time
async function saveCell(row, column, value) {

    try {

        const response = await fetch("/update_cell", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                row,
                column,
                value
            })
        });


        const clonedResponse = response.clone();

        let result;


        try {

            result = await response.json();


        } catch (jsonError) {


            const text = await clonedResponse.text();


            console.error(
                "Server returned:",
                text
            );


            throw new Error(
                "Invalid server response"
            );

        }



        if (!response.ok) {

            throw new Error(
                result.message || "Server error"
            );

        }



        if (!result.success) {

            throw new Error(
                result.message || "Save failed"
            );

        }


        return true;



    } catch (err) {


        console.error(
            "Save error:",
            err
        );


        toast(
            "Failed to save cell",
            "error"
        );


        return false;

    }

}

function onHeaderClick(ci, col, th){
  if(selectedColIdx === ci){ openColPopup(col); return; }
  clearColHighlight();
  selectedColIdx = ci;
  document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td:not(.row-idx)');
    if(cells[ci]) cells[ci].classList.add('selected');
  });
  th.classList.add('selected-header');
}

function onHeaderBlur(th, ci){
  const newName = th.textContent.trim();
  const oldName = th.dataset.col;
  if(!newName || newName === oldName){ th.textContent = oldName; return; }
  DATA.forEach(row => { if(Object.hasOwn(row, oldName)){ row[newName] = row[oldName]; delete row[oldName]; } });
  th.dataset.col = newName;
  addLog(`Renamed column "${oldName}" → "${newName}"`);
}

function clearColHighlight(){
  document.querySelectorAll('#dataTable .selected-header').forEach(el => el.classList.remove('selected-header'));
  document.querySelectorAll('#dataTable tbody td.selected').forEach(el => el.classList.remove('selected'));
}

/* ═══════════════════════════════════════════════
   TOOLBAR ACTIONS
═══════════════════════════════════════════════ */
function selectAll(){ document.querySelectorAll('#dataTable tbody td:not(.row-idx)').forEach(td => td.classList.add('selected')); }
function clearSelection(){ document.querySelectorAll('#dataTable .selected').forEach(el => el.classList.remove('selected')); }

async function toUpper() {

    const cells = document.querySelectorAll("#dataTable tbody td.selected");

    let count = 0;


    for (const td of cells) {


        const rowElement = td.closest("tr");

        if (!rowElement) continue;


        const row = Array.from(
            rowElement.parentNode.children
        ).indexOf(rowElement);


        const columnIndex = Array.from(
            rowElement.querySelectorAll("td:not(.row-idx)")
        ).indexOf(td);


        if (row < 0 || columnIndex < 0) continue;


        const column = Object.keys(DATA[row])[columnIndex];


        const value = String(
            DATA[row][column] ?? ""
        ).toUpperCase();


        DATA[row][column] = value;


        td.textContent = value;


        await saveCell(
            row,
            column,
            value
        );


        count++;

    }


    addLog(`Uppercased ${count} cell(s)`);

    toast(
        "Converted to uppercase",
        "success"
    );

}

async function toLower() {

    const cells = document.querySelectorAll("#dataTable tbody td.selected");

    let count = 0;


    for (const td of cells) {


        const rowElement = td.closest("tr");

        if (!rowElement) continue;


        const row = Array.from(
            rowElement.parentNode.children
        ).indexOf(rowElement);


        const columnIndex = Array.from(
            rowElement.querySelectorAll("td:not(.row-idx)")
        ).indexOf(td);


        if (row < 0 || columnIndex < 0) continue;


        const column = Object.keys(DATA[row])[columnIndex];


        const value = String(
            DATA[row][column] ?? ""
        ).toLowerCase();


        DATA[row][column] = value;


        td.textContent = value;


        await saveCell(
            row,
            column,
            value
        );


        count++;

    }


    addLog(`Lowercased ${count} cell(s)`);

    toast(
        "Converted to lowercase",
        "success"
    );

}
async function addTen() {

    let count = 0;

    const cells = document.querySelectorAll("#dataTable tbody td.selected");

    for (const td of cells) {

        const rowElement = td.closest("tr");

        if (!rowElement) continue;


        // Get row index
        const row = Array.from(
            rowElement.parentNode.children
        ).indexOf(rowElement);


        // Get column index ignoring row number column
        const columnIndex = Array.from(
            rowElement.querySelectorAll("td:not(.row-idx)")
        ).indexOf(td);


        if (row < 0 || columnIndex < 0) continue;


        const column = Object.keys(DATA[row])[columnIndex];


        const value = parseFloat(DATA[row][column]);


        if (!isNaN(value)) {


            const newValue = +(value + 10).toFixed(4);


            // Update frontend memory
            DATA[row][column] = newValue;


            // Update table
            td.textContent = newValue;


            // Save to backend dataset
            await saveCell(
                row,
                column,
                newValue
            );


            count++;

        }

    }


    addLog(`Added 10 to ${count} numeric cell(s)`);

    toast(
        `Updated ${count} cell(s)`,
        "success"
    );

}
async function addColumn() {

    const name = prompt("New column name:");

    if (!name || !name.trim()) return;


    const column = name.trim();

    const defVal = prompt("Default value") || "";


    try {


        const response = await fetch("/add_column", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                column: column,
                default: defVal

            })

        });



        const result = await response.json();



        if (!result.success) {

            throw new Error(result.message || "Failed adding column");

        }



        // update frontend only after backend succeeds

        DATA.forEach(row => {

            row[column] = defVal;

        });


        renderTable(DATA);



        toast("Column added", "success");

        addLog(`Added column "${column}"`);



    } catch(err) {


        console.error("Add column error:", err);

        toast("Failed to save column", "error");


    }

}

async function dropSelectedColumn() {

    if (selectedColIdx == null) {

        toast("Select a column first", "error");
        return;

    }


    const col = Object.keys(DATA[0])[selectedColIdx];


    if (!confirm(`Drop "${col}"?`)) return;


    try {


        const response = await fetch("/drop_column", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                column: col

            })

        });



        const result = await response.json();



        if (!result.success) {

            throw new Error(result.message);

        }



        // update frontend after backend success

        DATA.forEach(row => {

            delete row[col];

        });


        renderTable(DATA);


        selectedColIdx = null;


        toast("Column dropped", "success");

        addLog(`Dropped ${col}`);



    } catch(err) {


        console.error(err);

        toast("Failed dropping column", "error");


    }

}

//rename
async function renameColumn() {


    if (selectedColIdx == null) {

        toast("Select a column first", "error");

        return;

    }



    const oldName = Object.keys(DATA[0])[selectedColIdx];


    const newName = prompt(
        "New name:",
        oldName
    );



    if (!newName || newName === oldName) return;



    try {


        const response = await fetch("/rename_column", {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                old_name:oldName,

                new_name:newName.trim()

            })

        });



        const result = await response.json();



        if(!result.success){

            throw new Error(result.message);

        }



        DATA.forEach(row=>{

            row[newName] = row[oldName];

            delete row[oldName];

        });



        renderTable(DATA);



        toast(
            "Column renamed",
            "success"
        );


        addLog(
            `Renamed ${oldName} → ${newName}`
        );



    }catch(err){

        console.error(err);

        toast(
            "Rename failed",
            "error"
        );

    }

}
//add   roww
async function addRow() {


    try {


        const response = await fetch("/add_row", {

            method:"POST"

        });



        const result = await response.json();



        if(!result.success){

            throw new Error(result.message);

        }



        const row = {};



        Object.keys(DATA[0]).forEach(col=>{

            row[col] = "";

        });



        DATA.push(row);



        renderTable(DATA);



        toast(
            "Row added",
            "success"
        );


        addLog(
            "Added new row"
        );



    }catch(err){


        console.error(err);


        toast(
            "Failed adding row",
            "error"
        );


    }

}

async function normalizeColumn() {


    if(selectedColIdx == null){

        toast(
            "Select a column first",
            "error"
        );

        return;

    }



    const col = Object.keys(DATA[0])[selectedColIdx];



    try{


        await applyNormalize(col);



        toast(
            "Column normalized",
            "success"
        );


        addLog(
            `Normalized ${col}`
        );



    }catch(err){


        console.error(err);


        toast(
            "Normalization failed",
            "error"
        );


    }

}

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



/* ═══════════════════════════════════════════════
   CLEANING
═══════════════════════════════════════════════ */

//helper
async function reloadActiveData() {

    try {
         // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/active_dataframe");

        const result = await response.json();

        DATA = result.data;

        renderTable(DATA, result.name);

        toast("Dataset reloaded", "success");

    } catch (err) {

        console.error(err);
        toast("Failed to reload dataset", "error");

    }

}
async function removeDuplicates() {

    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/remove_duplicates", {
            method: "POST"
        });

        const result = await response.json();

        await reloadActiveData();

        toast(
            `Removed ${result.removed} duplicate row(s)`,
            result.removed ? "success" : "info"
        );

        addLog(
            `Removed ${result.removed} duplicate row(s). ${result.rows} rows remain.`
        );

    } catch (err) {

        console.error(err);
        toast("Failed to remove duplicates", "error");

    }

}

async function dropMissing() {

    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        

        const response = await fetch("/drop_missing", {
            method: "POST"
        });

        const result = await response.json();

        await reloadActiveData();

        toast(
            `Dropped ${result.removed} row(s) with missing values`,
            result.removed ? "success" : "info"
        );

        addLog(
            `Dropped ${result.removed} row(s) with missing values. ${result.rows} rows remain.`
        );

    } catch (err) {

        console.error(err);
        toast("Failed to drop missing values", "error");

    }

}

async function fillMissing(method){
    // Make sure the dataset workspace is visible
        showDatasetWorkspace();

    for(const c of cols()){

        const vals = DATA
            .map(r => parseFloat(r[c]))
            .filter(v => !isNaN(v));

        let fill;

        if(method === "mean"){
            fill = vals.length
                ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(4)
                : null;
        }

        else if(method === "median"){

            vals.sort((a,b)=>a-b);

            const mid = Math.floor(vals.length/2);

            fill = vals.length
                ? (vals.length % 2
                    ? vals[mid]
                    : ((vals[mid-1]+vals[mid])/2).toFixed(4))
                : null;
        }

        else if(method === "mode"){

            const freq = {};

            DATA.forEach(r=>{

                const v = r[c];

                if(v!=="" && v!=null){

                    freq[v]=(freq[v]||0)+1;

                }

            });

            fill = Object.keys(freq).length
                ? Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b)
                : null;

        }

        if(fill != null){

            for(let rowIndex=0; rowIndex<DATA.length; rowIndex++){

                if(DATA[rowIndex][c]==="" || DATA[rowIndex][c]==null){

                    DATA[rowIndex][c]=fill;

                    await saveCell(rowIndex, c, fill);

                }

            }

        }

    }

    renderTable(DATA);

    toast(`Filled using ${method}`,"success");

}

async function applyNormalize(col) {

    const values = DATA.map(row => row[col]);

    const numericValues = values
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));


    if (numericValues.length === 0) {

        toast(
            "No numeric values found",
            "error"
        );

        return;

    }



    const min = Math.min(...numericValues);

    const max = Math.max(...numericValues);



    if (max === min) {

        toast(
            "Cannot normalize identical values",
            "error"
        );

        return;

    }



    const updates = [];



    DATA.forEach((row,index)=>{


        const value = parseFloat(row[col]);


        if(!isNaN(value)){


            const normalized =
                ((value - min) / (max - min))
                .toFixed(4);



            row[col] = normalized;



            updates.push({

                row:index,

                column:col,

                value:normalized

            });

        }


    });



    renderTable(DATA);



    // save every changed cell

    for(const update of updates){

        await saveCell(

            update.row,

            update.column,

            update.value

        );

    }



    addLog(
        `Normalized column "${col}"`
    );

}

/* ═══════════════════════════════════════════════
   COPIES
═══════════════════════════════════════════════ */
async function createCopy() {

    const name = prompt("Name for this copy:");

    if (!name || !name.trim()) return;

    try {

        const response = await fetch("/save_copies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name.trim(),
                data: DATA
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        toast(`Copy "${name}" saved`, "success");
        addLog(`Created copy "${name}"`);

        // Reload the copies from the server if you have a route for that
        renderCopiesList();

    } catch (err) {

        console.error(err);
        toast("Failed to save copy", "error");

    }

}

let copies = [];
let selectedCopy = null;

async function loadCopies() {

    try {

        const response = await fetch("/view_copies");
        const result = await response.json();

        if (!result.success) {
            toast(result.error, "error");
            return;
        }

        copies = result.copies;

        renderCopies();

    } catch (err) {

        console.error(err);
        toast("Failed to load copies", "error");

    }

}

async function toggleCopies() {

    const list = document.getElementById("copies-list");

    if (list.style.display === "none") {

        await loadCopies();
        list.style.display = "block";

    } else {

        list.style.display = "none";

    }

}

function renderCopies() {

    const list = document.getElementById("copies-list");

    list.innerHTML = "";

    copies.forEach((copy, index) => {

        const div = document.createElement("div");
        div.className = "copy-item";

        div.innerHTML = `
            <span class="copy-name">
                ${esc(copy.name)}
                <span style="color:var(--muted)">
                    (${copy.row_count}r)
                </span>
            </span>

            <button
                class="copy-actions"
                onclick="openCopyMenu(event, ${index})">

                <i class="fas fa-ellipsis-vertical"></i>

            </button>
        `;

        div.querySelector(".copy-name").addEventListener("click", () => {

            if (confirm(`Load copy "${copy.name}" as active dataset?`)) {

                loadCopy(copy.id, copy.name);

            }

        });

        list.appendChild(div);

    });

}

function openCopyMenu(e,index){

    e.stopPropagation();

    selectedCopy = index;

    const menu = document.getElementById("copyMenu");

    menu.style.display="flex";
    menu.style.left=e.pageX+"px";
    menu.style.top=e.pageY+"px";

}

window.addEventListener("click",()=>{

    document.getElementById("copyMenu").style.display="none";

});

function useSelectedCopy(){

    if(selectedCopy==null) return;

    currentDataFrame = structuredClone(copies[selectedCopy].data);

    refreshTable();

    document.getElementById("copyMenu").style.display="none";

}

function renameSelectedCopy(){

    if(selectedCopy==null) return;

    const name = prompt(
        "New name",
        copies[selectedCopy].name
    );

    if(name){

        copies[selectedCopy].name=name;
        renderCopies();

    }

}

function deleteSelectedCopy(){

    if(selectedCopy==null) return;

    if(confirm("Delete this DataFrame copy?")){

        copies.splice(selectedCopy,1);
        renderCopies();

    }

}

/*all topbar dataset functions */
let datasets = [];

/* ============================
   Open / Close dropdown
============================ */

async function toggleDatasetsMenu() {

    const menu = document.getElementById("datasetsMenu");

    if (menu.style.display === "block") {

        menu.style.display = "none";
        return;

    }

    menu.style.display = "block";

    await loadDatasets();

}

/* Close when clicking elsewhere */

window.addEventListener("click", function (e) {

    const menu = document.getElementById("datasetsMenu");
    const container = document.querySelector(".dataset-dropdown");

    if (container && !container.contains(e.target)) {

        menu.style.display = "none";

    }

});

/* ============================
   Load datasets
============================ */

async function loadDatasets() {

    try {

        const response = await fetch("/loggedin_datasets");

        const result = await response.json();

        if (!result.success) {

            toast(result.error || "Failed to load datasets", "error");
            return;

        }

        datasets = result.datasets;

        renderDatasets();

    }

    catch (err) {

        console.error(err);

        toast("Failed to load datasets", "error");

    }

}

/* ============================
   Render datasets
============================ */

function renderDatasets() {

    const menu = document.getElementById("datasetsMenu");

    menu.innerHTML = "";

    if (datasets.length === 0) {

        menu.innerHTML = `
            <div class="dataset-empty">
                No datasets found
            </div>
        `;

        return;

    }

    datasets.forEach(dataset => {

        const datasetActiveClass =
            dataset.active ? "active" : "";

        const datasetBadge =
            dataset.active
                ? `<span class="active-badge">Active</span>`
                : "";

        let html = `

        <div class="dataset ${datasetActiveClass}">

            <div class="dataset-header">

                <button
                    class="dataset-arrow"
                    onclick="toggleDataset(${dataset.id})">

                    <i class="fas fa-chevron-right"></i>

                </button>

                <span
                    class="dataset-name ${datasetActiveClass}"
                    onclick="loadDataset(${dataset.id})">

                    <i class="fas fa-table"></i>

                    ${dataset.name}

                    ${datasetBadge}

                </span>

                <div class="dataset-actions">

                    <button
                        class="icon-btn"
                        title="Rename Dataset"
                        onclick="event.stopPropagation(); renameDataset(${dataset.id}, false)">

                        <i class="fas fa-pen"></i>

                    </button>

                    <button
                        class="icon-btn delete"
                        title="Delete Dataset"
                        onclick="event.stopPropagation(); deleteDataset(${dataset.id}, false)">

                        <i class="fas fa-trash"></i>

                    </button>

                </div>

            </div>

            <div
                class="dataset-copies"
                id="dataset-${dataset.id}"
                style="display:none;">

        `;

        html += `

            <div
                class="copy-item ${dataset.active ? "active" : ""}"
                onclick="loadDataset(${dataset.id})">

                <i class="fas fa-database"></i>

                Original Dataset

            </div>

        `;

        dataset.copies.forEach(copy => {

            html += `

            <div
                class="copy-item ${copy.active ? "active" : ""}"
                onclick="loadDataset(${copy.id}, true)">

                <div class="copy-left">

                    <i class="far fa-copy"></i>

                    <span>${copy.name}</span>

                    <span class="rows">
                        (${copy.row_count})
                    </span>

                    ${
                        copy.active
                            ? `<span class="active-badge">Active</span>`
                            : ""
                    }

                </div>

                <div class="copy-actions">

                    <button
                        class="icon-btn"
                        title="Rename Copy"
                        onclick="event.stopPropagation(); renameDataset(${copy.id}, true)">

                        <i class="fas fa-pen"></i>

                    </button>

                    <button
                        class="icon-btn delete"
                        title="Delete Copy"
                        onclick="event.stopPropagation(); deleteDataset(${copy.id}, true)">

                        <i class="fas fa-trash"></i>

                    </button>

                </div>

            </div>

            `;

        });

        html += `
            </div>
        </div>
        `;

        menu.insertAdjacentHTML(
            "beforeend",
            html
        );

    });

}

/* ============================
   Expand / Collapse dataset
============================ */

function toggleDataset(id) {

    const body = document.getElementById(`dataset-${id}`);

    const arrow = body.previousElementSibling.querySelector("i");

    if (body.style.display === "none") {

        body.style.display = "block";

        arrow.classList.remove("fa-chevron-right");
        arrow.classList.add("fa-chevron-down");

    }

    else {

        body.style.display = "none";

        arrow.classList.remove("fa-chevron-down");
        arrow.classList.add("fa-chevron-right");

    }

}

/* ============================
   Load original dataset
============================ */
async function loadDataset(id, copy = false) {

    try {

        showLoader("Loading...");
        updateLoader(15, "Connecting");

        const url = copy
            ? `/datasets/${id}/copy`
            : `/datasets/${id}`;

        const response = await fetch(url);

        updateLoader(45, "Reading data");

        const result = await response.json();

        if (!result.success) {

            hideLoader();

            toast(
                result.error || "Unable to load dataset",
                "error"
            );

            return;
        }

        updateLoader(70, "Preparing table");

        // -----------------------------------------
        // Dataset is now active
        // -----------------------------------------

        DATA = result.data || [];

        ORIGINAL = structuredClone(DATA);

        SAMPLE_DATA = structuredClone(DATA);

        updateLoader(90, "Rendering");

        renderTable(
            DATA,
            result.name
        );

        showResultTable([], "no data");

        // -----------------------------------------
        // Make sure we're showing dataset workspace
        // -----------------------------------------

        showDatasetWorkspace();

        updateLoader(100, "Completed ✓");

        toast(
            `Loaded "${result.name}" — ${DATA.length} rows`,
            "success"
        );

        addLog(
            `Loaded "${result.name}"`
        );

        document.getElementById(
            "datasetsMenu"
        ).style.display = "none";


        // -----------------------------------------
        // Refresh dataset menu
        // -----------------------------------------

        loadActiveScreenDataset();
        


        // -----------------------------------------
        // Refresh overview data
        // -----------------------------------------

        // Don't reload the dataframe.
        // Only request overview statistics.
        loadOverview();


        hideLoader();

    } catch (err) {

        console.error(
            "Load dataset error:",
            err
        );

        hideLoader();

        toast(
            "Unable to load dataset",
            "error"
        );
    }
}

/*rename dataset */
async function renameDataset(id, isCopy = false) {

    const current = isCopy
        ? datasets.flatMap(d => d.copies).find(c => c.id === id)?.name
        : datasets.find(d => d.id === id)?.name;

    const newName = prompt("Enter a new name:", current);

    if (newName === null) return;

    if (!newName.trim()) {
        toast("Name cannot be empty.", "error");
        return;
    }

    try {

        const url = isCopy
            ? `/rename_copy/${id}`
            : `/rename_dataset/${id}`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: newName.trim()
            })
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        toast("Renamed successfully.", "success");

        await loadDatasets();

    } catch (err) {

        toast(err.message, "error");

    }

}

/*delete dataset */
async function deleteDataset(id, isCopy = false) {

    const confirmed = confirm(
        `Delete this ${isCopy ? "copy" : "dataset"}?`
    );

    if (!confirmed) return;

    try {

        const url = isCopy
            ? `/delete_copy/${id}`
            : `/delete_dataset/${id}`;

        const res = await fetch(url, {
            method: "POST"
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        toast(
            `${isCopy ? "Copy" : "Dataset"} deleted.`,
            "success"
        );

        await loadDatasets();

    } catch (err) {

        toast(err.message, "error");

    }

}

/*progressbarforloadeddataset*/
function showLoader(message = "Loading...") {

    const uploadContainer = document.getElementById("uploadContainer");
    const progressCircle = document.querySelector(".progress");
    const progressText = document.getElementById("uploadPercent");

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;

    uploadContainer.style.display = "flex";
    progressText.innerHTML = message;
}

function updateLoader(percent, message = "") {

    const progressCircle = document.querySelector(".progress");
    const progressText = document.getElementById("uploadPercent");

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDashoffset =
        circumference - (percent / 100) * circumference;

    progressText.innerHTML = `${percent}%<br><small>${message}</small>`;
}

function hideLoader() {

    const uploadContainer = document.getElementById("uploadContainer");
    const progressCircle = document.querySelector(".progress");
    const progressText = document.getElementById("uploadPercent");

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    setTimeout(() => {

        uploadContainer.style.display = "none";
        progressCircle.style.strokeDashoffset = circumference;
        progressText.innerHTML = "0%";

    }, 800);

}


/*change  theme */
// ----------------------------
// APPLY THEME
// ----------------------------
// ----------------------------
// APPLY THEME
// ----------------------------
function applyTheme(theme) {

    const root = document.documentElement;

    if (theme === "dark") {

        /* ================================================
           DARK THEME — NEUTRAL BLACK / GRAY
        ================================================ */

        root.style.setProperty("--bg", "#121212");

        root.style.setProperty("--panel", "#1a1a1a");

        root.style.setProperty("--panel2", "#212121");

        root.style.setProperty("--border", "#2a2a2a");


        /* Accent */

        root.style.setProperty("--accent", "#7c6af6");

        root.style.setProperty("--accent2", "#38bdf8");


        /* Status */

        root.style.setProperty("--green", "#22c55e");

        root.style.setProperty("--red", "#ef4444");

        root.style.setProperty("--yellow", "#f59e0b");


        /* Text */

        root.style.setProperty("--text", "#e0e0e0");

        root.style.setProperty("--muted", "#9e9e9e");

        root.style.setProperty("--white", "#ffffff");


        /* Card */

        root.style.setProperty("--card", "#1a1a1a");


    } else {

        /* ================================================
           LIGHT THEME
        ================================================ */

        root.style.setProperty("--bg", "#ffffff");

        root.style.setProperty("--panel", "#ffffff");

        root.style.setProperty("--panel2", "#f8fafc");

        root.style.setProperty("--border", "#e2e8f0");


        /* Accent */

        root.style.setProperty("--accent", "#7c6af6");

        root.style.setProperty("--accent2", "#38bdf8");


        /* Status */

        root.style.setProperty("--green", "#22c55e");

        root.style.setProperty("--red", "#ef4444");

        root.style.setProperty("--yellow", "#f59e0b");


        /* Text */

        root.style.setProperty("--text", "#0f172a");

        root.style.setProperty("--muted", "#64748b");

        root.style.setProperty("--white", "#ffffff");


        /* Card */

        root.style.setProperty("--card", "#ffffff");

    }

    root.setAttribute("data-theme", theme);

    updateThemeButton(theme);

}




// ----------------------------
// UPDATE BUTTON
// ----------------------------
function updateThemeButton(theme) {

    const themeText = document.getElementById("theme-text");
    const themeIcon = document.getElementById("theme-icon");

    if (!themeText || !themeIcon) return;

    if (theme === "dark") {

        // Currently dark, so button should offer light mode
        themeText.textContent = "Light Mode";
        themeIcon.className = "fas fa-sun";

    } else {

        // Currently light, so button should offer dark mode
        themeText.textContent = "Dark Mode";
        themeIcon.className = "fas fa-moon";

    }

}



// ----------------------------
// LOAD CURRENT THEME
// ----------------------------
async function loadTheme() {

    try {

        const response = await fetch("/get_theme");

        if (!response.ok) {
            throw new Error("Failed to load theme");
        }

        const result = await response.json();

        // Guest / no saved theme
        if (!result.success) {

            console.log(result.message);

            // Use default theme
            applyTheme("light");

            return;
        }

        // Logged-in user's saved theme
        applyTheme(result.theme);

    } catch (error) {

        console.error("Theme loading error:", error);

        // Fallback
        applyTheme("light");
    }
}



// ----------------------------
// TOGGLE THEME
// ----------------------------
function toggleTheme() {

    const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";

    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    if (!confirm(`Switch to ${newTheme} mode?`)) {
        return;
    }


    fetch("/update_theme", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            theme: newTheme
        })

    })
    .then(response => response.json())
    .then(data => {

        if (data.success) {

            applyTheme(data.theme);

        } else {

            alert(data.error);

        }

    })
    .catch(error => {

        console.error(error);

        alert("Server error");

    });

}



// ----------------------------
// PAGE LOAD
// ----------------------------
document.addEventListener("DOMContentLoaded", function () {

    loadTheme();

});
/* ═══════════════════════════════════════════════
   COLUMN POPUP
═══════════════════════════════════════════════ */
function openColPopup(col){
  document.getElementById('col-popup-title').textContent = `Column: ${col}`;
  document.getElementById('col-action').value = '';
  document.getElementById('col-custom').style.display = 'none';
  document.getElementById('col-overlay').classList.add('open');
}
function closeColPopup(e){ if(e && e.target!==e.currentTarget) return; document.getElementById('col-overlay').classList.remove('open'); }
document.getElementById('col-action').addEventListener('change', function(){ document.getElementById('col-custom').style.display = this.value==='fill_custom'?'block':'none'; });

function applyColAction(){
  if(selectedColIdx===null){ toast('No column selected','error'); return; }
  const col = Object.keys(DATA[0])[selectedColIdx];
  const action = document.getElementById('col-action').value;
  const custom = document.getElementById('col-custom').value.trim();
  const cells = Array.from(document.querySelectorAll('#dataTable tbody tr')).map(tr => {
    const tds = tr.querySelectorAll('td:not(.row-idx)');
    return tds[selectedColIdx];
  }).filter(Boolean);

  if(!action){ toast('Pick an action','error'); return; }
  if(action==='drop'){ if(confirm(`Drop column "${col}"?`)){ DATA.forEach(r=>delete r[col]); renderTable(DATA); addLog(`Dropped column "${col}"`); } }
  else if(action==='upper'){ cells.forEach((td,i)=>{ DATA[i][col]=String(DATA[i][col]||'').toUpperCase(); td.textContent=DATA[i][col]; }); }
  else if(action==='lower'){ cells.forEach((td,i)=>{ DATA[i][col]=String(DATA[i][col]||'').toLowerCase(); td.textContent=DATA[i][col]; }); }
  else if(action==='clear'){ cells.forEach((td,i)=>{ DATA[i][col]=''; td.textContent=''; }); }
  else if(action==='normalize'){ applyNormalize(col); }
  else if(action.startsWith('fill_')){ fillMissing(action.replace('fill_','')); if(action==='fill_custom'){ DATA.forEach(r=>{ if(r[col]===''||r[col]==null) r[col]=custom; }); renderTable(DATA); } }

  toast(`Applied "${action}" to column "${col}"`, 'success');
  addLog(`Column action "${action}" on "${col}"`);
  closeColPopup();
}

/* ═══════════════════════════════════════════════
   CSV / JSON UPLOAD
═══════════════════════════════════════════════ */
document.querySelectorAll(".fileInput").forEach(input => {
    input.addEventListener("change", async function () {

        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const uploadContainer = document.getElementById("uploadContainer");
        const progressCircle = document.querySelector(".progress");
        const progressText = document.getElementById("uploadPercent");

        const radius = 52;
        const circumference = 2 * Math.PI * radius;

        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;

        uploadContainer.style.display = "flex";
        progressText.textContent = "0%";

        try {

            await new Promise((resolve, reject) => {

                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/upload", true);

                let startTime = Date.now();

                xhr.upload.addEventListener("loadstart", () => {
                    progressText.textContent = "0%";
                });

                xhr.upload.addEventListener("progress", (e) => {

                    console.log("Progress:", e.loaded, "/", e.total);

                    if (!e.lengthComputable) return;

                    const percent = Math.round((e.loaded / e.total) * 100);

                    const offset = circumference - (percent / 100) * circumference;

                    progressCircle.style.strokeDashoffset = offset;

                    const elapsed = (Date.now() - startTime) / 1000;
                    const speed = elapsed > 0 ? e.loaded / elapsed : 0;

                    progressText.innerHTML =
                        `${percent}%<br><small>${(speed / 1024 / 1024).toFixed(2)} MB/s</small>`;

                });

                xhr.onload = function () {

                    let result;

                    try {
                        result = JSON.parse(xhr.responseText);
                    } catch {
                        reject(new Error("Invalid server response"));
                        return;
                    }

                    if (xhr.status >= 200 && xhr.status < 300) {

                        progressCircle.style.strokeDashoffset = 0;
                        progressText.innerHTML = "Processing...";

                        resolve(result);

                    } else {
                        reject(new Error(result.error || "Upload failed"));
                    }
                };

                xhr.onerror = () => reject(new Error("Network error"));

                xhr.send(formData);

            });

            progressText.innerHTML = "Loading dataset...";

            const dataRes = await fetch("/dataset");
            const dataset = await dataRes.json();

            DATA = dataset;
            ORIGINAL = JSON.parse(JSON.stringify(DATA));

            renderTable(DATA, file.name);

            toast(`Loaded "${file.name}" — ${DATA.length} rows`, "success");

            addLog(
                `Uploaded "${file.name}" (${DATA.length} rows × ${Object.keys(DATA[0] || {}).length} cols)`
            );

            progressText.innerHTML = "Completed ✓";

        } catch (err) {

            progressText.innerHTML = "Failed ✕";
            toast(err.message, "error");

        } finally {

            setTimeout(() => {

                uploadContainer.style.display = "none";

                progressCircle.style.strokeDashoffset = circumference;
                progressText.innerHTML = "0%";

            }, 1000);

            // Clear values on all file inputs so they can re-upload the same file if needed
            document.querySelectorAll(".file-input").forEach(el => el.value = "");

        }

    });
});
/* ═══════════════════════════════════════════════
   EXPORT CSV
═══════════════════════════════════════════════ */
function exportCSV(){
  if(!DATA.length){ toast('No data to export','error'); return; }
  const headers = cols();
  const rows = [headers.join(','), ...DATA.map(r => headers.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))];
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = document.getElementById('dataset-label').textContent.replace(/\..*$/,'')+'.csv';
  a.click(); URL.revokeObjectURL(a.href);
  addLog('Exported CSV');
}

function resetData(){
  if(!confirm('Reset to original dataset?')) return;
  DATA = JSON.parse(JSON.stringify(ORIGINAL));
  renderTable(DATA, '');
  toast('Dataset reset', 'info');
  addLog('Dataset reset to original');
}

/* ═══════════════════════════════════════════════
   VISUALIZATION
═══════════════════════════════════════════════ */
function numCols(){ return cols().filter(c => DATA.map(r=>parseFloat(r[c])).filter(v=>!isNaN(v)).length > DATA.length*0.5); }
function catCols(){ return cols().filter(c => !numCols().includes(c)); }
function colSelect(label, id, optCols){ return `<div class="form-group"><label>${label}</label><select id="${id}">${optCols.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>`; }

function openViz(type){
  currentVizType = type;
  const el = document.getElementById('viz-overlay');
  const titleMap = {histogram:'Histogram', scatter:'Scatter Plot', bar:'Bar Chart'};
  document.getElementById('viz-title').innerHTML = `<i class="fas fa-chart-column" style="color:var(--accent)"></i> ${titleMap[type]}`;
  const form = document.getElementById('viz-form');
  if(type==='histogram') form.innerHTML = colSelect('Column (numeric)', 'v-col', numCols());
  else if(type==='scatter') form.innerHTML = colSelect('X Axis', 'v-x', numCols()) + colSelect('Y Axis', 'v-y', numCols());
  else if(type==='bar') form.innerHTML = colSelect('Category', 'v-cat', catCols()) + colSelect('Value', 'v-val', numCols());
  if(vizChartInstance){ vizChartInstance.destroy(); vizChartInstance=null; }
  document.getElementById('viz-canvas').getContext('2d').clearRect(0,0,9999,9999);
  el.classList.add('open');
}
function closeViz(){ document.getElementById('viz-overlay').classList.remove('open'); }

async function runViz(){

    const ctx = document
        .getElementById('viz-canvas')
        .getContext('2d');


    if(vizChartInstance){
        vizChartInstance.destroy();
        vizChartInstance = null;
    }


    const palette = [
        '#7c6af6',
        '#38bdf8',
        '#22c55e',
        '#f59e0b',
        '#ef4444',
        '#ec4899',
        '#a78bfa',
        '#34d399'
    ];


    let payload = {};


    // -----------------------------
    // Prepare request
    // -----------------------------

    if(currentVizType === "histogram"){

        payload = {

            type:"histogram",

            column:
            document.getElementById("v-col").value

        };


    }


    else if(currentVizType === "scatter"){

        payload = {

            type:"scatter",

            x:
            document.getElementById("v-x").value,

            y:
            document.getElementById("v-y").value

        };


    }


    else if(currentVizType === "bar"){

        payload = {

            type:"bar",

            category:
            document.getElementById("v-cat").value,

            value:
            document.getElementById("v-val").value

        };

    }



    try {


        const response = await fetch("/visualize",{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify(payload)

        });



        const result = await response.json();



        if(result.error){

            toast(result.error,"error");
            return;

        }



        // -----------------------------
        // Histogram
        // -----------------------------

        if(currentVizType === "histogram"){


            vizChartInstance = new Chart(ctx,{

                type:"bar",

                data:{

                    labels:result.labels,

                    datasets:[{

                        label:result.column,

                        data:result.data,

                        backgroundColor:
                        "rgba(124,106,246,.7)",

                        borderColor:
                        "#7c6af6",

                        borderWidth:1

                    }]

                },

                options:{

                    plugins:{

                        legend:{

                            labels:{

                                color:"#e2e8f0"

                            }

                        }

                    }

                }

            });


        }



        // -----------------------------
        // Scatter
        // -----------------------------

        else if(currentVizType === "scatter"){


            vizChartInstance = new Chart(ctx,{

                type:"scatter",

                data:{


                    datasets:[{

                        label:result.label,

                        data:result.points,

                        backgroundColor:
                        "rgba(56,189,248,.6)",

                        pointRadius:5

                    }]


                },


                options:{

                    plugins:{

                        legend:{

                            labels:{

                                color:"#e2e8f0"

                            }

                        }

                    },


                    scales:{

                        x:{

                            ticks:{

                                color:"#64748b"

                            }

                        },


                        y:{

                            ticks:{

                                color:"#64748b"

                            }

                        }

                    }

                }

            });


        }




        // -----------------------------
        // Bar chart
        // -----------------------------

        else if(currentVizType === "bar"){


            vizChartInstance = new Chart(ctx,{

                type:"bar",


                data:{


                    labels:result.labels,


                    datasets:[{


                        label:result.label,


                        data:result.data,


                        backgroundColor:
                        result.labels.map(
                            (_,i)=>
                            palette[i % palette.length] + "cc"
                        ),


                        borderColor:
                        result.labels.map(
                            (_,i)=>
                            palette[i % palette.length]
                        ),


                        borderWidth:1


                    }]

                },


                options:{


                    plugins:{


                        legend:{


                            labels:{


                                color:"#e2e8f0"


                            }


                        }


                    },


                    scales:{


                        x:{

                            ticks:{

                                color:"#64748b"

                            }

                        },


                        y:{

                            ticks:{

                                color:"#64748b"

                            }

                        }


                    }


                }


            });


        }



        addLog(`Generated ${currentVizType} chart`);



    }


    catch(error){


        console.error(error);

        toast(
            "Failed to generate visualization",
            "error"
        );


    }

}
//download chart  pdf  format
function downloadChartPDF(){


    if(!vizChartInstance){

        toast(
            "Generate a chart first",
            "error"
        );

        return;

    }



    const canvas = document.getElementById(
        "viz-canvas"
    );



    const image = canvas.toDataURL(
        "image/png",
        1.0
    );



    const { jsPDF } = window.jspdf;



    const pdf = new jsPDF({

        orientation:"landscape",

        unit:"px",

        format:[
            canvas.width,
            canvas.height
        ]

    });



    pdf.addImage(

        image,

        "PNG",

        0,

        0,

        canvas.width,

        canvas.height

    );



    pdf.save(
        `${currentVizType}_chart.pdf`
    );



    addLog(
        `Downloaded ${currentVizType} chart PDF`
    );


    toast(
        "PDF downloaded",
        "success"
    );

}
//show premium
function openPremiumOverlay(){

    const overlay = document.getElementById("premium-overlay");

    if(overlay){

        overlay.classList.add("open");

    }

}



function closePremiumOverlay(){

    const overlay = document.getElementById("premium-overlay");

    if(overlay){

        overlay.classList.remove("open");

    }

}

/* ═══════════════════════════════════════════════
   MODELS (simulated)
═══════════════════════════════════════════════ */
function openModel(type){
  currentModelType = type;
  const names = {linear:'Linear Regression', logistic:'Logistic Regression', dtree:'Decision Tree'};
  document.getElementById('model-title').innerHTML = `<i class="fas fa-robot" style="color:var(--accent)"></i> ${names[type]}`;
  const nc = numCols(); const cc = cols();
  document.getElementById('model-form').innerHTML =
    colSelect('Target (Y)', 'm-y', cc) + colSelect('Feature 1 (X)', 'm-x1', nc) + colSelect('Feature 2 (X)', 'm-x2', nc);
  document.getElementById('model-result').innerHTML = '';
  document.getElementById('model-overlay').classList.add('open');
}
function closeModel(){ document.getElementById('model-overlay').classList.remove('open'); }

function runModel(){
  const yCol = document.getElementById('m-y').value;
  const x1Col = document.getElementById('m-x1').value;
  const resultEl = document.getElementById('model-result');
  resultEl.innerHTML = '<div style="color:var(--muted);font-size:.82rem"><i class="fas fa-spinner fa-spin"></i> Training…</div>';

  setTimeout(() => {
    // Simulated metrics
    const r2   = (Math.random()*0.35+0.60).toFixed(4);
    const mse  = (Math.random()*50+5).toFixed(4);
    const mae  = (Math.random()*10+1).toFixed(4);
    const acc  = (Math.random()*0.18+0.78).toFixed(4);
    const prec = (Math.random()*0.15+0.80).toFixed(4);
    const rec  = (Math.random()*0.15+0.75).toFixed(4);
    const f1   = ((2*parseFloat(prec)*parseFloat(rec))/(parseFloat(prec)+parseFloat(rec))).toFixed(4);

    let html = `<div style="font-size:.78rem;color:var(--muted);margin-bottom:10px">Model trained on <b style="color:var(--text)">${DATA.length}</b> samples · Target: <b style="color:var(--accent2)">${yCol}</b> · Feature: <b style="color:var(--accent2)">${x1Col}</b></div>`;

    if(currentModelType==='linear'){
      const slope = (Math.random()*2-1).toFixed(4), intercept = (Math.random()*10-5).toFixed(4);
      html += `<div style="font-family:var(--mono);font-size:.78rem;background:var(--panel2);padding:10px 14px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px;color:var(--accent2)">ŷ = ${slope} × ${x1Col} + ${intercept}</div>`;
      html += `<div class="metric-grid">
        <div class="metric-card"><div class="val">${r2}</div><div class="lbl">R² Score</div></div>
        <div class="metric-card"><div class="val">${mse}</div><div class="lbl">MSE</div></div>
        <div class="metric-card"><div class="val">${mae}</div><div class="lbl">MAE</div></div>
        <div class="metric-card"><div class="val">${DATA.length}</div><div class="lbl">Samples</div></div>
      </div>`;
    } else if(currentModelType==='logistic'){
      html += `<div class="metric-grid">
        <div class="metric-card"><div class="val">${acc}</div><div class="lbl">Accuracy</div></div>
        <div class="metric-card"><div class="val">${prec}</div><div class="lbl">Precision</div></div>
        <div class="metric-card"><div class="val">${rec}</div><div class="lbl">Recall</div></div>
        <div class="metric-card"><div class="val">${f1}</div><div class="lbl">F1 Score</div></div>
      </div>
      <div style="margin-top:14px;font-size:.78rem;color:var(--muted)">Confusion Matrix (simulated)</div>
      <table class="out-table" style="margin-top:8px;width:auto">
        <thead><tr><th></th><th>Pred 0</th><th>Pred 1</th></tr></thead>
        <tbody>
          <tr><td style="color:var(--muted)">Actual 0</td><td style="color:var(--green)">${Math.floor(Math.random()*30+50)}</td><td style="color:var(--red)">${Math.floor(Math.random()*10+3)}</td></tr>
          <tr><td style="color:var(--muted)">Actual 1</td><td style="color:var(--red)">${Math.floor(Math.random()*8+2)}</td><td style="color:var(--green)">${Math.floor(Math.random()*25+40)}</td></tr>
        </tbody>
      </table>`;
    } else if(currentModelType==='dtree'){
      const depth = Math.floor(Math.random()*3+3);
      html += `<div class="metric-grid">
        <div class="metric-card"><div class="val">${acc}</div><div class="lbl">Accuracy</div></div>
        <div class="metric-card"><div class="val">${depth}</div><div class="lbl">Max Depth</div></div>
        <div class="metric-card"><div class="val">${Math.floor(Math.random()*4+2)}</div><div class="lbl">Leaves</div></div>
        <div class="metric-card"><div class="val">${f1}</div><div class="lbl">F1 Score</div></div>
      </div>
      <div style="margin-top:12px;font-size:.78rem;color:var(--muted)">Feature Importance</div>
      <div style="background:var(--panel2);border-radius:8px;padding:10px 14px;margin-top:6px;font-family:var(--mono);font-size:.75rem">
        ${x1Col}: ${'█'.repeat(Math.floor(Math.random()*12+6))} ${(Math.random()*0.4+0.4).toFixed(3)}<br>
        (other features) ${'█'.repeat(Math.floor(Math.random()*6+2))} ${(Math.random()*0.3+0.1).toFixed(3)}
      </div>`;
    }

    resultEl.innerHTML = html;
    addLog(`Trained ${currentModelType} model — Target: ${yCol}, Feature: ${x1Col}`);
  }, 900);
}

/* ═══════════════════════════════════════════════
   OUTPUT PANEL
═══════════════════════════════════════════════ */
function switchTab(tab){
  document.querySelectorAll('.out-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
  ['console','result','log'].forEach(t => document.getElementById('out-'+t).style.display = t===tab?'block':'none');
}

function showConsole(text){
  document.getElementById('out-console').innerHTML = `<div class="out-text">${esc(text)}</div>`;
  switchTab('console');
}

function showResultTable(rows, title){
  if(!rows.length){ showConsole('No data returned.'); return; }
  const headers = Object.keys(rows[0]);
  const html = `<div style="font-size:.75rem;color:var(--muted);margin-bottom:8px">${esc(title)}</div>
    <table class="out-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${esc(String(r[h]??''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  document.getElementById('out-result').innerHTML = html;
  switchTab('result');
}

//extend output table
function toggleOutputSize(){

    const panel = document.querySelector(".output-panel");
    const icon = document.getElementById("expandIcon");

    panel.classList.toggle("expanded");

    if(panel.classList.contains("expanded")){
        icon.classList.remove("fa-expand");
        icon.classList.add("fa-compress");
    }else{
        icon.classList.remove("fa-compress");
        icon.classList.add("fa-expand");
    }
}
function toggleOutputPanel(){

    const panel = document.querySelector(".output-panel");
    const restore = document.getElementById("restoreOutputBtn");
    const collapse = document.querySelector(".collapse-btn");

    if(panel.style.display === "none"){

        panel.style.display = "";
        restore.style.display = "none";
        collapse.style.display = "";

    }else{

        panel.style.display = "none";
        restore.style.display = "";
        collapse.style.display = "none";

    }

}
/* ═══════════════════════════════════════════════
   LOG
═══════════════════════════════════════════════ */
function addLog(msg){
  const now = new Date().toLocaleTimeString();
  logLines.unshift(`[${now}] ${msg}`);
  if(logLines.length>100) logLines.pop();
  document.getElementById('log-text').textContent = logLines.join('\n');
}

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function toast(msg, type='info'){
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = {success:'fa-circle-check',error:'fa-circle-xmark',info:'fa-circle-info'};
  el.innerHTML = `<i class="fas ${icons[type]||'fa-circle-info'}"></i> ${esc(msg)}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>el.remove(), 3200);
}

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
renderTable(DATA, '');
addLog('no active datasets loaded for now');
