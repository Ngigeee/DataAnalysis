const inputs = document.querySelectorAll(".code-input");

inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        const value = e.target.value;
        if (value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

function verifyCode() {
    let code = "";
    inputs.forEach(input => code += input.value);

    const message = document.getElementById("message");

    if (code.length < 6) {
        message.style.color = "red";
        message.textContent = "Please enter all 6 digits.";
        return;
    }

    fetch("/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: code })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect;
        } else {
            message.style.color = "red";
            message.textContent = data.error;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        message.style.color = "red";
        message.textContent = "An unexpected error occurred.";
    });
}

function resendCode() {
    alert("Resend code functionality can be linked to a resend route.");
}
