
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


