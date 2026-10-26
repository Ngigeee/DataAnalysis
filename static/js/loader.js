/*progressbarforloadeddataset*/
function showLoader(message = "Loading...") {

    const uploadContainer = document.getElementById("uploadContainer");
    const progressCircle = document.querySelector(".progress");
    const progressText = document.getElementById("uploadPercent");

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;

    uploadContainer.style.display = "flex";
    progressText.innerHTML = message;
}

function updateLoader(percent, message = "") {

    const progressCircle = document.querySelector(".progress");
    const progressText = document.getElementById("uploadPercent");

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDashoffset =
        circumference - (percent / 100) * circumference;

    progressText.innerHTML = `${percent}%<br><small>${message}</small>`;
}

function hideLoader() {

    const uploadContainer = document.getElementById("uploadContainer");
    const progressCircle = document.querySelector(".progress");
    const progressText = document.getElementById("uploadPercent");

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    setTimeout(() => {

        uploadContainer.style.display = "none";
        progressCircle.style.strokeDashoffset = circumference;
        progressText.innerHTML = "0%";

    }, 800);

}