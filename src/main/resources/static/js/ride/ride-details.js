let currentRide = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const loading =
            document.getElementById("loading");

        const rideDetails =
            document.getElementById("rideDetails");

        const errorMessage =
            document.getElementById("errorMessage");

        const cancelButton =
            document.getElementById("cancelRideButton");


        /* =====================================================
           GET RIDE ID
        ===================================================== */

        const pathParts =
            window.location.pathname.split("/");

        const rideId =
            pathParts[pathParts.length - 1];


        if (!rideId || isNaN(rideId)) {

            showError("Invalid ride ID.");

            return;
        }


        /* =====================================================
           LOAD RIDE
        ===================================================== */

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


            /*
             * IMPORTANT:
             *
             * Render first so #rideMap becomes visible.
             * Then initialize Leaflet.
             */
            renderRide(ride);

            initializeRideMap(ride);

            initializeBookingSection(ride);

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


        /* =====================================================
           RENDER RIDE
        ===================================================== */

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


            /* Hide loading */

            loading.classList.add("hidden");


            /* Show ride details */

            rideDetails.classList.remove("hidden");


            /* =================================================
               CANCEL RIDE
            ================================================= */

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


        /* =====================================================
           INITIALIZE BOOKING
        ===================================================== */

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


            /*
             * Start with one seat.
             */

            seatsElement.textContent =
                ride.availableSeats > 0
                    ? "1"
                    : "0";


            seatsElement.dataset.max =
                ride.availableSeats;


            seatsElement.dataset.value =
                ride.availableSeats > 0
                    ? "1"
                    : "0";


            /*
             * No seats.
             */

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

                updateBookingTotal();

                return;
            }


            /*
             * Normal initial state.
             */

            decreaseButton.disabled = true;

            increaseButton.disabled =
                ride.availableSeats <= 1;


            /*
             * Booking only available
             * for scheduled rides.
             */

            if (ride.status !== "SCHEDULED") {

                decreaseButton.disabled = true;

                increaseButton.disabled = true;

                document.getElementById(
                    "bookRideButton"
                ).disabled = true;

                document.getElementById(
                    "bookRideButton"
                ).textContent =
                    "Booking Not Available";
            }


            updateBookingTotal();
        }


        /* =====================================================
           INCREASE SEATS
        ===================================================== */

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


            decreaseButton.disabled =
                seats <= 1;


            increaseButton.disabled =
                seats >= maxSeats;


            updateBookingTotal();
        }


        /* =====================================================
           DECREASE SEATS
        ===================================================== */

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


            decreaseButton.disabled =
                seats <= 1;


            increaseButton.disabled =
                seats >=
                Number(
                    seatsElement.dataset.max
                );


            updateBookingTotal();
        }


        /* =====================================================
           BOOKING EVENTS
        ===================================================== */

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


            decreaseButton.addEventListener(
                "click",
                decreaseSeats
            );


            increaseButton.addEventListener(
                "click",
                increaseSeats
            );


            bookButton.addEventListener(
                "click",
                bookRide
            );
        }


        /* =====================================================
           BOOKING TOTAL
        ===================================================== */

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


        /* =====================================================
           BOOK RIDE
        ===================================================== */

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


            errorElement.textContent = "";


            messageElement.className =
                "booking-message";


            messageElement.textContent =
                "";


            const seats =
                Number(
                    seatsElement.dataset.value
                );


            /* Validation */

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


            /* Start booking */

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


                /* Booking failed */

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


                /* Booking success */

                messageElement.className =
                    "booking-message success";


                messageElement.innerHTML =
                    "✓ Booking confirmed! " +
                    "Booking ID: " +
                    data.id;


                /*
                 * Redirect to bookings page
                 * after showing confirmation.
                 */

                setTimeout(function () {

                    window.location.href =
                        "/bookings";

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


        /* =====================================================
           CANCEL RIDE
        ===================================================== */

        async function cancelRide(id) {

            const confirmed =
                confirm(
                    "Are you sure you want to cancel this ride?"
                );


            if (!confirmed) {
                return;
            }


            try {

                cancelButton.disabled = true;

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


        /* =====================================================
           DATE FORMAT
        ===================================================== */

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


        /* =====================================================
           ERROR
        ===================================================== */

        function showError(message) {

            loading.classList.add(
                "hidden"
            );


            const errorText =
                document.getElementById(
                    "errorText"
                );


            if (errorText) {

                errorText.textContent =
                    message;

            } else {

                errorMessage.textContent =
                    message;
            }


            errorMessage.classList.remove(
                "hidden"
            );
        }

    }
);


/* =========================================================
   LEAFLET MAP
========================================================= */

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


    /* =====================================================
       VALIDATE COORDINATES
    ===================================================== */

    if (
        !Number.isFinite(sourceLatitude) ||
        !Number.isFinite(sourceLongitude) ||
        !Number.isFinite(destinationLatitude) ||
        !Number.isFinite(destinationLongitude)
    ) {

        mapElement.innerHTML =
            "<div class='map-unavailable'>" +
            "Map location is not available for this ride." +
            "</div>";

        return;
    }


    /* =====================================================
       CREATE MAP
    ===================================================== */

    const map =
        L.map("rideMap", {
            zoomControl: true,
            scrollWheelZoom: true
        });


    /* =====================================================
       TILE LAYER
    ===================================================== */

    const tileLayer =
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors",

                maxZoom: 19
            }
        );


    tileLayer.addTo(map);


    /* =====================================================
       COORDINATES
    ===================================================== */

    const sourcePoint = [
        sourceLatitude,
        sourceLongitude
    ];

    const destinationPoint = [
        destinationLatitude,
        destinationLongitude
    ];


    /* =====================================================
       CUSTOM SOURCE ICON
    ===================================================== */

    const sourceIcon =
        L.divIcon({

            className:
                "custom-map-marker",

            html:
                '<div class="map-marker source">' +
                '<span>●</span>' +
                '</div>',

            iconSize:
                [38, 38],

            iconAnchor:
                [19, 19],

            popupAnchor:
                [0, -20]

        });


    /* =====================================================
       CUSTOM DESTINATION ICON
    ===================================================== */

    const destinationIcon =
        L.divIcon({

            className:
                "custom-map-marker",

            html:
                '<div class="map-marker destination">' +
                '<span>●</span>' +
                '</div>',

            iconSize:
                [38, 38],

            iconAnchor:
                [19, 19],

            popupAnchor:
                [0, -20]

        });


    /* =====================================================
       SOURCE MARKER
    ===================================================== */

    const sourceMarker =
        L.marker(
            sourcePoint,
            {
                icon: sourceIcon
            }
        )
        .addTo(map);


    sourceMarker.bindPopup(
        "<strong style='color:#15803d'>" +
        "Pickup" +
        "</strong><br>" +
        escapeHtml(ride.source)
    );


    /* =====================================================
       DESTINATION MARKER
    ===================================================== */

    const destinationMarker =
        L.marker(
            destinationPoint,
            {
                icon: destinationIcon
            }
        )
        .addTo(map);


    destinationMarker.bindPopup(
        "<strong style='color:#dc2626'>" +
        "Destination" +
        "</strong><br>" +
        escapeHtml(ride.destination)
    );


    /* =====================================================
       STRAIGHT ROUTE LINE
    ===================================================== */

    const routeLine =
        L.polyline(
            [
                sourcePoint,
                destinationPoint
            ],
            {
                color: "#2563eb",

                weight: 4,

                opacity: 0.85,

                dashArray: "8 8",

                lineCap: "round",

                lineJoin: "round"
            }
        )
        .addTo(map);


    /* =====================================================
       BOUNDS
    ===================================================== */

    const bounds =
        L.latLngBounds(
            sourcePoint,
            destinationPoint
        );


    /* =====================================================
       IMPORTANT:
       WAIT UNTIL BROWSER FINISHES LAYOUT
    ===================================================== */

    requestAnimationFrame(function () {

        map.invalidateSize(true);

        map.fitBounds(
            bounds,
            {
                padding: [
                    35,
                    35
                ],

                maxZoom: 10,

                animate: false
            }
        );

        tileLayer.redraw();

    });


    /*
     * Second recalculation after
     * browser has painted everything.
     */

    setTimeout(function () {

        map.invalidateSize(true);

        map.fitBounds(
            bounds,
            {
                padding: [
                    35,
                    35
                ],

                maxZoom: 10,

                animate: false
            }
        );

        tileLayer.redraw();

    }, 500);
}


/* =========================================================
   HTML ESCAPE
========================================================= */

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


/* =========================================================
   SIMPLE HTML ESCAPE
========================================================= */

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