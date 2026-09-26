let currentRide = null;


document.addEventListener("DOMContentLoaded", async function () {

    const loading =
        document.getElementById("loading");

    const rideDetails =
        document.getElementById("rideDetails");

    const errorMessage =
        document.getElementById("errorMessage");

    const cancelButton =
        document.getElementById("cancelRideButton");


    // =========================
    // GET RIDE ID FROM URL
    // =========================

    const pathParts =
        window.location.pathname.split("/");

    const rideId =
        pathParts[pathParts.length - 1];


    if (!rideId || isNaN(rideId)) {

        showError("Invalid ride ID.");

        return;
    }


    // =========================
    // LOAD RIDE
    // =========================

    try {

        const response =
            await API.get(
                "/api/rides/" + rideId
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            let message =
                "Unable to load ride details.";


            try {

                const error =
                    await response.json();


                if (error.message) {
                    message = error.message;
                }

            } catch (e) {
                // Ignore parsing error
            }


            throw new Error(message);
        }


        const ride =
            await response.json();
        currentRide = ride;

        // Render ride details

        renderRide(ride);

        // Initialize map AFTER
        // ride details become visible
        initializeRideMap(ride);

        // Initialize booking section
        initializeBookingSection(ride);


        // Attach booking events

        initializeBookingEvents();

    } catch (error) {

        console.error(
            "Ride details error:",
            error
        );


        showError(
            error.message ||
            "Unable to load ride details."
        );
    }


    // =========================
    // RENDER RIDE
    // =========================

    function renderRide(ride) {

        document.getElementById("routeTitle")
            .textContent =
            ride.source +
            " → " +
            ride.destination;


        document.getElementById("source")
            .textContent =
            ride.source;


        document.getElementById("destination")
            .textContent =
            ride.destination;


        document.getElementById("departureTime")
            .textContent =
            formatDateTime(
                ride.departureTime
            );


        document.getElementById("availableSeats")
            .textContent =
            ride.availableSeats;


        document.getElementById("pricePerSeat")
            .textContent =
            "₹" +
            Number(
                ride.pricePerSeat
            ).toFixed(2);


        document.getElementById("vehicle")
            .textContent =
            ride.vehicleModel +
            " (" +
            ride.vehicleNumber +
            ")";


        document.getElementById("driverName")
            .textContent =
            ride.driverName;


        const statusBadge =
            document.getElementById(
                "statusBadge"
            );


        statusBadge.textContent =
            ride.status;


        statusBadge.className =
            "status-badge " +
            ride.status.toLowerCase();


        // Hide loading

        loading.classList.add("hidden");


        // Show ride details

        rideDetails.classList.remove("hidden");


        // =========================
        // CANCEL RIDE
        // =========================

        if (ride.status === "SCHEDULED") {

            cancelButton.classList.remove(
                "hidden"
            );


            cancelButton.addEventListener(
                "click",
                function () {

                    cancelRide(ride.id);

                }
            );
        }
    }


    // =========================
    // INITIALIZE BOOKING
    // =========================

    function initializeBookingSection(ride) {

        const bookingSection =
            document.getElementById(
                "bookingSection"
            );

        const availableSeatsElement =
            document.getElementById(
                "bookingAvailableSeats"
            );

        const priceElement =
            document.getElementById(
                "bookingPrice"
            );

        const seatsElement =
            document.getElementById(
                "bookingSeats"
            );

        const decreaseButton =
            document.getElementById(
                "decreaseSeatsButton"
            );

        const increaseButton =
            document.getElementById(
                "increaseSeatsButton"
            );


        if (
            !bookingSection ||
            !availableSeatsElement ||
            !priceElement ||
            !seatsElement
        ) {
            return;
        }


        availableSeatsElement.textContent =
            ride.availableSeats;


        priceElement.textContent =
            "₹" +
            Number(
                ride.pricePerSeat
            ).toFixed(2);


        // Start with 1 seat

        seatsElement.textContent =
            ride.availableSeats > 0 ? "1" : "0";


        // Store maximum seats

        seatsElement.dataset.max =
            ride.availableSeats;


        // Store current seats

        seatsElement.dataset.value =
            ride.availableSeats > 0 ? "1" : "0";


        // No seats available

        if (ride.availableSeats <= 0) {

            decreaseButton.disabled = true;

            increaseButton.disabled = true;

            document.getElementById(
                "bookRideButton"
            ).disabled = true;

            document.getElementById(
                "bookRideButton"
            ).textContent =
                "No Seats Available";

            return;
        }


        // Normal initial state

        decreaseButton.disabled = true;

        increaseButton.disabled =
            ride.availableSeats <= 1;


        updateBookingTotal();
    }

    function increaseSeats() {

        const seatsElement =
            document.getElementById(
                "bookingSeats"
            );

        const decreaseButton =
            document.getElementById(
                "decreaseSeatsButton"
            );

        const increaseButton =
            document.getElementById(
                "increaseSeatsButton"
            );


        let seats =
            Number(
                seatsElement.dataset.value
            );

        const maxSeats =
            Number(
                seatsElement.dataset.max
            );


        if (seats >= maxSeats) {
            return;
        }


        seats++;


        seatsElement.dataset.value =
            seats;

        seatsElement.textContent =
            seats;


        // Enable minus

        decreaseButton.disabled =
            seats <= 1;


        // Disable plus at maximum

        increaseButton.disabled =
            seats >= maxSeats;


        updateBookingTotal();
    }


    function decreaseSeats() {

        const seatsElement =
            document.getElementById(
                "bookingSeats"
            );

        const decreaseButton =
            document.getElementById(
                "decreaseSeatsButton"
            );

        const increaseButton =
            document.getElementById(
                "increaseSeatsButton"
            );


        let seats =
            Number(
                seatsElement.dataset.value
            );


        if (seats <= 1) {
            return;
        }


        seats--;


        seatsElement.dataset.value =
            seats;

        seatsElement.textContent =
            seats;


        // Disable minus at 1

        decreaseButton.disabled =
            seats <= 1;


        // Enable plus

        increaseButton.disabled =
            seats >=
            Number(
                seatsElement.dataset.max
            );


        updateBookingTotal();
    }

    // =========================
    // INITIALIZE BOOKING EVENTS
    // =========================

    function initializeBookingEvents() {

        const decreaseButton =
            document.getElementById(
                "decreaseSeatsButton"
            );

        const increaseButton =
            document.getElementById(
                "increaseSeatsButton"
            );

        const bookButton =
            document.getElementById(
                "bookRideButton"
            );


        if (
            !decreaseButton ||
            !increaseButton ||
            !bookButton
        ) {
            return;
        }


        // Minus button

        decreaseButton.addEventListener(
            "click",
            decreaseSeats
        );


        // Plus button

        increaseButton.addEventListener(
            "click",
            increaseSeats
        );


        // Book button

        bookButton.addEventListener(
            "click",
            bookRide
        );
    }


    // =========================
    // UPDATE BOOKING TOTAL
    // =========================

    function updateBookingTotal() {

        const seatsElement =
            document.getElementById(
                "bookingSeats"
            );

        const totalElement =
            document.getElementById(
                "bookingTotal"
            );


        if (
            !currentRide ||
            !seatsElement
        ) {

            totalElement.textContent =
                "₹0.00";

            return;
        }


        const seats =
            Number(
                seatsElement.dataset.value
            );


        if (!seats) {

            totalElement.textContent =
                "₹0.00";

            return;
        }


        const total =
            seats *
            Number(
                currentRide.pricePerSeat
            );


        totalElement.textContent =
            "₹" +
            total.toFixed(2);
    }

    // =========================
    // BOOK RIDE
    // =========================

    async function bookRide() {

        const seatsElement =
            document.getElementById(
                "bookingSeats"
            );


        const bookButton =
            document.getElementById(
                "bookRideButton"
            );


        const messageElement =
            document.getElementById(
                "bookingMessage"
            );


        const errorElement =
            document.getElementById(
                "bookingSeatsError"
            );


        // Clear previous messages

        errorElement.textContent = "";


        messageElement.className =
            "booking-message";


        messageElement.textContent =
            "";


        const seats =
            Number(
                seatsElement.dataset.value
            );


        // =========================
        // VALIDATION
        // =========================

        if (!seats) {

            errorElement.textContent =
                "Please select the number of seats.";

            return;
        }


        if (!currentRide) {

            return;
        }


        if (
            seats >
            currentRide.availableSeats
        ) {

            errorElement.textContent =
                "Selected seats are not available.";

            return;
        }


        // =========================
        // START BOOKING
        // =========================

        bookButton.disabled = true;

        bookButton.textContent =
            "Booking...";


        try {

            const request = {

                rideId:
                    currentRide.id,

                seats:
                    seats
            };


            const response =
                await API.post(
                    "/api/bookings",
                    request
                );


            if (!response) {
                return;
            }


            const data =
                await response.json();


            // =========================
            // BOOKING FAILED
            // =========================

            if (!response.ok) {

                messageElement.className =
                    "booking-message error";


                messageElement.textContent =
                    data.message ||
                    "Booking failed.";


                bookButton.disabled =
                    false;


                bookButton.textContent =
                    "Book This Ride";


                return;
            }

            // =========================
            // BOOKING SUCCESS
            // =========================

            messageElement.className =
                "booking-message success";

            messageElement.innerHTML =
                "✓ Booking confirmed! " +
                "Booking ID: " +
                data.id;


            // Wait briefly so the user can see
            // the booking confirmation message
            setTimeout(function () {

                window.location.href = "/bookings";

            }, 1000);


        } catch (error) {

            console.error(
                "Booking error:",
                error
            );


            messageElement.className =
                "booking-message error";


            messageElement.textContent =
                "Something went wrong while booking the ride.";


            bookButton.disabled =
                false;


            bookButton.textContent =
                "Book This Ride";
        }
    }


    // =========================
    // CANCEL RIDE
    // =========================

    async function cancelRide(id) {

        const confirmed =
            confirm(
                "Are you sure you want to cancel this ride?"
            );


        if (!confirmed) {
            return;
        }


        try {

            cancelButton.disabled =
                true;


            cancelButton.textContent =
                "Cancelling...";


            const response =
                await API.patch(
                    "/api/rides/" +
                    id +
                    "/cancel"
                );


            if (!response) {
                return;
            }


            if (!response.ok) {

                let message =
                    "Unable to cancel ride.";


                try {

                    const error =
                        await response.json();


                    if (error.message) {

                        message =
                            error.message;
                    }

                } catch (e) {
                    // Ignore parsing error
                }


                throw new Error(message);
            }


            alert(
                "Ride cancelled successfully."
            );


            window.location.reload();


        } catch (error) {

            console.error(
                "Cancel ride error:",
                error
            );


            alert(
                error.message ||
                "Unable to cancel ride."
            );


            cancelButton.disabled =
                false;


            cancelButton.textContent =
                "Cancel Ride";
        }
    }


    // =========================
    // DATE FORMAT
    // =========================

    function formatDateTime(value) {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


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
    // ERROR
    // =========================

    function showError(message) {

        loading.classList.add(
            "hidden"
        );


        errorMessage.textContent =
            message;


        errorMessage.classList.remove(
            "hidden"
        );
    }

});

function initializeRideMap(ride) {

    const mapElement =
        document.getElementById("rideMap");


    if (!mapElement) {
        return;
    }


    const sourceLatitude =
        Number(ride.sourceLatitude);

    const sourceLongitude =
        Number(ride.sourceLongitude);

    const destinationLatitude =
        Number(ride.destinationLatitude);

    const destinationLongitude =
        Number(ride.destinationLongitude);


    // =========================
    // VALIDATE COORDINATES
    // =========================

    if (
        !sourceLatitude ||
        !sourceLongitude ||
        !destinationLatitude ||
        !destinationLongitude
    ) {

        mapElement.innerHTML =
            "<p style='padding:20px;color:#64748b'>" +
            "Map location is not available for this ride." +
            "</p>";

        return;
    }


    // =========================
    // CREATE MAP
    // =========================

    const map =
        L.map("rideMap");


    // =========================
    // OPEN STREET MAP
    // =========================

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors",

            maxZoom: 19
        }
    ).addTo(map);


    // =========================
    // SOURCE ICON
    // =========================

    const sourceIcon =
        L.divIcon({

            className:
                "custom-map-marker",

            html:
                `
                <div class="map-marker source-marker">
                    ●
                </div>
                `,

            iconSize: [
                36,
                36
            ],

            iconAnchor: [
                18,
                18
            ]

        });


    // =========================
    // DESTINATION ICON
    // =========================

    const destinationIcon =
        L.divIcon({

            className:
                "custom-map-marker",

            html:
                `
                <div class="map-marker destination-marker">
                    ●
                </div>
                `,

            iconSize: [
                36,
                36
            ],

            iconAnchor: [
                18,
                18
            ]

        });


    // =========================
    // SOURCE MARKER
    // =========================

    L.marker(
        [
            sourceLatitude,
            sourceLongitude
        ],
        {
            icon: sourceIcon
        }
    )
        .addTo(map)
        .bindPopup(
            "<strong>Pickup</strong><br>" +
            ride.source
        );


    // =========================
    // DESTINATION MARKER
    // =========================

    L.marker(
        [
            destinationLatitude,
            destinationLongitude
        ],
        {
            icon: destinationIcon
        }
    )
        .addTo(map)
        .bindPopup(
            "<strong>Destination</strong><br>" +
            ride.destination
        );


    // =========================
    // ROUTE LINE
    // =========================

    L.polyline(
        [
            [
                sourceLatitude,
                sourceLongitude
            ],

            [
                destinationLatitude,
                destinationLongitude
            ]
        ],
        {
            weight: 5,

            opacity: 0.8,

            dashArray: "10, 8",

            lineCap: "round"
        }
    ).addTo(map);


    // =========================
    // FIT MAP TO ROUTE
    // =========================

    const bounds =
        L.latLngBounds([
            [
                sourceLatitude,
                sourceLongitude
            ],

            [
                destinationLatitude,
                destinationLongitude
            ]
        ]);


    map.fitBounds(
        bounds,
        {
            padding: [
                40,
                40
            ]
        }
    );

}

