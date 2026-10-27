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
