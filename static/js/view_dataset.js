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


const params = new URLSearchParams(window.location.search);

const datasetId = params.get("dataset_id");


async function loadDataset() {

    if (!datasetId) {
        showError("No dataset ID supplied.");
        return;
    }

    try {

        /*
         * Reuse existing Flask endpoint:
         *
         * GET /datasets/<id>
         *
         * Example:
         * /datasets/21
         *
         * The ?mode=view parameter is intentionally ignored.
         */

        const response = await fetch(
            `/view_clicked_dataset/${encodeURIComponent(datasetId)}`,
            {
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Unable to load dataset"
            );
        }


        /*
         * Your backend returns:
         *
         * {
         *     success: true,
         *     name: "...",
         *     rows: 100,
         *     columns: [...],
         *     data: [...]
         * }
         */


        // ============================
        // DATASET NAME
        // ============================

        document.getElementById("dataset-name").textContent =
            result.name || "Dataset";


        // ============================
        // STATUS
        // ============================

        document.getElementById("dataset-status").textContent =
            "Active";


        // ============================
        // ROW COUNT
        // ============================

        document.getElementById("rows").textContent =
            Number(result.rows || 0).toLocaleString();


        // ============================
        // COLUMN COUNT
        // ============================

        document.getElementById("columns").textContent =
            Number(
                result.columns?.length || 0
            ).toLocaleString();


        // ============================
        // FILE TYPE
        // ============================

        const fileType =
            result.file_type ||
            "CSV";

        document.getElementById("file-type").textContent =
            fileType.toUpperCase();


        // ============================
        // FILE SIZE
        // ============================

        document.getElementById("file-size").textContent =
            result.file_size
                ? formatBytes(result.file_size)
                : "-";


        // ============================
        // RUN DATASET BUTTON
        // ============================

        document.getElementById("run-btn").href =
            `/try_dataset?dataset_id=${encodeURIComponent(datasetId)}`;


        // ============================
        // RENDER TABLE
        // ============================

        renderTable(
            result.columns || [],
            result.data || []
        );


    } catch (error) {

        console.error(
            "Dataset loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load dataset."
        );
    }
}


/* ==========================================
   RENDER DATASET TABLE
   ========================================== */

function renderTable(columns, rows) {

    const wrapper =
        document.getElementById("table-wrapper");


    if (!rows || !rows.length) {

        wrapper.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-table"></i>
                <p>No rows available.</p>
            </div>
        `;

        return;
    }


    const headerColumns =
        columns.length
            ? columns
            : Object.keys(rows[0]);


    let html = "<table>";

    // ============================
    // HEADER
    // ============================

    html += "<thead><tr>";

    headerColumns.forEach(column => {

        html += `
            <th>
                ${escapeHTML(column)}
            </th>
        `;

    });

    html += "</tr></thead>";


    // ============================
    // BODY
    // ============================

    html += "<tbody>";

    rows.forEach(row => {

        html += "<tr>";

        headerColumns.forEach(column => {

            let value = row[column];


            if (
                value === null ||
                value === undefined
            ) {
                value = "";
            }


            html += `
                <td>
                    ${escapeHTML(String(value))}
                </td>
            `;

        });

        html += "</tr>";

    });

    html += "</tbody>";

    html += "</table>";


    wrapper.innerHTML = html;
}


/* ==========================================
   ESCAPE HTML
   ========================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================
   FORMAT FILE SIZE
   ========================================== */

function formatBytes(bytes) {

    if (
        bytes === null ||
        bytes === undefined ||
        bytes === "" ||
        isNaN(bytes)
    ) {
        return "-";
    }

    bytes = Number(bytes);

    if (bytes === 0) {
        return "0 Bytes";
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

    return (
        parseFloat(
            (bytes / Math.pow(1024, index))
                .toFixed(2)
        ) +
        " " +
        units[index]
    );
}


/* ==========================================
   SHOW ERROR
   ========================================== */

function showError(message) {

    document.getElementById("table-wrapper").innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-circle-exclamation"></i>
            <p>${escapeHTML(message)}</p>
        </div>
    `;

    document.getElementById("dataset-name").textContent =
        "Unable to load dataset";

    document.getElementById("dataset-status").textContent =
        "Error";

    document.getElementById("rows").textContent =
        "-";

    document.getElementById("columns").textContent =
        "-";

    document.getElementById("file-type").textContent =
        "-";

    document.getElementById("file-size").textContent =
        "-";
}


/* ==========================================
   START
   ========================================== */

loadDataset();
