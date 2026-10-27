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