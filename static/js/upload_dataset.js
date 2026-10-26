/* ═══════════════════════════════════════════════
   CSV / JSON UPLOAD
═══════════════════════════════════════════════ */
document.querySelectorAll(".fileInput").forEach(input => {
    input.addEventListener("change", async function () {

        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const uploadContainer = document.getElementById("uploadContainer");
        const progressCircle = document.querySelector(".progress");
        const progressText = document.getElementById("uploadPercent");

        const radius = 52;
        const circumference = 2 * Math.PI * radius;

        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;

        uploadContainer.style.display = "flex";
        progressText.textContent = "0%";

        try {

            await new Promise((resolve, reject) => {

                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/upload", true);

                let startTime = Date.now();

                xhr.upload.addEventListener("loadstart", () => {
                    progressText.textContent = "0%";
                });

                xhr.upload.addEventListener("progress", (e) => {

                    console.log("Progress:", e.loaded, "/", e.total);

                    if (!e.lengthComputable) return;

                    const percent = Math.round((e.loaded / e.total) * 100);

                    const offset = circumference - (percent / 100) * circumference;

                    progressCircle.style.strokeDashoffset = offset;

                    const elapsed = (Date.now() - startTime) / 1000;
                    const speed = elapsed > 0 ? e.loaded / elapsed : 0;

                    progressText.innerHTML =
                        `${percent}%<br><small>${(speed / 1024 / 1024).toFixed(2)} MB/s</small>`;

                });

                xhr.onload = function () {

                    let result;

                    try {
                        result = JSON.parse(xhr.responseText);
                    } catch {
                        reject(new Error("Invalid server response"));
                        return;
                    }

                    if (xhr.status >= 200 && xhr.status < 300) {

                        progressCircle.style.strokeDashoffset = 0;
                        progressText.innerHTML = "Processing...";

                        resolve(result);

                    } else {
                        reject(new Error(result.error || "Upload failed"));
                    }
                };

                xhr.onerror = () => reject(new Error("Network error"));

                xhr.send(formData);

            });

            progressText.innerHTML = "Loading dataset...";

            const dataRes = await fetch("/dataset");
            const dataset = await dataRes.json();

            DATA = dataset;
            ORIGINAL = JSON.parse(JSON.stringify(DATA));

            renderTable(DATA, file.name);

            toast(`Loaded "${file.name}" — ${DATA.length} rows`, "success");

            addLog(
                `Uploaded "${file.name}" (${DATA.length} rows × ${Object.keys(DATA[0] || {}).length} cols)`
            );

            progressText.innerHTML = "Completed ✓";

        } catch (err) {

            progressText.innerHTML = "Failed ✕";
            toast(err.message, "error");

        } finally {

            setTimeout(() => {

                uploadContainer.style.display = "none";

                progressCircle.style.strokeDashoffset = circumference;
                progressText.innerHTML = "0%";

            }, 1000);

            // Clear values on all file inputs so they can re-upload the same file if needed
            document.querySelectorAll(".file-input").forEach(el => el.value = "");

        }

    });
});