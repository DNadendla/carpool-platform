function setupLocationAutocomplete(
    inputId,
    suggestionsId,
    latitudeId,
    longitudeId
) {

    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    const latitude = document.getElementById(latitudeId);
    const longitude = document.getElementById(longitudeId);

    let debounceTimer;

    input.addEventListener("input", function () {

        const query = input.value.trim();

        // User changed the location.
        // Previously selected coordinates are no longer valid.
        latitude.value = "";
        longitude.value = "";

        clearTimeout(debounceTimer);

        if (query.length < 3) {
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
            return;
        }

        debounceTimer = setTimeout(async function () {

            try {

                const response =
                    await API.get(
                        "/api/location/autocomplete?text="
                        + encodeURIComponent(query)
                    );

                if (!response) {
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Location search failed"
                    );
                }

                const data =
                    await response.json();

                displayLocationSuggestions(
                    data.results || [],
                    input,
                    suggestions,
                    latitude,
                    longitude
                );

            } catch (error) {

                console.error(
                    "Location autocomplete error:",
                    error
                );

                suggestions.innerHTML = "";
                suggestions.style.display = "none";
            }

        }, 300);
    });
}

function displayLocationSuggestions(
    results,
    input,
    suggestionsContainer,
    latitudeInput,
    longitudeInput
) {

    suggestionsContainer.innerHTML = "";

    if (!results || results.length === 0) {
        suggestionsContainer.style.display = "none";
        return;
    }

    results.forEach(function (place) {

        const item =
            document.createElement("div");

        item.className =
            "location-suggestion";

        const title =
            document.createElement("div");

        title.className =
            "location-suggestion-title";

        title.textContent =
            place.city ||
            place.name ||
            place.formatted;

        const subtitle =
            document.createElement("div");

        subtitle.className =
            "location-suggestion-subtitle";

        subtitle.textContent =
            place.formatted;

        item.appendChild(title);
        item.appendChild(subtitle);

        item.addEventListener("click", function () {

            input.value =
                place.formatted;

            latitudeInput.value =
                place.lat;

            longitudeInput.value =
                place.lon;

            suggestionsContainer.innerHTML = "";

            suggestionsContainer.style.display =
                "none";
        });

        suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.style.display =
        "block";
}

document.addEventListener("DOMContentLoaded", function () {

        setupLocationAutocomplete(
            "source",
            "sourceSuggestions",
            "sourceLatitude",
            "sourceLongitude"
        );

        setupLocationAutocomplete(
            "destination",
            "destinationSuggestions",
            "destinationLatitude",
            "destinationLongitude"
        );

    const rideForm = document.getElementById("rideForm");

    const vehicleSelect =
        document.getElementById("vehicle");

    const sourceInput =
        document.getElementById("source");

    const destinationInput =
        document.getElementById("destination");

    const departureInput =
        document.getElementById("departureTime");

    const seatsInput =
        document.getElementById("availableSeats");

    const priceInput =
        document.getElementById("pricePerSeat");

    const message =
        document.getElementById("formMessage");

    const createButton =
        document.getElementById("createRideButton");

    const cancelButton =
        document.getElementById("cancelButton");


    let vehicles = [];


    // =========================
    // INITIAL LOAD
    // =========================

    setMinimumDepartureTime();

    loadVehicles();


    // =========================
    // VEHICLE CHANGE
    // =========================

    vehicleSelect.addEventListener("change", function () {

        const vehicleId = Number(
            vehicleSelect.value
        );

        const selectedVehicle =
            vehicles.find(
                vehicle => vehicle.id === vehicleId
            );

        if (!selectedVehicle) {
            seatsInput.removeAttribute("max");
            return;
        }

        seatsInput.max =
            selectedVehicle.totalSeats;

        seatsInput.placeholder =
            "Max " + selectedVehicle.totalSeats;

        if (
            seatsInput.value &&
            Number(seatsInput.value)
                > selectedVehicle.totalSeats
        ) {

            seatsInput.value =
                selectedVehicle.totalSeats;
        }
    });


    // =========================
    // SUBMIT
    // =========================

    rideForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessage();


            const vehicleId =
                Number(vehicleSelect.value);

            const source =
                sourceInput.value.trim();

            const destination =
                destinationInput.value.trim();

            const departureTime =
                departureInput.value;

            const availableSeats =
                Number(seatsInput.value);

            const pricePerSeat =
                Number(priceInput.value);


            // =========================
            // CLIENT VALIDATION
            // =========================

            if (!vehicleId) {

                showError(
                    "Please select a vehicle."
                );

                return;
            }


            if (!source || !destination) {

                showError(
                    "Source and destination are required."
                );

                return;
            }

            // =========================
            // LOCATION VALIDATION
            // =========================

            const sourceLatitude =
                document.getElementById("sourceLatitude").value;

            const sourceLongitude =
                document.getElementById("sourceLongitude").value;

            const destinationLatitude =
                document.getElementById("destinationLatitude").value;

            const destinationLongitude =
                document.getElementById("destinationLongitude").value;

            if (
                !sourceLatitude ||
                !sourceLongitude ||
                !destinationLatitude ||
                !destinationLongitude
            ) {

                showError(
                    "Please select Source and Destination from the suggestions."
                );

                return;
            }


            if (
                source.toLowerCase()
                === destination.toLowerCase()
            ) {

                showError(
                    "Source and destination cannot be the same."
                );

                return;
            }


            if (!departureTime) {

                showError(
                    "Please select departure date and time."
                );

                return;
            }


            const selectedVehicle =
                vehicles.find(
                    vehicle => vehicle.id === vehicleId
                );


            if (
                selectedVehicle &&
                availableSeats
                > selectedVehicle.totalSeats
            ) {

                showError(
                    "Available seats cannot exceed vehicle capacity."
                );

                return;
            }


            if (availableSeats < 1) {

                showError(
                    "At least one seat must be available."
                );

                return;
            }


            if (pricePerSeat < 0) {

                showError(
                    "Price cannot be negative."
                );

                return;
            }


            // =========================
            // REQUEST
            // =========================

            const request = {

                vehicleId: vehicleId,

                source: document.getElementById("source").value,

                sourceLatitude:
                    Number(
                        document.getElementById("sourceLatitude").value
                    ),

                sourceLongitude:
                    Number(
                        document.getElementById("sourceLongitude").value
                    ),

                destination:
                    document.getElementById("destination").value,

                destinationLatitude:
                    Number(
                        document.getElementById("destinationLatitude").value
                    ),

                destinationLongitude:
                    Number(
                        document.getElementById("destinationLongitude").value
                    ),

                departureTime: departureTime,

                availableSeats: availableSeats,

                pricePerSeat: pricePerSeat
            };


            setSubmitting(true);


            try {

                const response =
                    await API.post(
                        "/api/rides",
                        request
                    );


                if (!response) {
                    return;
                }


                if (!response.ok) {

                    let errorText =
                        "Unable to create ride.";

                    try {

                        const errorBody =
                            await response.json();

                        if (errorBody.message) {
                            errorText =
                                errorBody.message;
                        }

                    } catch (e) {
                        // Ignore JSON parsing error
                    }


                    throw new Error(errorText);
                }


                const ride =
                    await response.json();


                showSuccess(
                    "Ride created successfully!"
                );


                setTimeout(function () {

                    window.location.href =
                        "/rides/" + ride.id;

                }, 1000);


            } catch (error) {

                console.error(
                    "Create ride error:",
                    error
                );

                showError(
                    error.message
                    || "Unable to create ride."
                );

                setSubmitting(false);
            }
        }
    );


    // =========================
    // CANCEL
    // =========================

    cancelButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/rides";
        }
    );


    // =========================
    // LOAD VEHICLES
    // =========================

    async function loadVehicles() {

        vehicleSelect.innerHTML = `
            <option value="">
                Loading vehicles...
            </option>
        `;


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
                    "Unable to load your vehicles."
                );
            }


            vehicles =
                await response.json();


            vehicleSelect.innerHTML = `
                <option value="">
                    Select a vehicle
                </option>
            `;


            if (vehicles.length === 0) {

                vehicleSelect.innerHTML = `
                    <option value="">
                        No vehicles found
                    </option>
                `;

                document.getElementById(
                    "vehicleHelp"
                ).textContent =
                    "Please add a vehicle before creating a ride.";

                createButton.disabled = true;

                return;
            }


            vehicles.forEach(
                function (vehicle) {

                    /*const option =
                        document.createElement("option");

                    option.value =
                        vehicle.id;

                    option.textContent =
                        vehicle.vehicleNumber
                        + " • "
                        + vehicle.model
                        + " • "
                        + vehicle.totalSeats
                        + " seats";

                    vehicleSelect.appendChild(
                        option
                    );*/

                    const option =
                        document.createElement("option");

                    option.value =
                        vehicle.id;

                    option.dataset.vehicleType =
                        vehicle.type;

                    option.textContent =
                        vehicle.vehicleNumber
                        + " • "
                        + vehicle.model
                        + " • "
                        + vehicle.totalSeats
                        + " seats";

                    vehicleSelect.appendChild(
                        option
                    );
                }
            );


        } catch (error) {

            console.error(
                "Vehicle loading error:",
                error
            );


            vehicleSelect.innerHTML = `
                <option value="">
                    Unable to load vehicles
                </option>
            `;


            showError(
                "Unable to load your vehicles."
            );
        }
    }


    // =========================
    // MINIMUM DATE/TIME
    // =========================

    function setMinimumDepartureTime() {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(now.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(now.getDate())
                .padStart(2, "0");

        const hours =
            String(now.getHours())
                .padStart(2, "0");

        const minutes =
            String(now.getMinutes())
                .padStart(2, "0");


        departureInput.min =
            `${year}-${month}-${day}T${hours}:${minutes}`;
    }


    // =========================
    // SUBMITTING
    // =========================

    function setSubmitting(submitting) {

        createButton.disabled =
            submitting;

        createButton.textContent =
            submitting
                ? "Creating..."
                : "Create Ride";
    }


    // =========================
    // ERROR
    // =========================

    function showError(text) {

        message.textContent = text;

        message.className =
            "form-message error";
    }


    // =========================
    // SUCCESS
    // =========================

    function showSuccess(text) {

        message.textContent = text;

        message.className =
            "form-message success";
    }


    // =========================
    // CLEAR MESSAGE
    // =========================

    function clearMessage() {

        message.textContent = "";

        message.className =
            "form-message hidden";
    }

});