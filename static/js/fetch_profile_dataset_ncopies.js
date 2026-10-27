// ============================================================
// GET DATASETS
// GET /profile_details/datasets
// ============================================================

async function fetchUserDatasets() {

    try {

        const data = await fetchProfileEndpoint(
            "/profile_details/datasets"
        );

        profileDatasets =
            data.datasets || [];

        console.log("Datasets:", profileDatasets);

        renderDatasets(profileDatasets);

        return profileDatasets;

    } catch (error) {

        console.error("Could not load datasets:", error);

        return [];
    }
}


// ============================================================
// RENDER DATASETS
// ============================================================


function renderDatasets(datasets) {

    const container =
        document.querySelector("#dataset-list");

    if (!container) {
        console.error("Dataset container #dataset-list not found");
        return;
    }

    if (!datasets || datasets.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-database"></i>
                <p>No datasets yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = datasets.map(dataset => {

        const name =
            dataset.updated_name ||
            dataset.original_name ||
            "Unnamed Dataset";

        const size =
            dataset.file_size
                ? formatBytes(dataset.file_size)
                : "";

        const rows =
            dataset.row_count || 0;

        const columns =
            dataset.column_count || 0;

        const status =
            dataset.status || "active";

        const created =
            dataset.created_at || "";

        return `

            <div class="workspace-row">

                <div class="row-info">

                    <h4>
                        <i class="fa-solid fa-database"
                           style="color: var(--primary-color);">
                        </i>

                        ${escapeHTML(name)}
                    </h4>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(status)}
                    </p>

                    <p>
                        ${rows.toLocaleString()} rows
                        • ${columns.toLocaleString()} columns
                        ${size ? ` • ${size}` : ""}
                    </p>

                    ${
                        created
                            ? `
                                <p>
                                    Added:
                                    ${formatDate(created)}
                                </p>
                              `
                            : ""
                    }

                </div>

                <div class="row-actions">

                    <!-- OPEN DATASET -->

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="viewDataset(${dataset.id})"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View
                    </button>


                    <!-- RENAME -->

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="renameDataset(${dataset.id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Rename
                    </button>


                    <!-- DELETE -->

                    <button
                        type="button"
                        class="btn btn-danger"
                        onclick="deleteDataset(${dataset.id})"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>


                </div>

            </div>

        `;

    }).join("");
}
// ============================================================
// GET DATASET COPIES
// ============================================================

async function fetchDatasetCopies() {

    try {

        const data =
            await fetchProfileEndpoint(
                "/profile_details/copies"
            );

        profileCopies =
            data.copies || [];

        console.log(
            "Dataset copies:",
            profileCopies
        );

        renderDatasetCopies(
            profileCopies
        );

        return profileCopies;

    } catch (error) {

        console.error(
            "Could not load dataset copies:",
            error
        );

        return [];

    }
}
// ============================================================
// RENDER DATASET COPIES
// ============================================================

// ============================================================
// RENDER DATASET COPIES
// ============================================================

function renderDatasetCopies(copies) {

    const container =
        document.querySelector("#copy-list");

    if (!container) {
        console.error("Copy container #copy-list not found");
        return;
    }

    if (!copies || copies.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-copy"></i>

                <p>No dataset copies yet.</p>

            </div>
        `;

        return;
    }

    container.innerHTML = copies.map(copy => {

        const name =
            copy.updated_name ||
            copy.name ||
            copy.original_name ||
            "Unnamed Copy";

        const size =
            copy.file_size
                ? formatBytes(copy.file_size)
                : "";

        const created =
            copy.created_at || "";

        return `

            <div class="workspace-row">

                <div class="row-info">

                    <h4>

                        <i
                            class="fa-solid fa-copy"
                            style="color: var(--primary-color);"
                        ></i>

                        ${escapeHTML(name)}

                    </h4>

                    <p>
                        Dataset Copy
                        ${size ? ` • ${size}` : ""}
                    </p>

                    ${
                        created
                            ? `
                                <p>
                                    Created:
                                    ${formatDate(created)}
                                </p>
                              `
                            : ""
                    }

                </div>

                <div class="row-actions">

                    <!-- VIEW COPY -->

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="viewDatasetCopy(${copy.id})"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View
                    </button>


                    <!-- RENAME COPY -->

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="renameDatasetCopy(${copy.id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Rename
                    </button>


                    <!-- DELETE COPY -->

                    <button
                        type="button"
                        class="btn btn-danger"
                        onclick="deleteDatasetCopy(${copy.id})"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>


                </div>

            </div>

        `;

    }).join("");
}