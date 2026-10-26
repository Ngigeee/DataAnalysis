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
// GET MODEL ID FROM QUERY STRING
// URL:
// /view_model?model_id=7&mode=view
// ============================================================

const params = new URLSearchParams(
    window.location.search
);

const modelId = params.get("model_id");


// Helper formatting functions
function formatText(str) {

    if (!str) return '';

    return String(str)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}


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


// ============================================================
// FETCH MODEL DATA
// ============================================================

async function fetchModelDetails() {

    if (!modelId) {

        document.getElementById(
            "model-name-heading"
        ).textContent =
            "Invalid Model";

        document.getElementById(
            "model-type-sub"
        ).textContent =
            "No model ID was provided.";

        return;
    }


    try {

        console.log(
            "Loading model ID:",
            modelId
        );


        const response = await fetch(
            `/view_clicked_model_page/${encodeURIComponent(modelId)}/data`,
            {
                credentials: "same-origin",

                headers: {
                    "Accept": "application/json"
                }
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Failed to load model details."
            );
        }


        populatePage(data);


    } catch (error) {

        console.error(
            "Error loading model:",
            error
        );


        document.getElementById(
            "model-name-heading"
        ).textContent =
            "Error Loading Model";


        document.getElementById(
            "model-type-sub"
        ).textContent =
            error.message;
    }
}




function populatePage(data) {
    const model = data.model;
    const features = data.features || [];
    const metrics = data.metrics || {};

    // Update document title and headers
    document.getElementById("page-title").textContent = `${model.name} - Kijarney`;
    document.getElementById("model-name-heading").textContent = model.name;
    
    const formattedType = formatText(model.model_type);
    document.getElementById("model-type-sub").textContent = formattedType;

    // Update Details Grid
    document.getElementById("detail-model-type").textContent = formattedType;
    document.getElementById("detail-target").textContent = model.target;
    document.getElementById("detail-model-id").textContent = `#${model.id}`;
    document.getElementById("detail-created-at").textContent = model.created_at;

    // Update Predict Panel Target Label
    document.getElementById("predict-target-label").textContent = model.target;
    document.getElementById("result-label").textContent = `Predicted ${model.target}`;

    // Populate Features Badges
    const featuresContainer = document.getElementById("features-container");
    featuresContainer.innerHTML = features.map(feature => `
        <span class="feature">${escapeHTML(feature)}</span>
    `).join('');

    // Populate Prediction Form Inputs
    const inputGridContainer = document.getElementById("input-grid-container");
    inputGridContainer.innerHTML = features.map((feature, index) => `
        <div class="input-group">
            <label for="feature_${index + 1}">${escapeHTML(feature)}</label>
            <input
                type="text"
                id="feature_${index + 1}"
                name="${escapeHTML(feature)}"
                placeholder="Enter ${escapeHTML(feature)}"
                required
            >
        </div>
    `).join('');

    // Populate Metrics if available
    const metricsCard = document.getElementById("metrics-card");
    const metricsContainer = document.getElementById("metrics-container");
    const metricKeys = Object.keys(metrics);

    if (metricKeys.length > 0) {
        metricsContainer.innerHTML = metricKeys.map(key => `
            <div class="metric">
                <div class="metric-name">${escapeHTML(formatText(key))}</div>
                <div class="metric-value">${escapeHTML(metrics[key])}</div>
            </div>
        `).join('');
        metricsCard.style.display = "block";
    }
}


function showRunPanel() {
    const panel = document.getElementById("run-panel");
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth" });
}


function hideRunPanel() {
    document.getElementById("run-panel").style.display = "none";
}


document.getElementById("prediction-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const button = document.getElementById("predict-button");
    const resultBox = document.getElementById("result");
    const predictionValue = document.getElementById("prediction-value");

    const formData = new FormData(this);
    const values = {};

    formData.forEach((value, key) => {
        values[key] = value;
    });

    button.disabled = true;
    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Predicting...
    `;

    resultBox.style.display = "none";

    try {
        const response = await fetch(
            `/profile_details/try_model/${modelId}/run`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(values)
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Prediction failed.");
        }

        predictionValue.textContent = data.prediction;
        resultBox.style.display = "block";
        resultBox.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        resultBox.style.display = "block";
        predictionValue.innerHTML = `
            <span class="error">
                ${escapeHTML(error.message)}
            </span>
        `;
    } finally {
        button.disabled = false;
        button.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Predict
        `;
    }
});


// Initialize page fetch on load
window.addEventListener("DOMContentLoaded", fetchModelDetails);
