document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    const loginButton = document.getElementById("loginButton");
    const loginButtonText = document.getElementById("loginButtonText");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");

    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");


    // =========================================================
    // PASSWORD SHOW / HIDE
    // =========================================================

    if (passwordToggle && passwordInput) {

        passwordToggle.addEventListener("click", function () {

            if (passwordInput.type === "password") {

                // Show password
                passwordInput.type = "text";

                passwordToggle.classList.remove("fa-eye");
                passwordToggle.classList.add("fa-eye-slash");

                passwordToggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

                passwordToggle.setAttribute(
                    "title",
                    "Hide password"
                );

            } else {

                // Hide password
                passwordInput.type = "password";

                passwordToggle.classList.remove("fa-eye-slash");
                passwordToggle.classList.add("fa-eye");

                passwordToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );

                passwordToggle.setAttribute(
                    "title",
                    "Show password"
                );
            }

        });
    }


    // =========================================================
    // LOGIN
    // =========================================================

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        errorMessage.textContent = "";
        successMessage.textContent = "";


        if (!email || !password) {

            errorMessage.textContent =
                "Please enter email and password.";

            return;
        }


        // Disable button
        loginButton.disabled = true;

        if (loginButtonText) {
            loginButtonText.textContent = "Logging in...";
        }


        try {

            const response = await fetch("/api/auth/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });


            const data = await response.json();


            if (response.ok) {

                // Store JWT
                localStorage.setItem(
                    "accessToken",
                    data.accessToken
                );

                localStorage.setItem(
                    "tokenType",
                    data.tokenType
                );

                localStorage.setItem(
                    "userEmail",
                    data.email
                );

                localStorage.setItem(
                    "expiresIn",
                    data.expiresIn
                );

                localStorage.setItem(
                    "tokenExpiresAt",
                    Date.now() + Number(data.expiresIn)
                );

                localStorage.setItem(
                    "refreshToken",
                    data.refreshToken
                );


                successMessage.textContent =
                    "Login successful. Redirecting...";


                // Navigate to Home
                setTimeout(function () {
                    window.location.href = "/home";
                }, 500);

                return;
            }


            // Invalid credentials
            if (response.status === 401) {

                errorMessage.textContent =
                    data.message || "Invalid email or password.";

            } else {

                errorMessage.textContent =
                    data.message || "Login failed. Please try again.";
            }


        } catch (error) {

            console.error("Login error:", error);

            errorMessage.textContent =
                "Unable to connect to the server. Please try again.";

        } finally {

            loginButton.disabled = false;

            if (loginButtonText) {
                loginButtonText.textContent = "Login";
            }
        }
    });
});