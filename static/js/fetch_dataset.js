
  // Load datasets
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