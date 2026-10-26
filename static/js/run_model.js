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
   GET MODEL ID FROM QUERY STRING
============================================================ */

const params = new URLSearchParams(
    window.location.search
);

const modelId = params.get("model_id");


/* ============================================================
   CHECK MODEL ID
============================================================ */

if (!modelId) {

    console.error(
        "No model_id provided in URL."
    );

}


/* ============================================================
   BACK LINK
============================================================ */

if (modelId) {

    document.getElementById(
        "back-link"
    ).href =
        `/view_model?model_id=${encodeURIComponent(modelId)}&mode=view`;

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   FORMAT MODEL TYPE
============================================================ */

function formatText(value) {

    if (!value) {

        return "";

    }

    return String(value)

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/* ============================================================
   SHOW LOAD ERROR
============================================================ */

function showLoadError(message) {

    const title =
        document.getElementById(
            "model-title-text"
        );

    const container =
        document.getElementById(
            "input-grid-container"
        );


    if (title) {

        title.textContent =
            "Unable to Load Model";

    }


    if (container) {

        container.innerHTML = `

            <div
                class="load-error"
                style="
                    grid-column:1 / -1;
                    color:#dc2626;
                    font-weight:600;
                    padding:15px 0;
                "
            >

                <i
                    class="fa-solid fa-circle-exclamation"
                ></i>

                ${escapeHTML(message)}

            </div>

        `;

    }

}


/* ============================================================
   LOAD MODEL CONFIGURATION
============================================================ */

async function fetchRunConfig() {

    if (!modelId) {

        showLoadError(
            "No model ID was provided in the URL."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/get_clicked_model/${encodeURIComponent(modelId)}/data`,
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        /* ----------------------------------------------------
           CHECK CONTENT TYPE
        ---------------------------------------------------- */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                `Server returned ${response.status} instead of JSON.`
            );

        }


        const data =
            await response.json();


        /* ----------------------------------------------------
           CHECK SERVER RESPONSE
        ---------------------------------------------------- */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                data.message ||
                "Failed to load model configuration."
            );

        }


        /* ----------------------------------------------------
           POPULATE PAGE
        ---------------------------------------------------- */

        populateModel(data);


    }

    catch (error) {

        console.error(
            "Model configuration error:",
            error
        );


        showLoadError(
            error.message ||
            "Unable to load model."
        );

    }

}


/* ============================================================
   POPULATE MODEL
============================================================ */

function populateModel(data) {

    const model =
        data.model || {};


    const features =
        Array.isArray(
            data.features
        )
            ? data.features
            : [];


    /* --------------------------------------------------------
       MODEL NAME
    -------------------------------------------------------- */

    const modelName =
        model.name ||
        "Unnamed Model";


    document.getElementById(
        "page-title"
    ).textContent =
        `Run ${modelName} - Kijarney`;


    document.getElementById(
        "model-title-text"
    ).textContent =
        `Run Model: ${modelName}`;


    /* --------------------------------------------------------
       TARGET
    -------------------------------------------------------- */

    const target =
        model.target ||
        "target";


    document.getElementById(
        "target-label"
    ).textContent =
        target;


    document.getElementById(
        "result-label"
    ).textContent =
        `Predicted ${target}`;


    /* --------------------------------------------------------
       MODEL TYPE
    -------------------------------------------------------- */

    const modelType =
        model.model_type || "";


    const modelTypeElement =
        document.getElementById(
            "model-type"
        );


    if (modelTypeElement) {

        modelTypeElement.textContent =
            formatText(modelType);

    }


    /* --------------------------------------------------------
       INPUT CONTAINER
    -------------------------------------------------------- */

    const container =
        document.getElementById(
            "input-grid-container"
        );


    /* --------------------------------------------------------
       NO FEATURES
    -------------------------------------------------------- */

    if (!features.length) {

        container.innerHTML = `

            <div
                style="
                    grid-column:1 / -1;
                    color:var(--muted);
                    padding:10px 0;
                "
            >

                <i
                    class="fa-solid fa-circle-info"
                ></i>

                No input features are defined
                for this model.

            </div>

        `;

        return;

    }


    /* --------------------------------------------------------
       CREATE INPUTS
    -------------------------------------------------------- */

    container.innerHTML =
        features.map(
            (feature, index) => `

                <div
                    class="input-group"
                >

                    <label
                        for="feature_${index + 1}"
                    >

                        ${escapeHTML(feature)}

                    </label>


                    <input
                        type="text"
                        id="feature_${index + 1}"
                        name="${escapeHTML(feature)}"
                        placeholder="Enter value for ${escapeHTML(feature)}"
                        required
                        autocomplete="off"
                    >

                </div>

            `
        ).join("");

}


/* ============================================================
   SHOW MODEL CODE
============================================================ */

async function showCode() {

    const codeCard =
        document.getElementById(
            "code-card"
        );


    const codeBox =
        document.getElementById(
            "model-code"
        );


    if (!codeCard || !codeBox) {

        console.error(
            "Code card elements were not found."
        );

        return;

    }


    /* --------------------------------------------------------
       SHOW CARD
    -------------------------------------------------------- */

    codeCard.style.display =
        "block";


    codeBox.textContent =
        "Loading model code...";


    codeCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    /* --------------------------------------------------------
       CHECK MODEL ID
    -------------------------------------------------------- */

    if (!modelId) {

        codeBox.textContent =
            "No model ID was provided.";

        return;

    }


    try {

        const response =
            await fetch(
                `/view_clicked_model/${encodeURIComponent(modelId)}/code`,
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        /* ----------------------------------------------------
           CHECK CONTENT TYPE
        ---------------------------------------------------- */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                `Server returned ${response.status} instead of JSON.`
            );

        }


        const data =
            await response.json();


        /* ----------------------------------------------------
           CHECK RESPONSE
        ---------------------------------------------------- */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                data.message ||
                "Unable to load model code."
            );

        }


        /* ----------------------------------------------------
           DISPLAY CODE
        ---------------------------------------------------- */

        codeBox.textContent =
            data.code ||
            "No code available.";

    }

    catch (error) {

        console.error(
            "Model code error:",
            error
        );


        codeBox.textContent =
            `Error loading model code:\n\n${error.message}`;

    }

}


/* ============================================================
   HIDE MODEL CODE
============================================================ */

function hideCode() {

    const codeCard =
        document.getElementById(
            "code-card"
        );


    if (codeCard) {

        codeCard.style.display =
            "none";

    }

}


/* ============================================================
   COPY MODEL CODE
============================================================ */

async function copyModelCode() {

    const codeElement =
        document.getElementById(
            "model-code"
        );


    if (!codeElement) {

        return;

    }


    const code =
        codeElement.textContent;


    if (!code) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            code
        );


        const button =
            document.querySelector(
                ".copy-code"
            );


        if (!button) {

            return;

        }


        const original =
            button.innerHTML;


        button.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Copied
        `;


        setTimeout(
            () => {

                button.innerHTML =
                    original;

            },
            1500
        );

    }

    catch (error) {

        console.error(
            "Copy failed:",
            error
        );

    }

}


/* ============================================================
   RUN MODEL / PREDICTION
============================================================ */

document
    .getElementById(
        "prediction-form"
    )
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            /* ------------------------------------------------
               CHECK MODEL ID
            ------------------------------------------------ */

            if (!modelId) {

                showPredictionError(
                    "No model ID was provided."
                );

                return;

            }


            /* ------------------------------------------------
               ELEMENTS
            ------------------------------------------------ */

            const button =
                document.getElementById(
                    "predict-button"
                );


            const resultBox =
                document.getElementById(
                    "result"
                );


            const predictionValue =
                document.getElementById(
                    "prediction-value"
                );


            /* ------------------------------------------------
               GET FORM VALUES
            ------------------------------------------------ */

            const formData =
                new FormData(this);


            const values = {};


            formData.forEach(
                (value, key) => {

                    values[key] =
                        value;

                }
            );


            /* ------------------------------------------------
               VALIDATE VALUES
            ------------------------------------------------ */

            for (
                const [key, value]
                of Object.entries(values)
            ) {

                if (
                    value === null ||
                    String(value).trim() === ""
                ) {

                    showPredictionError(
                        `Please enter a value for ${key}.`
                    );

                    return;

                }

            }


            /* ------------------------------------------------
               BUTTON LOADING
            ------------------------------------------------ */

            button.disabled =
                true;


            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Processing Prediction...
            `;


            resultBox.style.display =
                "none";


            try {

                /* ------------------------------------------------
                   IMPORTANT:
                   RUN ENDPOINT
                   
                   NOT /data
                ------------------------------------------------ */

                const response =
                    await fetch(
                        `/view_clicked_model/${encodeURIComponent(modelId)}/run`,
                        {
                            method: "POST",

                            credentials:
                                "same-origin",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    values
                                )

                        }
                    );


                /* ------------------------------------------------
                   CHECK CONTENT TYPE
                ------------------------------------------------ */

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                if (
                    !contentType.includes(
                        "application/json"
                    )
                ) {

                    throw new Error(
                        `Server returned ${response.status} instead of JSON.`
                    );

                }


                const data =
                    await response.json();


                /* ------------------------------------------------
                   CHECK RESPONSE
                ------------------------------------------------ */

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Prediction execution failed."
                    );

                }


                /* ------------------------------------------------
                   SHOW SUCCESS
                ------------------------------------------------ */

                predictionValue.className =
                    "prediction-value";


                predictionValue.textContent =
                    data.prediction;


                resultBox.style.display =
                    "block";


                resultBox.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


            }

            catch (error) {

                console.error(
                    "Prediction error:",
                    error
                );


                resultBox.style.display =
                    "block";


                predictionValue.className =
                    "prediction-value error";


                predictionValue.textContent =
                    error.message ||
                    "Prediction failed.";


                resultBox.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

            finally {

                button.disabled =
                    false;


                button.innerHTML = `
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    Run Prediction
                `;

            }

        }
    );


/* ============================================================
   PREDICTION ERROR HELPER
============================================================ */

function showPredictionError(message) {

    const resultBox =
        document.getElementById(
            "result"
        );


    const predictionValue =
        document.getElementById(
            "prediction-value"
        );


    if (!resultBox || !predictionValue) {

        alert(message);

        return;

    }


    predictionValue.className =
        "prediction-value error";


    predictionValue.textContent =
        message;


    resultBox.style.display =
        "block";


    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* ============================================================
   INITIALIZE
============================================================ */

window.addEventListener(
    "DOMContentLoaded",
    function() {

        fetchRunConfig();

    }
);
