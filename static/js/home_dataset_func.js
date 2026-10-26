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