/*
function initializeRideMap(ride) {

    const mapElement =
        document.getElementById("rideMap");

    if (!mapElement) {
        return;
    }

    const sourceLatitude =
        Number(ride.sourceLatitude);

    const sourceLongitude =
        Number(ride.sourceLongitude);

    const destinationLatitude =
        Number(ride.destinationLatitude);

    const destinationLongitude =
        Number(ride.destinationLongitude);


    // Make sure coordinates are available
    if (
        !sourceLatitude ||
        !sourceLongitude ||
        !destinationLatitude ||
        !destinationLongitude
    ) {

        mapElement.innerHTML =
            "<p style='padding:20px;color:#64748b'>" +
            "Map location is not available for this ride." +
            "</p>";

        return;
    }


    // Create map
    const map =
        L.map("rideMap");


    // OpenStreetMap tiles
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    // Source marker
    const sourceMarker =
        L.marker([
            sourceLatitude,
            sourceLongitude
        ])
        .addTo(map)
        .bindPopup(
            "<strong>Source</strong><br>" +
            ride.source
        );


    // Destination marker
    const destinationMarker =
        L.marker([
            destinationLatitude,
            destinationLongitude
        ])
        .addTo(map)
        .bindPopup(
            "<strong>Destination</strong><br>" +
            ride.destination
        );


    // Draw a simple line between locations
    const routeLine =
        L.polyline(
            [
                [
                    sourceLatitude,
                    sourceLongitude
                ],
                [
                    destinationLatitude,
                    destinationLongitude
                ]
            ],
            {
                weight: 4
            }
        ).addTo(map);


    // Automatically fit both markers
    const bounds =
        L.latLngBounds([
            [
                sourceLatitude,
                sourceLongitude
            ],
            [
                destinationLatitude,
                destinationLongitude
            ]
        ]);

    map.fitBounds(
        bounds,
        {
            padding: [40, 40]
        }
    );
}*/
