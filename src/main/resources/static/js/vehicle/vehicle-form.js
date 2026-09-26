document.addEventListener("DOMContentLoaded", function () {

    const vehicleForm =
        document.getElementById("vehicleForm");

    const vehicleNumberInput =
        document.getElementById("vehicleNumber");

    const modelInput =
        document.getElementById("model");

    const typeInput =
        document.getElementById("type");

    const totalSeatsInput =
        document.getElementById("totalSeats");

    const message =
        document.getElementById("formMessage");

    const saveButton =
        document.getElementById("saveVehicleButton");

    const cancelButton =
        document.getElementById("cancelButton");


    // =========================
    // SUBMIT
    // =========================

    vehicleForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessage();


            const vehicleNumber =
                vehicleNumberInput.value
                    .trim()
                    .toUpperCase();

            const model =
                modelInput.value.trim();

            const type =
                typeInput.value;

            const totalSeats =
                Number(totalSeatsInput.value);


            // =========================
            // CLIENT VALIDATION
            // =========================

            if (!vehicleNumber) {

                showError(
                    "Vehicle number is required."
                );

                vehicleNumberInput.focus();

                return;
            }


            if (!model) {

                showError(
                    "Vehicle model is required."
                );

                modelInput.focus();

                return;
            }


            if (!type) {

                showError(
                    "Please select a vehicle type."
                );

                typeInput.focus();

                return;
            }


            if (
                !totalSeats ||
                totalSeats < 1 ||
                totalSeats > 10
            ) {

                showError(
                    "Total seats must be between 1 and 10."
                );

                totalSeatsInput.focus();

                return;
            }


            // =========================
            // REQUEST
            // =========================

            const request = {

                vehicleNumber: vehicleNumber,

                model: model,

                type: type,

                totalSeats: totalSeats
            };


            setSubmitting(true);


            try {

                const response =
                    await API.post(
                        "/api/vehicles/my",
                        request
                    );


                if (!response) {
                    return;
                }


                if (!response.ok) {

                    let errorMessage =
                        "Unable to add vehicle.";

                    try {

                        const errorBody =
                            await response.json();

                        if (errorBody.message) {

                            errorMessage =
                                errorBody.message;
                        }

                    } catch (error) {
                        // Ignore JSON parsing errors
                    }


                    throw new Error(
                        errorMessage
                    );
                }


                const vehicle =
                    await response.json();


                console.log(
                    "Vehicle created:",
                    vehicle
                );


                showSuccess(
                    "Vehicle added successfully!"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "/vehicles";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Create vehicle error:",
                    error
                );


                showError(
                    error.message
                    || "Unable to add vehicle."
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
                "/vehicles";
        }
    );


    // =========================
    // VEHICLE NUMBER
    // =========================

    vehicleNumberInput.addEventListener(
        "input",
        function () {

            vehicleNumberInput.value =
                vehicleNumberInput.value
                    .toUpperCase();
        }
    );


    // =========================
    // SUBMITTING
    // =========================

    function setSubmitting(submitting) {

        saveButton.disabled =
            submitting;

        saveButton.textContent =
            submitting
                ? "Adding..."
                : "Add Vehicle";
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