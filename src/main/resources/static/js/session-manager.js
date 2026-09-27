(function () {

    const WARNING_TIME = 60 * 1000; // 1 minute

    let warningTimer = null;
    let countdownTimer = null;


    function getTokenExpiry() {

        const expiresAt =
            localStorage.getItem("tokenExpiresAt");

        if (!expiresAt) {
            return null;
        }

        const value = Number(expiresAt);

        if (Number.isNaN(value)) {
            return null;
        }

        return value;
    }


    function getRemainingTime() {

        const expiresAt = getTokenExpiry();

        if (!expiresAt) {
            return null;
        }

        return expiresAt - Date.now();
    }


    function startSessionTimer() {

        clearTimers();

        const remainingTime =
            getRemainingTime();

        if (
            remainingTime === null ||
            remainingTime <= 0
        ) {
            return;
        }


        const warningDelay =
            Math.max(
                remainingTime - WARNING_TIME,
                0
            );


        warningTimer = setTimeout(
            showSessionWarning,
            warningDelay
        );
    }


    function showSessionWarning() {

        createPopup();

        startCountdown();
    }


    function createPopup() {

        if (
            document.getElementById(
                "sessionExpiryPopup"
            )
        ) {
            return;
        }


        const popup =
            document.createElement("div");

        popup.id =
            "sessionExpiryPopup";

        popup.className =
            "session-expiry-popup";


        popup.innerHTML = `

            <div class="session-popup-header">

                <div class="session-popup-icon">
                    <i class="fa-solid fa-clock"></i>
                </div>

                <div>
                    <div class="session-popup-title">
                        Session Expiring
                    </div>

                    <div
                        id="sessionCountdown"
                        class="session-popup-countdown">
                        Your session expires in 60 seconds.
                    </div>
                </div>

            </div>


            <div class="session-popup-message">

                Extend your session to continue using
                Carpool without interruption.

            </div>


            <div class="session-popup-actions">

                <button
                    type="button"
                    id="logoutSessionButton"
                    class="session-logout-button">

                    Logout

                </button>


                <button
                    type="button"
                    id="extendSessionButton"
                    class="session-extend-button">

                    Extend Session

                </button>

            </div>

        `;


        document.body.appendChild(popup);


        document
            .getElementById("extendSessionButton")
            .addEventListener(
                "click",
                extendSession
            );


        document
            .getElementById("logoutSessionButton")
            .addEventListener(
                "click",
                logout
            );
    }


    function startCountdown() {

        updateCountdown();


        countdownTimer =
            setInterval(
                updateCountdown,
                1000
            );
    }


    function updateCountdown() {

        const remaining =
            getRemainingTime();


        if (
            remaining === null ||
            remaining <= 0
        ) {

            clearInterval(countdownTimer);

            logout();

            return;
        }


        const seconds =
            Math.ceil(
                remaining / 1000
            );


        const countdownElement =
            document.getElementById(
                "sessionCountdown"
            );


        if (!countdownElement) {
            return;
        }


        countdownElement.textContent =
            `Your session expires in ${seconds} seconds.`;
    }


    async function extendSession() {

        const button =
            document.getElementById(
                "extendSessionButton"
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "Extending...";
        }


        const refreshToken =
            localStorage.getItem(
                "refreshToken"
            );


        if (!refreshToken) {

            logout();

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/auth/refresh",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            refreshToken:
                                refreshToken
                        })
                    }
                );


            if (!response.ok) {

                logout();

                return;
            }


            const data =
                await response.json();


            localStorage.setItem(
                "accessToken",
                data.accessToken
            );


            localStorage.setItem(
                "tokenType",
                data.tokenType
            );


            localStorage.setItem(
                "expiresIn",
                data.expiresIn
            );


            localStorage.setItem(
                "tokenExpiresAt",
                Date.now() +
                    Number(data.expiresIn)
            );


            closePopup();


            clearTimers();


            startSessionTimer();


        } catch (error) {

            console.error(
                "Session refresh failed:",
                error
            );

            logout();
        }
    }


    function closePopup() {

        const popup =
            document.getElementById(
                "sessionExpiryPopup"
            );


        if (popup) {
            popup.remove();
        }


        if (countdownTimer) {

            clearInterval(
                countdownTimer
            );

            countdownTimer = null;
        }
    }


    function clearTimers() {

        if (warningTimer) {

            clearTimeout(
                warningTimer
            );

            warningTimer = null;
        }


        if (countdownTimer) {

            clearInterval(
                countdownTimer
            );

            countdownTimer = null;
        }
    }


    function logout() {

        clearTimers();

        localStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "refreshToken"
        );

        localStorage.removeItem(
            "tokenType"
        );

        localStorage.removeItem(
            "userEmail"
        );

        localStorage.removeItem(
            "expiresIn"
        );

        localStorage.removeItem(
            "tokenExpiresAt"
        );


        window.location.href =
            "/login";
    }


    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const token =
                localStorage.getItem(
                    "accessToken"
                );


            if (!token) {
                return;
            }


            startSessionTimer();
        }
    );


})();