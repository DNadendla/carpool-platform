document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const loading =
            document.getElementById("loading");

        const bookingsContainer =
            document.getElementById(
                "bookingsContainer"
            );

        const emptyState =
            document.getElementById("emptyState");

        const errorMessage =
            document.getElementById(
                "errorMessage"
            );


        // =========================
        // LOAD MY BOOKINGS
        // =========================

        try {

            const response =
                await API.get(
                    "/api/bookings/my"
                );


            if (!response) {
                return;
            }


            if (!response.ok) {

                let message =
                    "Unable to load bookings.";

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


            const bookings =
                await response.json();


            loading.classList.add(
                "hidden"
            );


            // =========================
            // EMPTY STATE
            // =========================

            if (
                !bookings ||
                bookings.length === 0
            ) {

                emptyState.classList.remove(
                    "hidden"
                );

                return;
            }


            // =========================
            // RENDER BOOKINGS
            // =========================

            renderBookings(bookings);


        } catch (error) {

            console.error(
                "Bookings error:",
                error
            );


            loading.classList.add(
                "hidden"
            );


            errorMessage.textContent =
                error.message ||
                "Unable to load your bookings.";


            errorMessage.classList.remove(
                "hidden"
            );
        }


        // =========================
        // RENDER BOOKINGS
        // =========================

        function renderBookings(bookings) {

            bookingsContainer.innerHTML = "";


            bookings.forEach(
                function (booking) {

                    const card =
                        createBookingCard(
                            booking
                        );

                    bookingsContainer.appendChild(
                        card
                    );

                }
            );


            bookingsContainer.classList.remove(
                "hidden"
            );
        }


        // =========================
        // CREATE BOOKING CARD
        // =========================

function createBookingCard(booking) {

    const card =
        document.createElement("div");

    card.className =
        "booking-card";


    const ride =
        booking.ride;

    const driver =
        ride?.driver;

    const vehicle =
        ride?.vehicle;

    const status =
        booking.status || "UNKNOWN";

    const statusClass =
        status.toLowerCase();

    const totalAmount =
        Number(
            booking.totalAmount || 0
        );


    card.innerHTML = `

        <!-- =================================================
             CARD HEADER
             ================================================= -->

        <div class="booking-card-header">

            <div class="booking-id">

                <span class="booking-id-label">
                    BOOKING
                </span>

                <strong>
                    #${booking.id}
                </strong>

            </div>


            <span class="booking-status ${statusClass}">
                ${escapeHtml(status)}
            </span>

        </div>


        <!-- =================================================
             ROUTE
             ================================================= -->

        <div class="booking-route">

            <div class="booking-location">

                <span class="route-point source-point">
                    •
                </span>

                <div>

                    <span class="location-label">
                        FROM
                    </span>

                    <span class="location-name">
                        ${escapeHtml(
                            ride?.source
                        )}
                    </span>

                </div>

            </div>


            <div class="route-line">

                <span></span>

            </div>


            <div class="booking-location">

                <span class="route-point destination-point">
                    •
                </span>

                <div>

                    <span class="location-label">
                        TO
                    </span>

                    <span class="location-name">
                        ${escapeHtml(
                            ride?.destination
                        )}
                    </span>

                </div>

            </div>

        </div>


        <!-- =================================================
             QUICK DETAILS
             ================================================= -->

        <div class="booking-summary">

            <div class="summary-item">

                <span class="summary-icon">
                    📅
                </span>

                <div>

                    <span class="summary-label">
                        DEPARTURE
                    </span>

                    <span class="summary-value">
                        ${formatDateTime(
                            ride?.departureTime
                        )}
                    </span>

                </div>

            </div>


            <div class="summary-item">

                <span class="summary-icon">
                    👥
                </span>

                <div>

                    <span class="summary-label">
                        SEATS
                    </span>

                    <span class="summary-value">
                        ${booking.seats}
                    </span>

                </div>

            </div>


            <div class="summary-item amount-item">

                <span class="summary-icon">
                    ₹
                </span>

                <div>

                    <span class="summary-label">
                        TOTAL
                    </span>

                    <span class="summary-value amount-value">
                        ₹${formatAmount(
                            totalAmount
                        )}
                    </span>

                </div>

            </div>

        </div>


        <!-- =================================================
             DRIVER / VEHICLE
             ================================================= -->

        <div class="booking-info-row">

            <div class="booking-info">

                <span class="info-label">
                    DRIVER
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        driver?.name
                    )}
                </span>

            </div>


            <div class="booking-info">

                <span class="info-label">
                    VEHICLE
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        vehicle?.model
                    )}
                </span>

            </div>


            <div class="booking-info">

                <span class="info-label">
                    VEHICLE NUMBER
                </span>

                <span class="info-value">
                    ${escapeHtml(
                        vehicle?.vehicleNumber
                    )}
                </span>

            </div>

        </div>


        <!-- =================================================
             FOOTER
             ================================================= -->

        <div class="booking-card-footer">

            <span class="booked-date">

                Booked on
                ${formatDateTime(
                    booking.bookedAt
                )}

            </span>


            <div class="booking-actions">

                <button
                    type="button"
                    class="view-ride-button"
                    data-ride-id="${ride?.id}">

                    View Ride

                </button>


                ${
                    status === "CONFIRMED"
                        ? `
                            <button
                                type="button"
                                class="cancel-booking-button"
                                data-booking-id="${booking.id}">

                                Cancel Booking

                            </button>
                        `
                        : ""
                }

            </div>

        </div>

    `;


    // =====================================================
    // VIEW RIDE
    // =====================================================

    const viewRideButton =
        card.querySelector(
            ".view-ride-button"
        );


    if (viewRideButton) {

        viewRideButton.addEventListener(
            "click",
            function () {

                const rideId =
                    this.dataset.rideId;

                window.location.href =
                    "/rides/" + rideId;
            }
        );
    }


    // =====================================================
    // CANCEL BOOKING
    // =====================================================

    const cancelButton =
        card.querySelector(
            ".cancel-booking-button"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                const bookingId =
                    this.dataset.bookingId;

                cancelBooking(
                    bookingId,
                    this
                );
            }
        );
    }


    return card;
}


        // =========================
        // CANCEL BOOKING
        // =========================

        async function cancelBooking(
            bookingId,
            button
        ) {

            const confirmed =
                confirm(
                    "Are you sure you want to cancel this booking?"
                );


            if (!confirmed) {
                return;
            }


            button.disabled = true;

            button.textContent =
                "Cancelling...";


            try {

                const response =
                    await API.patch(
                        "/api/bookings/" +
                        bookingId +
                        "/cancel"
                    );


                if (!response) {
                    return;
                }


                if (!response.ok) {

                    let message =
                        "Unable to cancel booking.";

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
                    "Booking cancelled successfully."
                );


                window.location.reload();


            } catch (error) {

                console.error(
                    "Cancel booking error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to cancel booking."
                );


                button.disabled = false;

                button.textContent =
                    "Cancel Booking";
            }
        }


        // =========================
        // FORMAT DATE
        // =========================

        function formatDateTime(
            value
        ) {

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
        // FORMAT AMOUNT
        // =========================

        function formatAmount(
            value
        ) {

            if (
                value === null ||
                value === undefined
            ) {

                return "0.00";
            }


            return Number(value)
                .toFixed(2);
        }


        // =========================
        // HTML ESCAPE
        // =========================

        function escapeHtml(
            value
        ) {

            if (
                value === null ||
                value === undefined
            ) {

                return "";
            }


            return String(value)
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );
        }

    }
);