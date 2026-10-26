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





