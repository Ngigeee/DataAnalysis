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


// ============================================================
// PROFILE DATA
// ============================================================

let profileUser = null;
let profileAPI = null;
let profileDatasets = [];
let profileCopies = [];
let profileModels = [];
let profileActivity = [];
let profileStorage = null;


// ============================================================
// GENERIC FETCH HELPER
// ============================================================

async function fetchProfileEndpoint(endpoint) {
    try {
        const response = await fetch(endpoint, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch profile data");
        }

        return data;

    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}


// ============================================================
// GET USER DETAILS
// GET /profile_details/user
// ============================================================

async function fetchUserDetails() {

    try {

        const data = await fetchProfileEndpoint(
            "/profile_details/user"
        );

        profileUser = data.user;

        console.log("User details:", profileUser);

        updateUserDetails(profileUser);


        // =================================================
        // STORAGE
        // =================================================

        if (data.storage) {

            profileStorage =
                data.storage;

            updateStorageQuota(
                profileStorage
            );
        }


        return profileUser;

    } catch (error) {

        console.error(
            "Could not load user details:",
            error
        );

        return null;
    }
}

// ============================================================
// UPDATE STORAGE QUOTA
// ============================================================

function updateStorageQuota(storage) {

    if (!storage) return;

    const quotaBox =
        document.querySelector(".quota-box");

    if (!quotaBox) return;

    const usedBytes =
        Number(storage.used_bytes || 0);

    const limitBytes =
        Number(storage.limit_bytes || 0);

    const percentage =
        Number(storage.percentage || 0);

    // Convert bytes to MB
    const usedMB =
        usedBytes / (1024 * 1024);

    const limitMB =
        limitBytes / (1024 * 1024);

    // Update text
    const quotaHeader =
        quotaBox.querySelector(".quota-header");

    if (quotaHeader) {

        quotaHeader.innerHTML = `
            <span>Storage Used</span>

            <span>
                <strong>
                    ${usedMB.toFixed(1)} MB
                </strong>
                /
                ${limitMB.toFixed(0)} MB
            </span>
        `;
    }

    // Update progress bar
    const progressBar =
        quotaBox.querySelector(".progress-bar-fill");

    if (progressBar) {

        // Never allow visual bar to exceed 100%
        const width =
            Math.min(Math.max(percentage, 0), 100);

        progressBar.style.width =
            `${width}%`;
    }

    console.log("Storage:", {
        usedMB,
        limitMB,
        percentage
    });
}
// ============================================================
// UPDATE USER INFORMATION IN UI
// ============================================================

function updateUserDetails(user) {

    if (!user) return;


    // Username
    const usernameElements =
        document.querySelectorAll(".username");

    usernameElements.forEach(element => {
        element.textContent =
            user.username || "Data Scientist";
    });


    // Email
    const emailElements =
        document.querySelectorAll(".user-email");

    emailElements.forEach(element => {
        element.textContent =
            user.email || "user@kijarney.co.ke";
    });


    // Profile picture
    const avatarWrapper =
        document.querySelector(".avatar-wrapper");

    if (avatarWrapper && user.profile_pic) {

        avatarWrapper.innerHTML = `
            <img
                src="${escapeHTML(user.profile_pic)}"
                alt="Avatar"
                class="avatar"
            >
        `;

    } else if (avatarWrapper) {

        const firstLetter =
            (user.username || "U")
            .charAt(0)
            .toUpperCase();

        avatarWrapper.innerHTML = `
            <div class="avatar">
                ${escapeHTML(firstLetter)}
            </div>
        `;
    }


    // Account tier
    updateAccountTier(user);
}


// ============================================================
// UPDATE PREMIUM / FREE BADGE
// ============================================================

function updateAccountTier(user) {

    const sidebar =
        document.querySelector(".sidebar-profile");

    if (!sidebar) return;

    const oldBadge =
        sidebar.querySelector(".tier-badge");

    if (!oldBadge) return;


    const isPremium =
        user.is_premium === true ||
        user.is_premium === 1 ||
        user.is_premium === "1" ||
        user.is_premium === "true";


    if (isPremium) {

        oldBadge.innerHTML = `
            <i
                class="fa-solid fa-crown"
                style="color: #f59e0b;"
            ></i>
            Premium Account
        `;

    } else {

        oldBadge.innerHTML = `
            <i class="fa-solid fa-bolt"></i>
            Free Account
        `;
    }
}


// ============================================================
// GET API KEY
// GET /profile_details/api
// ============================================================

async function fetchAPIKey() {

    try {

        const data = await fetchProfileEndpoint(
            "/profile_details/api"
        );

        profileAPI = data.api_key;

        console.log("API details:", profileAPI);

        updateAPIKey(profileAPI);

        return profileAPI;

    } catch (error) {

        console.error("Could not load API key:", error);

        return null;
    }
}


// ============================================================
// UPDATE API KEY UI
// ============================================================

function updateAPIKey(api) {

    const keyElement =
        document.querySelector(".api-key-mask");

    if (!keyElement) return;


    if (!api) {

        keyElement.textContent =
            "No API key generated";

        return;
    }


    keyElement.textContent =
        api.masked_key || "••••••••";
}


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

// ============================================================
// RENDER DATASETS
// ============================================================

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
// ============================================================
// GET MODELS
// ============================================================

async function fetchUserModels() {

    try {

        const data =
            await fetchProfileEndpoint(
                "/profile_details/models"
            );

        profileModels =
            data.models || [];

        console.log(
            "Models:",
            profileModels
        );

        renderModels(
            profileModels
        );

        return profileModels;

    } catch (error) {

        console.error(
            "Could not load models:",
            error
        );

        return [];

    }
}
// ============================================================
// RENDER MODELS
// ============================================================

// ============================================================
// RENDER MODELS
// ============================================================

function renderModels(models) {

    const container = document.querySelector("#models .workspace-list");

    if (!container) return;

    if (!models || models.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-brain"></i>
                <p>No trained models yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = models.map(model => {

        const name =
            model.name ||
            model.model_name ||
            `${model.model_type || "Machine Learning"} Model`;

        const type =
            model.model_type ||
            "Machine Learning Model";

        const target =
            model.target ||
            "Unknown target";

        let features = model.features || [];

        if (typeof features === "string") {
            try {
                features = JSON.parse(features);
            } catch {
                features = [features];
            }
        }

        const featureText =
            Array.isArray(features)
                ? features.join(", ")
                : String(features);

        const created =
            model.created_at || "";

        return `
            <div class="workspace-row">

                <div class="row-info">

                    <h4>
                        ${escapeHTML(name)}
                    </h4>

                    <p>
                        ${escapeHTML(type)}
                        • Target: ${escapeHTML(target)}
                        • Features: ${escapeHTML(featureText)}
                        ${created ? " • " + formatDate(created) : ""}
                    </p>

                </div>

                <div class="row-actions">

                    <!-- VIEW MODEL DETAILS -->
                    <button
                        class="btn btn-outline"
                        onclick="viewModel(${model.id})"
                    >
                        <i class="fa-solid fa-eye"></i>
                        View
                    </button>

                    <!-- RUN MODEL -->
                    <button
                        class="btn btn-primary"
                        onclick="runModel(${model.id})"
                    >
                        <i class="fa-solid fa-play"></i>
                        Run
                    </button>

                    <!-- RENAME -->
                    <button
                        class="btn btn-outline"
                        onclick="renameModel(${model.id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Rename
                    </button>

                    <!-- DELETE -->
                    <button
                        class="btn btn-danger"
                        onclick="deleteModel(${model.id})"
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
// GET ACTIVITY
// GET /profile_details/activity
// ============================================================

async function fetchUserActivity() {

    try {

        const data = await fetchProfileEndpoint(
            "/profile_details/activity"
        );

        profileActivity =
            data.activity || [];

        console.log("Activity:", profileActivity);

        renderActivity(profileActivity);

        return profileActivity;

    } catch (error) {

        console.error("Could not load activity:", error);

        return [];
    }
}


// ============================================================
// RENDER ACTIVITY
// ============================================================

function renderActivity(activities) {

    const container =
        document.querySelector(
            ".activity-timeline"
        );

    if (!container) return;


    if (!activities || activities.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock"></i>
                <p>No recent activity.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        activities.map(activity => {

            const title =
                activity.title ||
                activity.activity ||
                activity.description ||
                "Activity";

            const time =
                activity.created_at ||
                activity.time ||
                "";


            return `
                <div class="activity-item">

                    <div class="activity-title">
                        ${escapeHTML(title)}
                    </div>

                    <div class="activity-time">
                        ${formatDate(time)}
                    </div>

                </div>
            `;

        }).join("");
}


// ============================================================
// FETCH EVERYTHING
// ============================================================

async function fetchAllProfileDetails() {

    console.log("Loading Kijarney profile...");

    await Promise.all([

        fetchUserDetails(),

        fetchAPIKey(),

        fetchUserDatasets(),

        fetchDatasetCopies(),

        fetchUserModels(),

        fetchUserActivity()

    ]);

    console.log(
        "Profile loading complete."
    );
}


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
// ============================================================
// COPY API KEY
// ============================================================

async function copyAPIKey() {

    try {

        /*
         * Since the backend intentionally sends
         * only the masked key, this copies the
         * masked value.
         *
         * If you later implement a secure endpoint
         * for revealing the actual key, change this.
         */

        if (!profileAPI) {

            alert("No API key available.");

            return;
        }


        const key =
            profileAPI.masked_key ||
            "";


        await navigator.clipboard.writeText(key);

        showNotification(
            "API key copied to clipboard."
        );

    } catch (error) {

        console.error(
            "Failed to copy API key:",
            error
        );

        showNotification(
            "Could not copy API key."
        );
    }
}


// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(message) {

    const notification =
        document.createElement("div");

    notification.className =
        "profile-notification";

    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(() => {

        notification.classList.add(
            "show"
        );

    }, 10);


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

        setTimeout(() => {

            notification.remove();

        }, 300);

    }, 2500);
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return dateValue;
    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}
// ============================================================
// FORMAT FILE SIZE
// ============================================================

function formatBytes(bytes) {

    bytes = Number(bytes);

    if (!bytes || bytes <= 0) {
        return "";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const safeIndex =
        Math.min(
            index,
            units.length - 1
        );


    return (
        bytes /
        Math.pow(1024, safeIndex)
    ).toFixed(
        safeIndex === 0 ? 0 : 1
    ) + " " +
    units[safeIndex];
}

// ============================================================
// BASIC HTML ESCAPING
// ============================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// INITIALIZE PROFILE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        fetchAllProfileDetails();

    }
);


