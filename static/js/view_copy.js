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

/* ============================================================
   GET COPY ID
============================================================ */

const params = new URLSearchParams(
    window.location.search
);

const copyId = params.get("copy_id");


/* ============================================================
   ELEMENTS
============================================================ */

const loading =
    document.getElementById("loading");

const content =
    document.getElementById("content");

const errorBox =
    document.getElementById("error-box");


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   FORMAT BYTES
============================================================ */

function formatBytes(bytes) {

    bytes = Number(bytes);

    if (!bytes || bytes <= 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index = Math.min(
        Math.floor(
            Math.log(bytes) / Math.log(1024)
        ),
        units.length - 1
    );

    return (
        (bytes / Math.pow(1024, index))
            .toFixed(index === 0 ? 0 : 2)
        + " "
        + units[index]
    );
}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* ============================================================
   SHOW ERROR
============================================================ */

function showError(message) {

    loading.style.display = "none";

    content.style.display = "none";

    errorBox.style.display = "block";

    errorBox.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        ${escapeHTML(message)}
    `;
}


/* ============================================================
   RENDER TABLE
============================================================ */

function renderPreview(rows) {

    const container =
        document.getElementById(
            "table-container"
        );

    if (!rows || !rows.length) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-table"></i>

                <p>No preview data available.</p>

            </div>
        `;

        return;
    }


    const columns =
        Object.keys(rows[0]);


    let html = `
        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>
    `;


    columns.forEach(column => {

        html += `
            <th>
                ${escapeHTML(column)}
            </th>
        `;

    });


    html += `
                    </tr>

                </thead>

                <tbody>
    `;


    rows.forEach(row => {

        html += "<tr>";


        columns.forEach(column => {

            const value =
                row[column] ?? "";


            html += `
                <td title="${escapeHTML(value)}">
                    ${escapeHTML(value)}
                </td>
            `;

        });


        html += "</tr>";

    });


    html += `
                </tbody>

            </table>

        </div>
    `;


    container.innerHTML = html;
}


/* ============================================================
   LOAD COPY
============================================================ */

async function loadCopy() {

    if (!copyId) {

        showError(
            "No dataset copy ID was provided."
        );

        return;
    }


    try {

        const response = await fetch(
            `/view_clicked_copy/${encodeURIComponent(copyId)}`,
            {
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to load dataset copy."
            );
        }


        /* ============================
           NAME
        ============================ */

        document.getElementById(
            "copy-name"
        ).textContent =
            data.name || "Dataset Copy";


        document.title =
            `${data.name || "Dataset Copy"} - Kijarney`;


        /* ============================
           STATUS
        ============================ */

        document.getElementById(
            "copy-status"
        ).innerHTML = `
            <i class="fa-solid fa-circle"></i>
            Active
        `;


        /* ============================
           ROWS
        ============================ */

        document.getElementById(
            "row-count"
        ).textContent =
            Number(data.rows || 0)
                .toLocaleString();


        /* ============================
           COLUMNS
        ============================ */

        document.getElementById(
            "column-count"
        ).textContent =
            Number(
                data.columns?.length || 0
            ).toLocaleString();


        /* ============================
           FILE SIZE
        ============================ */

        document.getElementById(
            "file-size"
        ).textContent =
            formatBytes(
                data.file_size
            );


        /* ============================
           CREATED
        ============================ */

        document.getElementById(
            "created-date"
        ).textContent =
            formatDate(
                data.created_at
            );


        /* ============================
           ORIGINAL DATASET
        ============================ */

        document.getElementById(
            "original-name"
        ).innerHTML = `
            <i class="fa-solid fa-database"></i>
            ${escapeHTML(
                data.original_dataset_name ||
                "Unknown Dataset"
            )}
        `;


        /* ============================
           FILE PATH
        ============================ */

        document.getElementById(
            "file-path"
        ).textContent =
            data.file_path ||
            "No file path available";


        /* ============================
           DOWNLOAD
        ============================ */

        if (data.download_url) {

            const downloadButton =
                document.getElementById(
                    "download-button"
                );

            downloadButton.href =
                data.download_url;

            downloadButton.style.display =
                "inline-flex";
        }


        /* ============================
           PREVIEW
        ============================ */

        const rows =
            data.data || [];


        document.getElementById(
            "preview-info"
        ).textContent =
            `Showing ${rows.length.toLocaleString()} rows.`;


        renderPreview(rows);


        /* ============================
           SHOW CONTENT
        ============================ */

        loading.style.display =
            "none";

        errorBox.style.display =
            "none";

        content.style.display =
            "grid";

    }

    catch (error) {

        console.error(
            "Error loading copy:",
            error
        );

        showError(
            error.message ||
            "Failed to load dataset copy."
        );
    }
}


/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    loadCopy
);
