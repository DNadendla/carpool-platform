document.addEventListener(
    "DOMContentLoaded",
    async function () {


        /* =====================================================
           DOM ELEMENTS
        ===================================================== */

        const loading =
            document.getElementById("loading");

        const loadingText =
            document.getElementById("loadingText");

        const errorMessage =
            document.getElementById("errorMessage");

        const successMessage =
            document.getElementById("successMessage");

        const emptyState =
            document.getElementById("emptyState");

        const emptyStateTitle =
            document.getElementById("emptyStateTitle");

        const emptyStateDescription =
            document.getElementById(
                "emptyStateDescription"
            );

        const bookingsContainer =
            document.getElementById(
                "bookingsContainer"
            );

        const pagination =
            document.getElementById("pagination");

        const paginationInfo =
            document.getElementById(
                "paginationInfo"
            );

        const previousPageButton =
            document.getElementById(
                "previousPageButton"
            );

        const nextPageButton =
            document.getElementById(
                "nextPageButton"
            );

        const pageNumbers =
            document.getElementById(
                "pageNumbers"
            );


        const filterButtons =
            document.querySelectorAll(
                ".booking-filter-button"
            );


        /* =====================================================
           STATUS COUNTS
        ===================================================== */

        const countAll =
            document.getElementById("countAll");

        const countConfirmed =
            document.getElementById("countConfirmed");

        const countPending =
            document.getElementById("countPending");

        const countCancelled =
            document.getElementById("countCancelled");

        const countRejected =
            document.getElementById("countRejected");


        /* =====================================================
           PAGINATION STATE
        ===================================================== */

        const PAGE_SIZE = 5;

        let currentPage = 0;

        let currentStatus = null;

        let totalPages = 0;

        let totalElements = 0;


        /* =====================================================
           CANCEL MODAL
        ===================================================== */

        const cancelModal =
            document.getElementById(
                "cancelBookingModal"
            );

        const closeCancelModalButton =
            document.getElementById(
                "closeCancelModalButton"
            );

        const confirmCancelBookingButton =
            document.getElementById(
                "confirmCancelBookingButton"
            );

        let bookingPendingCancellation = null;


        /* =====================================================
           INITIALIZE
        ===================================================== */

        initializeFilters();

        initializePagination();

        initializeCancelModal();

        await loadBookings(
            currentPage,
            currentStatus
        );


        /* =====================================================
           FILTER INITIALIZATION
        ===================================================== */

        function initializeFilters() {

            filterButtons.forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        async function () {

                            const selectedStatus =
                                this.dataset.status;

                            if (
                                selectedStatus ===
                                "ALL"
                            ) {

                                currentStatus =
                                    null;

                            } else {

                                currentStatus =
                                    selectedStatus;
                            }


                            currentPage = 0;


                            updateActiveFilter(
                                selectedStatus
                            );


                            await loadBookings(
                                currentPage,
                                currentStatus
                            );
                        }
                    );
                }
            );
        }


        /* =====================================================
           ACTIVE FILTER
        ===================================================== */

        function updateActiveFilter(
            selectedStatus
        ) {

            filterButtons.forEach(
                function (button) {

                    const isActive =
                        button.dataset.status ===
                        selectedStatus;

                    button.classList.toggle(
                        "active",
                        isActive
                    );

                    button.setAttribute(
                        "aria-selected",
                        String(isActive)
                    );
                }
            );
        }


        /* =====================================================
           LOAD BOOKINGS
        ===================================================== */

        async function loadBookings(
            page,
            status
        ) {

            hideMessage(
                errorMessage
            );

            hideMessage(
                successMessage
            );


            showLoading();


            try {

                const url =
                    buildBookingsUrl(
                        page,
                        status
                    );


                const response =
                    await API.get(url);


                if (!response) {

                    throw new Error(
                        "Unable to load your bookings."
                    );
                }


                let data = {};


                try {

                    data =
                        await response.json();

                } catch (error) {

                    throw new Error(
                        "Invalid booking response from server."
                    );
                }


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load your bookings."
                    );
                }


                const content =
                    Array.isArray(
                        data.content
                    )
                        ? data.content
                        : [];


                currentPage =
                    Number(
                        data.page ?? page
                    );


                totalPages =
                    Number(
                        data.totalPages ?? 0
                    );


                totalElements =
                    Number(
                        data.totalElements ?? 0
                    );


                updateCounts(
                    data.counts
                );


                /*
                 * When cancellation removes the last
                 * booking from the last page, the requested
                 * page can become invalid.
                 *
                 * Example:
                 * page 2 existed with one booking.
                 * After cancellation page 2 disappears.
                 *
                 * Move back to the new last page.
                 */

                if (
                    content.length === 0 &&
                    currentPage > 0 &&
                    totalPages > 0 &&
                    currentPage >= totalPages
                ) {

                    await loadBookings(
                        totalPages - 1,
                        status
                    );

                    return;
                }


                renderBookings(
                    content
                );


                updateEmptyState(
                    content
                );


                renderPagination();


            } catch (error) {

                console.error(
                    "Bookings error:",
                    error
                );


                bookingsContainer.innerHTML =
                    "";

                bookingsContainer.classList.add(
                    "hidden"
                );


                emptyState.classList.add(
                    "hidden"
                );


                pagination.classList.add(
                    "hidden"
                );


                errorMessage.textContent =
                    error.message ||
                    "Unable to load your bookings.";


                errorMessage.classList.remove(
                    "hidden"
                );


            } finally {

                hideLoading();
            }
        }


        /* =====================================================
           BUILD BOOKINGS URL
        ===================================================== */

        function buildBookingsUrl(
            page,
            status
        ) {

            const params =
                new URLSearchParams();


            params.set(
                "page",
                String(page)
            );


            params.set(
                "size",
                String(PAGE_SIZE)
            );


            if (
                status &&
                status !== "ALL"
            ) {

                params.set(
                    "status",
                    status
                );
            }


            return (
                "/api/bookings/my?" +
                params.toString()
            );
        }


        /* =====================================================
           UPDATE COUNTS
        ===================================================== */

        function updateCounts(
            counts
        ) {

            if (!counts) {
                return;
            }


            countAll.textContent =
                formatCount(
                    counts.all
                );


            countConfirmed.textContent =
                formatCount(
                    counts.confirmed
                );


            countPending.textContent =
                formatCount(
                    counts.pending
                );


            countCancelled.textContent =
                formatCount(
                    counts.cancelled
                );


            countRejected.textContent =
                formatCount(
                    counts.rejected
                );
        }


        /* =====================================================
           FORMAT COUNT
        ===================================================== */

        function formatCount(
            value
        ) {

            const count =
                Number(value);


            if (
                !Number.isFinite(count)
            ) {

                return "0";
            }


            return String(count);
        }


        /* =====================================================
           EMPTY STATE
        ===================================================== */

        function updateEmptyState(
            bookings
        ) {

            if (
                bookings &&
                bookings.length > 0
            ) {

                emptyState.classList.add(
                    "hidden"
                );

                return;
            }


            bookingsContainer.classList.add(
                "hidden"
            );


            emptyState.classList.remove(
                "hidden"
            );


            if (!currentStatus) {

                emptyStateTitle.textContent =
                    "No bookings yet";

                emptyStateDescription.textContent =
                    "You haven't booked any rides yet. Find a ride and start your journey.";

                return;
            }


            emptyStateTitle.textContent =
                "No " +
                formatStatus(
                    currentStatus
                ).toLowerCase() +
                " bookings";


            emptyStateDescription.textContent =
                "There are no bookings with this status.";
        }


        /* =====================================================
           RENDER BOOKINGS
        ===================================================== */

        function renderBookings(
            bookings
        ) {

            bookingsContainer.innerHTML =
                "";


            if (
                !bookings ||
                bookings.length === 0
            ) {

                return;
            }


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


        /* =====================================================
           CREATE BOOKING CARD
        ===================================================== */

        function createBookingCard(
            booking
        ) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "booking-card";


            const ride =
                booking.ride || {};


            const driver =
                ride.driver || {};


            const vehicle =
                ride.vehicle || {};


            const bookingStatus =
                normalizeStatus(
                    booking.status
                );


            const rideStatus =
                normalizeStatus(
                    ride.status
                );


            const totalAmount =
                Number(
                    booking.totalAmount || 0
                );


            const rideIsCancelled =
                rideStatus ===
                "CANCELLED";


            const bookingIsConfirmed =
                bookingStatus ===
                "CONFIRMED";


            const canCancel =
                bookingIsConfirmed &&
                !rideIsCancelled;


            const source =
                displayValue(
                    ride.source
                );


            const destination =
                displayValue(
                    ride.destination
                );


            const driverName =
                displayValue(
                    driver.name
                );


            const vehicleModel =
                displayValue(
                    vehicle.model
                );


            const vehicleNumber =
                displayValue(
                    vehicle.vehicleNumber
                );


            const statusClass =
                bookingStatus.toLowerCase();


            card.innerHTML = `

                <!-- =========================================
                     CARD HEADER
                ========================================== -->

                <div class="booking-card-header">

                    <div class="booking-id">

                        <span class="booking-id-label">
                            BOOKING
                        </span>

                        <strong>
                            #${escapeHtml(
                                booking.id
                            )}
                        </strong>

                    </div>


                    <div class="booking-status-group">

                        <span class="booking-status ${statusClass}">
                            ${escapeHtml(
                                formatStatus(
                                    bookingStatus
                                )
                            )}
                        </span>


                        ${
                            rideIsCancelled
                                ? `
                                    <span class="ride-status cancelled">
                                        <i class="fa-solid fa-ban"></i>
                                        Ride Cancelled
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <!-- =========================================
                     ROUTE
                ========================================== -->

                <div class="booking-route">

                    <div class="booking-location">

                        <span class="route-point source-point">
                        </span>

                        <div>

                            <span class="location-label">
                                FROM
                            </span>

                            <span class="location-name">
                                ${escapeHtml(source)}
                            </span>

                        </div>

                    </div>


                    <div class="route-line">
                        <span></span>
                    </div>


                    <div class="booking-location">

                        <span class="route-point destination-point">
                        </span>

                        <div>

                            <span class="location-label">
                                TO
                            </span>

                            <span class="location-name">
                                ${escapeHtml(destination)}
                            </span>

                        </div>

                    </div>

                </div>


                <!-- =========================================
                     RIDE CANCELLED
                ========================================== -->

                ${
                    rideIsCancelled
                        ? `
                            <div class="booking-ride-cancelled">

                                <div class="booking-ride-cancelled-icon">

                                    <i class="fa-solid fa-circle-exclamation"></i>

                                </div>

                                <div>

                                    <strong>
                                        This ride has been cancelled
                                    </strong>

                                    <p>
                                        This booking is no longer active.
                                    </p>

                                </div>

                            </div>
                          `
                        : ""
                }


                <!-- =========================================
                     QUICK DETAILS
                ========================================== -->

                <div class="booking-summary">

                    <div class="summary-item">

                        <span class="summary-icon">

                            <i class="fa-regular fa-calendar"></i>

                        </span>

                        <div>

                            <span class="summary-label">
                                DEPARTURE
                            </span>

                            <span class="summary-value">
                                ${formatDateTime(
                                    ride.departureTime
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="summary-item">

                        <span class="summary-icon">

                            <i class="fa-solid fa-users"></i>

                        </span>

                        <div>

                            <span class="summary-label">
                                SEATS
                            </span>

                            <span class="summary-value">
                                ${escapeHtml(
                                    booking.seats
                                )}
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


                <!-- =========================================
                     DRIVER / VEHICLE
                ========================================== -->

                <div class="booking-info-row">

                    <div class="booking-info">

                        <span class="info-label">
                            DRIVER
                        </span>

                        <span class="info-value">
                            ${escapeHtml(
                                driverName
                            )}
                        </span>

                    </div>


                    <div class="booking-info">

                        <span class="info-label">
                            VEHICLE
                        </span>

                        <span class="info-value">
                            ${escapeHtml(
                                vehicleModel
                            )}
                        </span>

                    </div>


                    <div class="booking-info">

                        <span class="info-label">
                            VEHICLE NUMBER
                        </span>

                        <span class="info-value">
                            ${escapeHtml(
                                vehicleNumber
                            )}
                        </span>

                    </div>

                </div>


                <!-- =========================================
                     FOOTER
                ========================================== -->

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
                            data-ride-id="${escapeHtml(
                                ride.id
                            )}">

                            <i class="fa-solid fa-route"></i>

                            View Ride

                        </button>


                        ${
                            canCancel
                                ? `
                                    <button
                                        type="button"
                                        class="cancel-booking-button"
                                        data-booking-id="${escapeHtml(
                                            booking.id
                                        )}">

                                        <i class="fa-solid fa-ban"></i>

                                        Cancel Booking

                                    </button>
                                  `
                                : ""
                        }

                    </div>

                </div>

            `;


            initializeCardActions(
                card
            );


            return card;
        }


        /* =====================================================
           CARD ACTIONS
        ===================================================== */

        function initializeCardActions(
            card
        ) {

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


                        if (!rideId) {
                            return;
                        }


                        window.location.href =
                            "/rides/" +
                            rideId;
                    }
                );
            }


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


                        if (!bookingId) {
                            return;
                        }


                        openCancelModal(
                            bookingId,
                            this
                        );
                    }
                );
            }
        }


        /* =====================================================
           INITIALIZE PAGINATION
        ===================================================== */

        function initializePagination() {

            previousPageButton.addEventListener(
                "click",
                async function () {

                    if (
                        currentPage <= 0
                    ) {
                        return;
                    }


                    currentPage--;


                    await loadBookings(
                        currentPage,
                        currentStatus
                    );
                }
            );


            nextPageButton.addEventListener(
                "click",
                async function () {

                    if (
                        currentPage >=
                        totalPages - 1
                    ) {
                        return;
                    }


                    currentPage++;


                    await loadBookings(
                        currentPage,
                        currentStatus
                    );
                }
            );
        }


        /* =====================================================
           RENDER PAGINATION
        ===================================================== */

        function renderPagination() {

            if (
                totalElements <= 0 ||
                totalPages <= 0
            ) {

                pagination.classList.add(
                    "hidden"
                );

                return;
            }


            pagination.classList.remove(
                "hidden"
            );


            const start =
                (currentPage * PAGE_SIZE) + 1;


            const end =
                Math.min(
                    start + PAGE_SIZE - 1,
                    totalElements
                );


            paginationInfo.textContent =
                `Showing ${start}–${end} of ${totalElements}`;


            previousPageButton.disabled =
                currentPage === 0;


            nextPageButton.disabled =
                currentPage >=
                totalPages - 1;


            renderPageNumbers();
        }


        /* =====================================================
           PAGE NUMBERS
        ===================================================== */

        function renderPageNumbers() {

            pageNumbers.innerHTML =
                "";


            const pageItems =
                buildPageItems(
                    totalPages,
                    currentPage
                );


            pageItems.forEach(
                function (page) {

                    if (page === "...") {

                        const ellipsis =
                            document.createElement(
                                "span"
                            );


                        ellipsis.className =
                            "pagination-ellipsis";


                        ellipsis.textContent =
                            "…";


                        pageNumbers.appendChild(
                            ellipsis
                        );


                        return;
                    }


                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "pagination-button";


                    if (
                        page === currentPage
                    ) {

                        button.classList.add(
                            "active"
                        );

                    }


                    button.textContent =
                        String(page + 1);


                    button.addEventListener(
                        "click",
                        async function () {

                            if (
                                page ===
                                currentPage
                            ) {

                                return;
                            }


                            currentPage =
                                page;


                            await loadBookings(
                                currentPage,
                                currentStatus
                            );
                        }
                    );


                    pageNumbers.appendChild(
                        button
                    );
                }
            );
        }


        /* =====================================================
           PAGE ITEMS
        ===================================================== */

        function buildPageItems(
            total,
            current
        ) {

            if (total <= 7) {

                return Array.from(
                    {
                        length: total
                    },
                    function (_, index) {
                        return index;
                    }
                );
            }


            const items = [];


            items.push(0);


            if (current > 3) {

                items.push("...");
            }


            const start =
                Math.max(
                    1,
                    current - 1
                );


            const end =
                Math.min(
                    total - 2,
                    current + 1
                );


            for (
                let index = start;
                index <= end;
                index++
            ) {

                items.push(index);
            }


            if (
                current <
                total - 4
            ) {

                items.push("...");
            }


            items.push(
                total - 1
            );


            return items;
        }


        /* =====================================================
           CANCEL MODAL
        ===================================================== */

        function initializeCancelModal() {

            if (
                closeCancelModalButton
            ) {

                closeCancelModalButton.addEventListener(
                    "click",
                    closeCancelModal
                );
            }


            if (cancelModal) {

                cancelModal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target.dataset
                                .modalClose ===
                            "true"
                        ) {

                            closeCancelModal();
                        }
                    }
                );
            }


            document.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Escape" &&
                        cancelModal &&
                        !cancelModal.classList.contains(
                            "hidden"
                        )
                    ) {

                        closeCancelModal();
                    }
                }
            );


            if (
                confirmCancelBookingButton
            ) {

                confirmCancelBookingButton.addEventListener(
                    "click",
                    async function () {

                        if (
                            !bookingPendingCancellation
                        ) {

                            return;
                        }


                        const bookingId =
                            bookingPendingCancellation
                                .bookingId;


                        const originalButton =
                            bookingPendingCancellation
                                .button;


                        confirmCancelBookingButton.disabled =
                            true;


                        confirmCancelBookingButton.innerHTML =
                            `
                                <i class="fa-solid fa-spinner fa-spin"></i>
                                Cancelling...
                            `;


                        await cancelBooking(
                            bookingId,
                            originalButton
                        );
                    }
                );
            }
        }


        /* =====================================================
           OPEN CANCEL MODAL
        ===================================================== */

        function openCancelModal(
            bookingId,
            button
        ) {

            bookingPendingCancellation = {
                bookingId: bookingId,
                button: button
            };


            cancelModal.classList.remove(
                "hidden"
            );


            cancelModal.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.classList.add(
                "modal-open"
            );
        }


        /* =====================================================
           CLOSE CANCEL MODAL
        ===================================================== */

        function closeCancelModal() {

            bookingPendingCancellation =
                null;


            cancelModal.classList.add(
                "hidden"
            );


            cancelModal.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.classList.remove(
                "modal-open"
            );


            confirmCancelBookingButton.disabled =
                false;


            confirmCancelBookingButton.innerHTML =
                `
                    <i class="fa-solid fa-ban"></i>
                    Cancel Booking
                `;
        }


        /* =====================================================
           CANCEL BOOKING
        ===================================================== */

        async function cancelBooking(
            bookingId,
            button
        ) {

            try {

                const response =
                    await API.patch(
                        "/api/bookings/" +
                        bookingId +
                        "/cancel"
                    );


                if (!response) {

                    throw new Error(
                        "Unable to cancel booking."
                    );
                }


                let data = {};


                try {

                    data =
                        await response.json();

                } catch (error) {

                    data = {};
                }


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to cancel booking."
                    );
                }


                /*
                 * Close the modal first.
                 */

                closeCancelModal();


                /*
                 * Reload only the current backend page.
                 *
                 * This updates:
                 * - booking status
                 * - totalElements
                 * - totalPages
                 * - status counts
                 */

                await loadBookings(
                    currentPage,
                    currentStatus
                );


                showSuccess(
                    "Booking cancelled successfully."
                );


            } catch (error) {

                console.error(
                    "Cancel booking error:",
                    error
                );


                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML =
                        `
                            <i class="fa-solid fa-ban"></i>
                            Cancel Booking
                        `;
                }


                confirmCancelBookingButton.disabled =
                    false;


                confirmCancelBookingButton.innerHTML =
                    `
                        <i class="fa-solid fa-ban"></i>
                        Cancel Booking
                    `;


                showInlineError(
                    error.message ||
                    "Unable to cancel booking."
                );
            }
        }


        /* =====================================================
           LOADING
        ===================================================== */

        function showLoading() {

            loading.classList.remove(
                "hidden"
            );


            loadingText.textContent =
                currentStatus
                    ? `Loading ${formatStatus(currentStatus).toLowerCase()} bookings...`
                    : "Loading your bookings...";


            bookingsContainer.classList.add(
                "hidden"
            );


            emptyState.classList.add(
                "hidden"
            );


            pagination.classList.add(
                "hidden"
            );
        }


        function hideLoading() {

            loading.classList.add(
                "hidden"
            );
        }


        /* =====================================================
           SUCCESS MESSAGE
        ===================================================== */

        function showSuccess(
            message
        ) {

            successMessage.textContent =
                message;


            successMessage.classList.remove(
                "hidden"
            );


            window.setTimeout(
                function () {

                    hideMessage(
                        successMessage
                    );

                },
                4000
            );
        }


        /* =====================================================
           INLINE ERROR
        ===================================================== */

        function showInlineError(
            message
        ) {

            errorMessage.textContent =
                message;


            errorMessage.classList.remove(
                "hidden"
            );


            window.setTimeout(
                function () {

                    hideMessage(
                        errorMessage
                    );

                },
                5000
            );
        }


        function hideMessage(
            element
        ) {

            if (!element) {
                return;
            }


            element.classList.add(
                "hidden"
            );


            element.textContent =
                "";
        }


        /* =====================================================
           STATUS
        ===================================================== */

        function normalizeStatus(
            value
        ) {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return "UNKNOWN";
            }


            return String(value)
                .toUpperCase();
        }


        function formatStatus(
            value
        ) {

            return String(
                value || "UNKNOWN"
            )
                .replace(
                    /_/g,
                    " "
                )
                .toUpperCase();
        }


        /* =====================================================
           DISPLAY VALUE
        ===================================================== */

        function displayValue(
            value
        ) {

            if (
                value === null ||
                value === undefined ||
                String(value).trim() === ""
            ) {

                return "Not available";
            }


            return String(value);
        }


        /* =====================================================
           DATE
        ===================================================== */

        function formatDateTime(
            value
        ) {

            if (!value) {
                return "-";
            }


            const date =
                new Date(value);


            if (
                isNaN(
                    date.getTime()
                )
            ) {

                return "-";
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


        /* =====================================================
           AMOUNT
        ===================================================== */

        function formatAmount(
            value
        ) {

            if (
                value === null ||
                value === undefined ||
                isNaN(
                    Number(value)
                )
            ) {

                return "0.00";
            }


            return Number(value)
                .toFixed(2);
        }


        /* =====================================================
           HTML ESCAPE
        ===================================================== */

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