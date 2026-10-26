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
