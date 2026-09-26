document.addEventListener("DOMContentLoaded", function () {

    const ridesList = document.getElementById("ridesList");

    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");

    const errorMessage = document.getElementById("errorMessage");

    const rideCount = document.getElementById("rideCount");

    const sourceInput = document.getElementById("source");
    const destinationInput = document.getElementById("destination");

    const searchButton = document.getElementById("searchButton");
    const clearSearchButton = document.getElementById("clearSearchButton");

    const allRidesTab = document.getElementById("allRidesTab");
    const myRidesTab = document.getElementById("myRidesTab");

    const retryButton = document.getElementById("retryButton");

    const offerRideButton = document.getElementById("offerRideButton");
    const emptyOfferButton = document.getElementById("emptyOfferButton");


    let currentMode = "all";


    // =========================
    // INITIAL LOAD
    // =========================

    loadAllRides();


    // =========================
    // ALL RIDES
    // =========================

    allRidesTab.addEventListener("click", function () {

        currentMode = "all";

        setActiveTab(allRidesTab, myRidesTab);

        loadAllRides();
    });


    // =========================
    // MY RIDES
    // =========================

    myRidesTab.addEventListener("click", function () {

        currentMode = "my";

        setActiveTab(myRidesTab, allRidesTab);

        loadMyRides();
    });


    // =========================
    // SEARCH
    // =========================

    searchButton.addEventListener("click", function () {

        const source = sourceInput.value.trim();
        const destination = destinationInput.value.trim();

        if (!source || !destination) {

            showError(
                "Please enter both source and destination."
            );

            return;
        }

        searchRides(source, destination);
    });


    // =========================
    // CLEAR SEARCH
    // =========================

    clearSearchButton.addEventListener("click", function () {

        sourceInput.value = "";
        destinationInput.value = "";

        hideError();

        if (currentMode === "my") {

            loadMyRides();

        } else {

            loadAllRides();
        }
    });


    // =========================
    // ENTER KEY SEARCH
    // =========================

    sourceInput.addEventListener("keydown", handleEnter);

    destinationInput.addEventListener("keydown", handleEnter);


    function handleEnter(event) {

        if (event.key === "Enter") {

            searchButton.click();
        }
    }


    // =========================
    // RETRY
    // =========================

    retryButton.addEventListener("click", function () {

        if (currentMode === "my") {

            loadMyRides();

        } else {

            loadAllRides();
        }
    });


    // =========================
    // OFFER RIDE
    // =========================

    offerRideButton.addEventListener("click", function () {

        window.location.href = "/rides/create";
    });


    emptyOfferButton.addEventListener("click", function () {

        window.location.href = "/rides/create";
    });


    // =========================
    // LOAD ALL RIDES
    // =========================

    async function loadAllRides() {

        showLoading();

        try {

            const response = await API.get("/api/rides");

            if (!response) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Unable to load rides."
                );
            }

            const rides = await response.json();

            renderRides(rides);

        } catch (error) {

            console.error(
                "Error loading rides:",
                error
            );

            showError(
                "Unable to load rides. Please try again."
            );
        }
    }


    // =========================
    // LOAD MY RIDES
    // =========================

    async function loadMyRides() {

        showLoading();

        try {

            const response = await API.get(
                "/api/rides/my"
            );

            if (!response) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Unable to load your rides."
                );
            }

            const rides = await response.json();

            renderRides(rides);

        } catch (error) {

            console.error(
                "Error loading my rides:",
                error
            );

            showError(
                "Unable to load your rides."
            );
        }
    }


    // =========================
    // SEARCH RIDES
    // =========================

    async function searchRides(source, destination) {

        showLoading();

        try {

            const url =
                "/api/rides/search"
                + "?source="
                + encodeURIComponent(source)
                + "&destination="
                + encodeURIComponent(destination);

            const response = await API.get(url);

            if (!response) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Unable to search rides."
                );
            }

            const rides = await response.json();

            renderRides(rides);

        } catch (error) {

            console.error(
                "Error searching rides:",
                error
            );

            showError(
                "Unable to search rides. Please try again."
            );
        }
    }


    // =========================
    // RENDER RIDES
    // =========================

    function renderRides(rides) {

        hideAllStates();

        ridesList.innerHTML = "";

        rideCount.textContent =
            rides.length
            + (rides.length === 1 ? " ride" : " rides");


        if (!rides || rides.length === 0) {

            showEmpty();

            return;
        }


        rides.forEach(function (ride) {

            const card = createRideCard(ride);

            ridesList.appendChild(card);
        });


        ridesList.classList.remove("hidden");
    }


    // =========================
    // CREATE RIDE CARD
    // =========================

    function createRideCard(ride) {

        const card = document.createElement("div");

        card.className = "ride-card";


        // =========================
        // STATUS
        // =========================

        const status =
            ride.status || "SCHEDULED";

        const statusClass =
            "status-"
            + status.toLowerCase();


        // =========================
        // DATE / TIME
        // =========================

        const departure =
            formatDateTime(ride.departureTime);


        // =========================
        // CARD
        // =========================

        card.innerHTML = `

            <div class="ride-card-top">

                <div class="route">

                    <span class="location">
                        ${escapeHtml(ride.source)}
                    </span>

                    <span class="route-line">
                        →
                    </span>

                    <span class="location">
                        ${escapeHtml(ride.destination)}
                    </span>

                </div>

                <span class="status ${statusClass}">
                    ${escapeHtml(status)}
                </span>

            </div>


            <div class="ride-info">

                <div class="info-item">

                    <span class="info-label">
                        Departure
                    </span>

                    <span class="info-value">
                        ${departure}
                    </span>

                </div>


                <div class="info-item">

                    <span class="info-label">
                        Available Seats
                    </span>

                    <span class="info-value">
                        ${ride.availableSeats}
                    </span>

                </div>


                <div class="info-item">

                    <span class="info-label">
                        Price / Seat
                    </span>

                    <span class="info-value price">
                        ₹${formatPrice(ride.pricePerSeat)}
                    </span>

                </div>


                <div class="info-item">

                    <span class="info-label">
                        Vehicle
                    </span>

                    <span class="info-value">
                        ${escapeHtml(
                            ride.vehicleNumber || "N/A"
                        )}
                    </span>

                </div>

            </div>


            <div class="driver-section">

                <div class="driver-avatar">
                    👤
                </div>

                <div class="driver-details">

                    <span class="driver-name">
                        ${escapeHtml(
                            ride.driverName || "Unknown Driver"
                        )}
                    </span>

                    <span class="vehicle-details">
                        ${escapeHtml(
                            ride.vehicleModel || "Vehicle"
                        )}
                    </span>

                </div>

            </div>

        `;


        // Click card → details page

        card.addEventListener("click", function () {

            window.location.href =
                "/rides/" + ride.id;
        });


        return card;
    }


    // =========================
    // FORMAT DATE
    // =========================

    function formatDateTime(dateTime) {

        if (!dateTime) {
            return "N/A";
        }

        const date = new Date(dateTime);

        if (isNaN(date.getTime())) {
            return dateTime;
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    // =========================
    // FORMAT PRICE
    // =========================

    function formatPrice(price) {

        if (price === null || price === undefined) {
            return "0.00";
        }

        return Number(price).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    // =========================
    // TAB
    // =========================

    function setActiveTab(activeTab, inactiveTab) {

        activeTab.classList.add("active");

        inactiveTab.classList.remove("active");
    }


    // =========================
    // SHOW LOADING
    // =========================

    function showLoading() {

        hideAllStates();

        loadingState.classList.remove("hidden");
    }


    // =========================
    // SHOW EMPTY
    // =========================

    function showEmpty() {

        hideAllStates();

        emptyState.classList.remove("hidden");
    }


    // =========================
    // SHOW ERROR
    // =========================

    function showError(message) {

        hideAllStates();

        errorMessage.textContent = message;

        errorState.classList.remove("hidden");
    }


    // =========================
    // HIDE ERROR
    // =========================

    function hideError() {

        errorState.classList.add("hidden");
    }


    // =========================
    // HIDE ALL STATES
    // =========================

    function hideAllStates() {

        loadingState.classList.add("hidden");

        emptyState.classList.add("hidden");

        errorState.classList.add("hidden");

        ridesList.classList.add("hidden");
    }


    // =========================
    // ESCAPE HTML
    // =========================

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});