document.addEventListener("DOMContentLoaded", function () {

    const registerForm =
        document.getElementById("registerForm");

    if (!registerForm) {
        return;
    }

    const nameInput =
        document.getElementById("name");

    const emailInput =
        document.getElementById("email");

    const phoneInput =
        document.getElementById("phone");

    const passwordInput =
        document.getElementById("password");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const registerButton =
        document.getElementById("registerButton");

    const registerButtonText =
        document.getElementById("registerButtonText");

    const errorMessage =
        document.getElementById("errorMessage");

    const successMessage =
        document.getElementById("successMessage");

    const togglePassword =
        document.getElementById("togglePassword");

    const toggleConfirmPassword =
        document.getElementById("toggleConfirmPassword");


    // ============================================================
    // Password visibility
    // ============================================================

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            function () {

                if (passwordInput.type === "password") {

                    passwordInput.type = "text";
                    togglePassword.textContent = "🙈";

                } else {

                    passwordInput.type = "password";
                    togglePassword.textContent = "👁";

                }

            }
        );
    }


    if (toggleConfirmPassword) {

        toggleConfirmPassword.addEventListener(
            "click",
            function () {

                if (confirmPasswordInput.type === "password") {

                    confirmPasswordInput.type = "text";
                    toggleConfirmPassword.textContent = "🙈";

                } else {

                    confirmPasswordInput.type = "password";
                    toggleConfirmPassword.textContent = "👁";

                }

            }
        );
    }


    // ============================================================
    // Helper methods
    // ============================================================

    function showError(message) {

        errorMessage.textContent = message;
        errorMessage.style.display = "block";

        successMessage.textContent = "";
        successMessage.style.display = "none";
    }


    function showSuccess(message) {

        successMessage.textContent = message;
        successMessage.style.display = "block";

        errorMessage.textContent = "";
        errorMessage.style.display = "none";
    }


    function clearMessages() {

        errorMessage.textContent = "";
        errorMessage.style.display = "none";

        successMessage.textContent = "";
        successMessage.style.display = "none";
    }


    // ============================================================
    // Form submit
    // ============================================================

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessages();


            const name =
                nameInput.value.trim();

            const email =
                emailInput.value.trim();

            const phone =
                phoneInput.value.trim();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            // ====================================================
            // Client-side validation
            // ====================================================

            if (!name) {

                showError("Name is required.");
                nameInput.focus();
                return;
            }


            if (name.length < 2 || name.length > 100) {

                showError(
                    "Name must be between 2 and 100 characters."
                );

                nameInput.focus();
                return;
            }


            if (!email) {

                showError("Email is required.");
                emailInput.focus();
                return;
            }


            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                showError("Please enter a valid email address.");
                emailInput.focus();
                return;
            }


            if (!password) {

                showError("Password is required.");
                passwordInput.focus();
                return;
            }


            if (password.length < 8 || password.length > 100) {

                showError(
                    "Password must be between 8 and 100 characters."
                );

                passwordInput.focus();
                return;
            }


            if (password !== confirmPassword) {

                showError("Passwords do not match.");
                confirmPasswordInput.focus();
                return;
            }


            if (phone && !/^[0-9]{10}$/.test(phone)) {

                showError(
                    "Phone number must contain 10 digits."
                );

                phoneInput.focus();
                return;
            }


            // ====================================================
            // Disable button
            // ====================================================

            registerButton.disabled = true;

            if (registerButtonText) {
                registerButtonText.textContent =
                    "Creating Account...";
            }


            try {

                // =================================================
                // IMPORTANT:
                // Do NOT send roles from public registration.
                // Backend should assign USER role.
                // =================================================

                const user = {

                    name: name,

                    email: email,

                    password: password,

                    phone: phone

                };


                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(user)
                        }
                    );


                const data =
                    await response.json();


                // =================================================
                // Registration successful
                // =================================================

                if (response.status === 201) {

                    showSuccess(
                        "Account created successfully. Redirecting to login..."
                    );


                    registerForm.reset();


                    setTimeout(
                        function () {

                            window.location.href =
                                "/login";

                        },
                        1200
                    );

                    return;
                }


                // =================================================
                // Validation / API errors
                // =================================================

                if (response.status === 400) {

                    if (data.message) {

                        showError(data.message);

                    } else {

                        showError(
                            "Please check the entered information."
                        );
                    }

                    return;
                }


                // =================================================
                // Conflict - email already exists
                // =================================================

                if (response.status === 409) {

                    showError(
                        data.message ||
                        "An account with this email already exists."
                    );

                    return;
                }


                // =================================================
                // Other errors
                // =================================================

                showError(
                    data.message ||
                    "Unable to create account. Please try again."
                );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                showError(
                    "Unable to connect to the server. Please try again."
                );

            } finally {

                registerButton.disabled = false;

                if (registerButtonText) {

                    registerButtonText.textContent =
                        "Create Account";
                }
            }

        }
    );

});