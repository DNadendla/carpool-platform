document.addEventListener("DOMContentLoaded", function () {

    const vehiclesList =
        document.getElementById("vehiclesList");

    const loadingState =
        document.getElementById("loadingState");

    const emptyState =
        document.getElementById("emptyState");

    const errorState =
        document.getElementById("errorState");

    const errorMessage =
        document.getElementById("errorMessage");

    const retryButton =
        document.getElementById("retryButton");

    const addVehicleButton =
        document.getElementById("addVehicleButton");

    const emptyAddButton =
        document.getElementById("emptyAddButton");


    // =========================
    // INITIAL LOAD
    // =========================

    loadVehicles();


    // =========================
    // ADD VEHICLE
    // =========================

    addVehicleButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/vehicles/create";
        }
    );


    emptyAddButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/vehicles/create";
        }
    );


    // =========================
    // RETRY
    // =========================

    retryButton.addEventListener(
        "click",
        function () {

            loadVehicles();
        }
    );


    // =========================
    // LOAD VEHICLES
    // =========================

    async function loadVehicles() {

        showLoading();

        try {

            const response =
                await API.get(
                    "/api/vehicles/my"
                );


            if (!response) {
                return;
            }


            if (!response.ok) {

                throw new Error(
                    "Unable to load vehicles."
                );
            }


            const vehicles =
                await response.json();


            renderVehicles(vehicles);


        } catch (error) {

            console.error(
                "Vehicle loading error:",
                error
            );

            showError(
                "Unable to load your vehicles. Please try again."
            );
        }
    }


    // =========================
    // RENDER
    // =========================

    function renderVehicles(vehicles) {

        hideStates();

        vehiclesList.innerHTML = "";


        if (!vehicles || vehicles.length === 0) {

            emptyState.classList.remove(
                "hidden"
            );

            return;
        }


        vehicles.forEach(
            function (vehicle) {

                vehiclesList.appendChild(
                    createVehicleCard(vehicle)
                );
            }
        );


        vehiclesList.classList.remove(
            "hidden"
        );
    }


    // =========================
    // VEHICLE CARD
    // =========================

    function createVehicleCard(vehicle) {

        const card =
            document.createElement("div");

        card.className = "vehicle-card";


        card.innerHTML = `

            <div class="vehicle-card-top">

                <div class="vehicle-card-identity">

                    <div class="vehicle-icon">
                        🚘
                    </div>

                    <div class="vehicle-card-title">

                        <h2>
                            ${escapeHtml(
                                vehicle.vehicleNumber
                            )}
                        </h2>

                        <p>
                            ${escapeHtml(
                                vehicle.model
                            )}
                        </p>

                    </div>

                </div>


                <span class="vehicle-type-badge">
                    ${escapeHtml(
                        vehicle.type
                    )}
                </span>

            </div>


            <div class="vehicle-card-divider"></div>


            <div class="vehicle-card-bottom">

                <div class="vehicle-seats">

                    <span class="seats-icon">
                        👥
                    </span>

                    <div>

                        <span class="seats-label">
                            Seats
                        </span>

                        <span class="seats-value">
                            ${vehicle.totalSeats}
                        </span>

                    </div>

                </div>


                <div class="vehicle-card-actions">

                    <button
                        type="button"
                        class="vehicle-edit-button"
                        data-id="${vehicle.id}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="vehicle-delete-button"
                        data-id="${vehicle.id}">
                        Delete
                    </button>

                </div>

            </div>

        `;


        const editButton =
            card.querySelector(
                ".vehicle-edit-button"
            );


        editButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                window.location.href =
                    "/vehicles/edit/"
                    + vehicle.id;
            }
        );


        const deleteButton =
            card.querySelector(
                ".vehicle-delete-button"
            );


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                deleteVehicle(
                    vehicle.id
                );
            }
        );


        return card;
    }


    // =========================
    // DELETE VEHICLE
    // =========================

    async function deleteVehicle(id) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this vehicle?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await API.delete(
                    "/api/vehicles/" + id
                );


            if (!response) {
                return;
            }


            if (!response.ok) {

                let message =
                    "Unable to delete vehicle.";


                try {

                    const body =
                        await response.json();


                    if (body.message) {

                        message =
                            body.message;
                    }

                } catch (error) {

                    // Ignore response parsing error
                }


                throw new Error(
                    message
                );
            }


            loadVehicles();


        } catch (error) {

            console.error(
                "Delete vehicle error:",
                error
            );


            showError(
                error.message
                || "Unable to delete vehicle."
            );
        }
    }


    // =========================
    // LOADING
    // =========================

    function showLoading() {

        hideStates();

        loadingState.classList.remove(
            "hidden"
        );
    }


    // =========================
    // ERROR
    // =========================

    function showError(message) {

        hideStates();

        errorMessage.textContent =
            message;

        errorState.classList.remove(
            "hidden"
        );
    }


    // =========================
    // HIDE STATES
    // =========================

    function hideStates() {

        loadingState.classList.add(
            "hidden"
        );

        emptyState.classList.add(
            "hidden"
        );

        errorState.classList.add(
            "hidden"
        );

        vehiclesList.classList.add(
            "hidden"
        );
    }


    // =========================
    // ESCAPE HTML
    // =========================

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
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