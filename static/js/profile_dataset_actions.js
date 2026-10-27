// ============================================================
// DATASET ACTIONS
// ============================================================

function viewModel(modelId) {

    window.location.href =
        `/view_model?model_id=${encodeURIComponent(modelId)}&mode=view`;

}


function runModel(modelId) {

    window.location.href =
        `/run_model_page?model_id=${encodeURIComponent(modelId)}`;

}


function runDataset(datasetId) {

    window.location.href =
        `/try_dataset?dataset_id=${encodeURIComponent(datasetId)}`;

}




function viewDataset(datasetId) {

    window.location.href =
        `/view_dataset?dataset_id=${encodeURIComponent(datasetId)}&mode=view`;

}


function viewDatasetCopy(copyId) {

    window.location.href =
        `/view_copy?copy_id=${encodeURIComponent(copyId)}&mode=view`;

}

let renameItemId = null;
let renameItemType = null;

function renameDataset(datasetId) {

    renameItemId = datasetId;
    renameItemType = "dataset";

    openRenameModal();

}
function renameDatasetCopy(copyId) {

    renameItemId = copyId;
    renameItemType = "copy";

    openRenameModal();

}
function renameModel(modelId) {

    renameItemId = modelId;
    renameItemType = "model";

    openRenameModal();

}
//modal
function openRenameModal() {

    const modal =
        document.querySelector("#rename-modal");

    const input =
        document.querySelector("#rename-input");

    if (!modal || !input) return;

    input.value = "";

    modal.style.display = "flex";

    setTimeout(() => {
        input.focus();
    }, 100);

}
//close modal
function closeRenameModal() {

    const modal =
        document.querySelector("#rename-modal");

    if (modal) {
        modal.style.display = "none";
    }

    renameItemId = null;
    renameItemType = null;
}
//confirm rename
async function confirmRename() {

    const input = document.querySelector("#rename-input");

    if (!input) return;

    const newName = input.value.trim();

    if (!newName) {

        showNotification("Please enter a name.");

        return;
    }

    if (!renameItemId || !renameItemType) {

        showNotification("Nothing selected to rename.");

        return;
    }


    // Save these BEFORE closing the modal
    const itemId = renameItemId;
    const itemType = renameItemType;


    let endpoint;


    // =====================================================
    // DATASET
    // =====================================================

    if (itemType === "dataset") {

        endpoint =
            `/profile_details/datasets/${encodeURIComponent(itemId)}/rename`;

    }


    // =====================================================
    // COPY
    // =====================================================

    else if (itemType === "copy") {

        endpoint =
            `/profile_details/copies/${encodeURIComponent(itemId)}/rename`;

    }


    // =====================================================
    // MODEL
    // =====================================================

    else if (itemType === "model") {

        endpoint =
            `/profile_details/models/${encodeURIComponent(itemId)}/rename`;

    }


    else {

        showNotification("Invalid item type.");

        return;
    }


    console.log("Rename request:", {
        endpoint,
        itemId,
        itemType,
        name: newName
    });


    try {

        const response = await fetch(endpoint, {

            method: "POST",

            credentials: "same-origin",

            headers: {

                "Content-Type": "application/json",

                "Accept": "application/json"

            },

            body: JSON.stringify({

                name: newName

            })

        });


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                data.error ||
                "Rename failed"
            );

        }


        // Close modal AFTER saving itemType
        closeRenameModal();


        showNotification(
            data.message ||
            "Renamed successfully."
        );


        // =================================================
        // REFRESH DATA
        // =================================================

        if (itemType === "dataset") {

            await fetchUserDatasets();

        }

        else if (itemType === "copy") {

            await fetchDatasetCopies();

        }

        else if (itemType === "model") {

            await fetchUserModels();

        }


    }

    catch (error) {

        console.error(
            "Rename error:",
            error
        );

        showNotification(
            error.message ||
            "Could not rename item."
        );

    }

}

//delete
let deleteItemId = null;
let deleteItemType = null;

function deleteDataset(datasetId) {

    deleteItemId = datasetId;
    deleteItemType = "dataset";

    openDeleteModal();

}

function deleteDatasetCopy(copyId) {

    deleteItemId = copyId;
    deleteItemType = "copy";

    openDeleteModal();

}

function deleteModel(modelId) {

    deleteItemId = modelId;
    deleteItemType = "model";

    openDeleteModal();

}

//delete modal
function openDeleteModal() {

    const modal =
        document.querySelector("#delete-modal");

    if (!modal) return;

    modal.style.display = "flex";

}
//close
function closeDeleteModal() {

    const modal =
        document.querySelector("#delete-modal");

    if (modal) {
        modal.style.display = "none";
    }

    deleteItemId = null;
    deleteItemType = null;

}
//confirm delete
async function confirmDelete() {

    if (!deleteItemId || !deleteItemType) {

        showNotification(
            "Nothing selected to delete."
        );

        return;
    }


    // Save these before closing the modal
    const itemId = deleteItemId;
    const itemType = deleteItemType;


    let endpoint;


    // =====================================================
    // DATASET
    // =====================================================

    if (itemType === "dataset") {

        endpoint =
            `/profile_details/datasets/${encodeURIComponent(itemId)}/delete`;

    }


    // =====================================================
    // COPY
    // =====================================================

    else if (itemType === "copy") {

        endpoint =
            `/profile_details/copies/${encodeURIComponent(itemId)}/delete`;

    }


    // =====================================================
    // MODEL
    // =====================================================

    else if (itemType === "model") {

        endpoint =
            `/profile_details/models/${encodeURIComponent(itemId)}/delete`;

    }


    else {

        showNotification(
            "Invalid item type."
        );

        return;
    }


    console.log("Delete request:", {
        endpoint: endpoint,
        id: itemId,
        type: itemType
    });


    try {

        const response =
            await fetch(endpoint, {

                method: "POST",

                credentials: "same-origin",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"

                },

                body: JSON.stringify({

                    id: itemId

                })

            });


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                data.error ||
                "Delete failed"
            );

        }


        // Close after saving itemType
        closeDeleteModal();


        showNotification(
            data.message ||
            "Deleted successfully."
        );


        // =================================================
        // REFRESH CORRECT SECTION
        // =================================================

        if (itemType === "dataset") {

            await fetchUserDatasets();

        }

        else if (itemType === "copy") {

            await fetchDatasetCopies();

        }

        else if (itemType === "model") {

            await fetchUserModels();

        }

    }

    catch (error) {

        console.error(
            "Delete error:",
            error
        );

        showNotification(
            error.message ||
            "Could not delete item."
        );

    }

}