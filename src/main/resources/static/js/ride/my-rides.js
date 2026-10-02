/* =========================================================
   MY RIDES
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =====================================================
           DOM ELEMENTS
        ===================================================== */

        const loading =
            document.getElementById("loading");

        const loadingText =
            document.getElementById("loadingText");

        const errorMessage =
            document.getElementById("errorMessage");

        const errorText =
            document.getElementById("errorText");

        const retryButton =
            document.getElementById("retryButton");

        const successMessage =
            document.getElementById("successMessage");

        const emptyState =
            document.getElementById("emptyState");

        const emptyStateTitle =
            document.getElementById("emptyStateTitle");

        const emptyStateDescription =
            document.getElementById("emptyStateDescription");

        const emptyStateAction =
            document.getElementById("emptyStateAction");

        const myRidesContainer =
            document.getElementById("myRidesContainer");

        const rideFilters =
            document.getElementById("rideFilters");


        /* =====================================================
           FILTER COUNTS
        ===================================================== */

        const countAll =
            document.getElementById("countAll");

        const countScheduled =
            document.getElementById("countScheduled");

        const countStarted =
            document.getElementById("countStarted");

        const countCompleted =
            document.getElementById("countCompleted");

        const countCancelled =
            document.getElementById("countCancelled");


        /* =====================================================
           PAGINATION
        ===================================================== */

        const pagination =
            document.getElementById("myRidesPagination");

        const paginationInfo =
            document.getElementById(
                "myRidesPaginationInfo"
            );

        const previousPageButton =
            document.getElementById(
                "myRidesPreviousPageButton"
            );

        const nextPageButton =
            document.getElementById(
                "myRidesNextPageButton"
            );

        const pageNumbers =
            document.getElementById(
                "myRidesPageNumbers"
            );


        /* =====================================================
           CANCEL MODAL
        ===================================================== */

        const cancelRideModal =
            document.getElementById(
                "cancelRideModal"
            );

        const closeCancelRideModalButton =
            document.getElementById(
                "closeCancelRideModalButton"
            );

        const confirmCancelRideButton =
            document.getElementById(
                "confirmCancelRideButton"
            );

        const cancelRideSource =
            document.getElementById(
                "cancelRideSource"
            );

        const cancelRideDestination =
            document.getElementById(
                "cancelRideDestination"
            );

        const cancelRideDeparture =
            document.getElementById(
                "cancelRideDeparture"
            );


        /* =====================================================
           STATE

           IMPORTANT:
           Same PAGE_SIZE as current BOOKINGS pagination.
        ===================================================== */

        const PAGE_SIZE = 5;

        let currentPage = 0;

        let totalPages = 0;

        let totalElements = 0;

        let selectedFilter = "ALL";

        let allRides = [];

        let ridePendingCancellation = null;

        let successTimer = null;


        /* =====================================================
           INITIALIZE
        ===================================================== */

        initializeFilters();

        initializePagination();

        initializeCancelModal();

        initializeRetry();

        loadMyRides(
            0,
            null
        );


        /* =====================================================
           FILTER INITIALIZATION
        ===================================================== */

        function initializeFilters() {

            if (!rideFilters) {
                return;
            }


            rideFilters.addEventListener(
                "click",
                async function (event) {

                    const button =
                        event.target.closest(
                            ".ride-filter-button"
                        );

                    if (!button) {
                        return;
                    }


                    const status =
                        button.dataset.status;

                    if (!status) {
                        return;
                    }


                    selectedFilter =
                        status;

                    currentPage =
                        0;


                    document
                        .querySelectorAll(
                            ".ride-filter-button"
                        )
                        .forEach(
                            function (filterButton) {

                                const isActive =
                                    filterButton.dataset.status ===
                                    selectedFilter;

                                filterButton.classList.toggle(
                                    "active",
                                    isActive
                                );

                                filterButton.setAttribute(
                                    "aria-selected",
                                    String(isActive)
                                );

                            }
                        );


                    await loadMyRides(
                        0,
                        getSelectedStatus()
                    );

                }
            );

        }


        /* =====================================================
           SELECTED STATUS
        ===================================================== */

        function getSelectedStatus() {

            if (
                selectedFilter === "ALL"
            ) {
                return null;
            }

            return selectedFilter;
        }


        /* =====================================================
           PAGINATION INITIALIZATION
        ===================================================== */

        function initializePagination() {

            if (previousPageButton) {

                previousPageButton.addEventListener(
                    "click",
                    async function () {

                        if (
                            currentPage <= 0
                        ) {
                            return;
                        }

                        await loadMyRides(
                            currentPage - 1,
                            getSelectedStatus()
                        );

                    }
                );

            }


            if (nextPageButton) {

                nextPageButton.addEventListener(
                    "click",
                    async function () {

                        if (
                            currentPage >=
                            totalPages - 1
                        ) {
                            return;
                        }

                        await loadMyRides(
                            currentPage + 1,
                            getSelectedStatus()
                        );

                    }
                );

            }

        }


        /* =====================================================
           RETRY
        ===================================================== */

        function initializeRetry() {

            if (!retryButton) {
                return;
            }


            retryButton.addEventListener(
                "click",
                async function () {

                    await loadMyRides(
                        currentPage,
                        getSelectedStatus()
                    );

                }
            );

        }


        /* =====================================================
           LOAD MY RIDES
        ===================================================== */

        async function loadMyRides(
            page,
            status
        ) {

            showLoading();


            try {

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


                const url =
                    "/api/rides/my?" +
                    params.toString();


                console.log(
                    "My Rides: calling API...",
                    url
                );


                const response =
                    await API.get(url);


                console.log(
                    "My Rides API response:",
                    response
                );


                if (!response) {

                    throw new Error(
                        "Unable to load your rides."
                    );

                }


                let data = {};


                try {

                    data =
                        await response.json();

                }
                catch (error) {

                    throw new Error(
                        "Invalid rides response from server."
                    );

                }


                console.log(
                    "My Rides API data:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Unable to load your rides."
                    );

                }


                /*
                 * Backend response:
                 *
                 * {
                 *     content: [],
                 *     page: 0,
                 *     size: 5,
                 *     totalElements: 7,
                 *     totalPages: 2,
                 *     counts: {...}
                 * }
                 */


                const content =
                    Array.isArray(
                        data.content
                    )
                        ? data.content
                        : [];


                console.log(
                    "My Rides extracted:",
                    content
                );


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
                        data.totalElements ??
                        content.length
                    );


                allRides =
                    content;


                /*
                 * Update counts.
                 *
                 * Prefer backend counts.
                 * If backend doesn't provide counts,
                 * calculate from current response.
                 */

                updateFilterCounts(
                    data.counts,
                    content,
                    data.totalElements
                );


                /*
                 * Edge case:
                 *
                 * Current page became invalid after
                 * cancellation.
                 */

                if (
                    content.length === 0 &&
                    currentPage > 0 &&
                    totalPages > 0 &&
                    currentPage >= totalPages
                ) {

                    await loadMyRides(
                        totalPages - 1,
                        status
                    );

                    return;

                }


                /*
                 * IMPORTANT:
                 * Render API content BEFORE hiding
                 * the loading state.
                 */

                renderRides(
                    content
                );


                renderPagination();

            }
            catch (error) {

                console.error(
                    "My Rides error:",
                    error
                );


                showError(
                    error.message ||
                    "Unable to load your rides. Please try again."
                );

            }
            finally {

                hideLoading();

            }

        }


        /* =====================================================
           UPDATE FILTER COUNTS
        ===================================================== */

        function updateFilterCounts(
            counts,
            content,
            backendTotal
        ) {

            /*
             * If backend sends counts, use them.
             */

            if (counts) {

                if (countAll) {

                    countAll.textContent =
                        formatCount(
                            counts.all
                        );

                }


                if (countScheduled) {

                    countScheduled.textContent =
                        formatCount(
                            counts.scheduled
                        );

                }


                if (countStarted) {

                    countStarted.textContent =
                        formatCount(
                            counts.started
                        );

                }


                if (countCompleted) {

                    countCompleted.textContent =
                        formatCount(
                            counts.completed
                        );

                }


                if (countCancelled) {

                    countCancelled.textContent =
                        formatCount(
                            counts.cancelled
                        );

                }


                return;

            }


            /*
             * Fallback:
             * Calculate counts from returned rides.
             *
             * "All" uses backend totalElements because
             * the current page may contain only 5 rides.
             */

            const rides =
                Array.isArray(content)
                    ? content
                    : [];


            const total =
                Number(
                    backendTotal ??
                    rides.length
                );


            const scheduled =
                rides.filter(
                    function (ride) {
                        return ride.status ===
                            "SCHEDULED";
                    }
                ).length;


            const started =
                rides.filter(
                    function (ride) {
                        return ride.status ===
                            "STARTED";
                    }
                ).length;


            const completed =
                rides.filter(
                    function (ride) {
                        return ride.status ===
                            "COMPLETED";
                    }
                ).length;


            const cancelled =
                rides.filter(
                    function (ride) {
                        return ride.status ===
                            "CANCELLED";
                    }
                ).length;


            if (countAll) {

                countAll.textContent =
                    total;

            }


            if (countScheduled) {

                countScheduled.textContent =
                    scheduled;

            }


            if (countStarted) {

                countStarted.textContent =
                    started;

            }


            if (countCompleted) {

                countCompleted.textContent =
                    completed;

            }


            if (countCancelled) {

                countCancelled.textContent =
                    cancelled;

            }

        }


        /* =====================================================
           FORMAT COUNT
        ===================================================== */

        function formatCount(value) {

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
           RENDER RIDES
        ===================================================== */

        function renderRides(
            rides
        ) {

            hideError();

            hideSuccess();


            if (!myRidesContainer) {
                return;
            }


            myRidesContainer.innerHTML =
                "";


            if (
                !Array.isArray(rides) ||
                rides.length === 0
            ) {

                showEmptyState();

                return;

            }


            hideEmptyState();


            /*
             * Keep backend pagination.
             * Only sort the current page content.
             */

            const sortedRides =
                [...rides].sort(
                    function (a, b) {

                        const dateA =
                            new Date(
                                a.departureTime
                            );

                        const dateB =
                            new Date(
                                b.departureTime
                            );

                        return dateA - dateB;

                    }
                );


            sortedRides.forEach(
                function (ride) {

                    myRidesContainer.appendChild(
                        createRideCard(ride)
                    );

                }
            );


            myRidesContainer.classList.remove(
                "hidden"
            );

        }


        /* =====================================================
           CREATE RIDE CARD
        ===================================================== */

        function createRideCard(
            ride
        ) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "my-ride-card";


            const status =
                ride.status ||
                "UNKNOWN";


            const statusClass =
                getStatusClass(status);


            const statusLabel =
                formatStatus(status);


            const departure =
                formatDepartureTime(
                    ride.departureTime
                );


            const price =
                formatPrice(
                    ride.pricePerSeat
                );


            const vehicle =
                buildVehicleText(
                    ride
                );


            const availableSeats =
                ride.availableSeats ??
                0;


            const cancellationMeta =
                buildCancellationMeta(
                    ride
                );


            const cancelButton =
                status === "SCHEDULED"
                    ? `
                        <button
                            type="button"
                            class="ride-action-button cancel"
                            data-action="cancel"
                            data-ride-id="${escapeAttribute(ride.id)}">

                            <i class="fa-solid fa-ban"></i>

                            Cancel Ride

                        </button>
                      `
                    : "";


            card.innerHTML = `

                <!-- CARD HEADER -->

                <div class="my-ride-card-header">

                    <div class="ride-id">

                        <span class="ride-id-label">
                            RIDE
                        </span>

                        <strong>
                            #${escapeHtml(ride.id)}
                        </strong>

                    </div>


                    <span class="ride-status ${statusClass}">

                        ${escapeHtml(statusLabel)}

                    </span>

                </div>


                <!-- ROUTE -->

                <div class="ride-route-area">

                    <div class="ride-route">


                        <!-- SOURCE -->

                        <div class="route-location">

                            <span class="route-dot source-dot">
                            </span>

                            <div class="route-copy">

                                <span class="route-label">
                                    FROM
                                </span>

                                <strong
                                    title="${escapeAttribute(
                                        ride.source ||
                                        "Unknown"
                                    )}">

                                    ${escapeHtml(
                                        ride.source ||
                                        "Unknown"
                                    )}

                                </strong>

                            </div>

                        </div>


                        <!-- CONNECTOR -->

                        <div class="route-connector"
                             aria-hidden="true">

                            <span class="route-connector-line">
                            </span>

                            <i class="fa-solid fa-arrow-right">
                            </i>

                            <span class="route-connector-line">
                            </span>

                        </div>


                        <!-- DESTINATION -->

                        <div class="route-location">

                            <span class="route-dot destination-dot">
                            </span>

                            <div class="route-copy">

                                <span class="route-label">
                                    TO
                                </span>

                                <strong
                                    title="${escapeAttribute(
                                        ride.destination ||
                                        "Unknown"
                                    )}">

                                    ${escapeHtml(
                                        ride.destination ||
                                        "Unknown"
                                    )}

                                </strong>

                            </div>

                        </div>

                    </div>

                </div>


                <!-- DETAILS -->

                <div class="my-ride-details">


                    <!-- DEPARTURE -->

                    <div class="ride-detail">

                        <div class="ride-detail-icon">

                            <i class="fa-regular fa-calendar">
                            </i>

                        </div>

                        <div class="ride-detail-copy">

                            <span>
                                DEPARTURE
                            </span>

                            <strong
                                title="${escapeAttribute(
                                    departure
                                )}">

                                ${escapeHtml(
                                    departure
                                )}

                            </strong>

                        </div>

                    </div>


                    <!-- AVAILABLE SEATS -->

                    <div class="ride-detail">

                        <div class="ride-detail-icon">

                            <i class="fa-solid fa-users">
                            </i>

                        </div>

                        <div class="ride-detail-copy">

                            <span>
                                AVAILABLE SEATS
                            </span>

                            <strong>
                                ${escapeHtml(
                                    availableSeats
                                )}
                            </strong>

                        </div>

                    </div>


                    <!-- PRICE -->

                    <div class="ride-detail">

                        <div class="ride-detail-icon">

                            <i class="fa-solid fa-indian-rupee-sign">
                            </i>

                        </div>

                        <div class="ride-detail-copy">

                            <span>
                                PRICE / SEAT
                            </span>

                            <strong>
                                ${escapeHtml(
                                    price
                                )}
                            </strong>

                        </div>

                    </div>


                    <!-- VEHICLE -->

                    <div class="ride-detail">

                        <div class="ride-detail-icon">

                            <i class="fa-solid fa-car">
                            </i>

                        </div>

                        <div class="ride-detail-copy">

                            <span>
                                VEHICLE
                            </span>

                            <strong
                                title="${escapeAttribute(
                                    vehicle
                                )}">

                                ${escapeHtml(
                                    vehicle
                                )}

                            </strong>

                        </div>

                    </div>

                </div>


                ${cancellationMeta}


                <!-- FOOTER -->

                <div class="my-ride-card-footer">

                    <div class="ride-footer-meta">

                        <i class="fa-regular fa-clock">
                        </i>

                        <span>
                            ${escapeHtml(
                                departure
                            )}
                        </span>

                    </div>


                    <div class="ride-actions">


                        <!-- VIEW -->

                        <button
                            type="button"
                            class="ride-action-button view"
                            data-action="view"
                            data-ride-id="${escapeAttribute(
                                ride.id
                            )}">

                            <i class="fa-regular fa-eye">
                            </i>

                            View Details

                        </button>


                        ${cancelButton}

                    </div>

                </div>

            `;


            initializeRideCardActions(
                card,
                ride
            );


            return card;

        }


        /* =====================================================
           RIDE CARD ACTIONS
        ===================================================== */

        function initializeRideCardActions(
            card,
            ride
        ) {

            const viewButton =
                card.querySelector(
                    '[data-action="view"]'
                );


            const cancelButton =
                card.querySelector(
                    '[data-action="cancel"]'
                );


            if (viewButton) {

                viewButton.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "/rides/" +
                            encodeURIComponent(
                                ride.id
                            );

                    }
                );

            }


            if (cancelButton) {

                cancelButton.addEventListener(
                    "click",
                    function () {

                        openCancelModal(
                            ride
                        );

                    }
                );

            }

        }


        /* =====================================================
           CANCELLATION META
        ===================================================== */

        function buildCancellationMeta(
            ride
        ) {

            if (
                ride.status !==
                "CANCELLED"
            ) {

                return "";

            }


            const cancelledBy =
                formatCancellationActor(
                    ride.cancelledBy
                );


            const cancelledAt =
                formatDateTime(
                    ride.cancelledAt
                );


            return `

                <div class="ride-cancellation-meta">

                    <span>

                        <i class="fa-solid fa-user">
                        </i>

                        Cancelled by

                        <b>
                            ${escapeHtml(
                                cancelledBy
                            )}
                        </b>

                    </span>


                    <span>

                        <i class="fa-regular fa-clock">
                        </i>

                        ${escapeHtml(
                            cancelledAt
                        )}

                    </span>

                </div>

            `;

        }


        /* =====================================================
           PAGINATION
        ===================================================== */

        function renderPagination() {

            if (
                !pagination ||
                totalElements <= 0 ||
                totalPages <= 0
            ) {

                if (pagination) {

                    pagination.classList.add(
                        "hidden"
                    );

                }

                return;

            }


            pagination.classList.remove(
                "hidden"
            );


            const start =
                (currentPage * PAGE_SIZE) + 1;


            const end =
                Math.min(
                    start +
                    PAGE_SIZE -
                    1,
                    totalElements
                );


            if (paginationInfo) {

                paginationInfo.textContent =
                    "Showing " +
                    start +
                    "–" +
                    end +
                    " of " +
                    totalElements;

            }


            if (previousPageButton) {

                previousPageButton.disabled =
                    currentPage === 0;

            }


            if (nextPageButton) {

                nextPageButton.disabled =
                    currentPage >=
                    totalPages - 1;

            }


            renderPageNumbers();

        }


        /* =====================================================
           PAGE NUMBERS
        ===================================================== */

        function renderPageNumbers() {

            if (!pageNumbers) {
                return;
            }


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


                    button.textContent =
                        String(
                            page + 1
                        );


                    button.setAttribute(
                        "aria-label",
                        "Go to page " +
                        (page + 1)
                    );


                    if (
                        page ===
                        currentPage
                    ) {

                        button.classList.add(
                            "active"
                        );

                        button.setAttribute(
                            "aria-current",
                            "page"
                        );

                    }


                    button.addEventListener(
                        "click",
                        async function () {

                            if (
                                page ===
                                currentPage
                            ) {
                                return;
                            }


                            await loadMyRides(
                                page,
                                getSelectedStatus()
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
           PAGE ITEM BUILDER
        ===================================================== */

        function buildPageItems(
            totalPagesValue,
            currentPageValue
        ) {

            if (
                totalPagesValue <= 7
            ) {

                return Array.from(
                    {
                        length:
                            totalPagesValue
                    },
                    function (
                        _,
                        index
                    ) {
                        return index;
                    }
                );

            }


            const pages = [];


            pages.push(0);


            if (
                currentPageValue > 3
            ) {

                pages.push("...");

            }


            const start =
                Math.max(
                    1,
                    currentPageValue - 1
                );


            const end =
                Math.min(
                    totalPagesValue - 2,
                    currentPageValue + 1
                );


            for (
                let index = start;
                index <= end;
                index++
            ) {

                pages.push(index);

            }


            if (
                currentPageValue <
                totalPagesValue - 4
            ) {

                pages.push("...");

            }


            pages.push(
                totalPagesValue - 1
            );


            return pages;

        }


        /* =====================================================
           CANCEL MODAL INITIALIZATION
        ===================================================== */

        function initializeCancelModal() {

            if (
                closeCancelRideModalButton
            ) {

                closeCancelRideModalButton.addEventListener(
                    "click",
                    closeCancelModal
                );

            }


            if (cancelRideModal) {

                cancelRideModal.addEventListener(
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
                        cancelRideModal &&
                        !cancelRideModal.classList.contains(
                            "hidden"
                        )
                    ) {

                        closeCancelModal();

                    }

                }
            );


            if (
                confirmCancelRideButton
            ) {

                confirmCancelRideButton.addEventListener(
                    "click",
                    async function () {

                        if (
                            !ridePendingCancellation
                        ) {

                            return;

                        }


                        const rideId =
                            ridePendingCancellation.id;


                        confirmCancelRideButton.disabled =
                            true;


                        confirmCancelRideButton.innerHTML =
                            '<i class="fa-solid fa-spinner fa-spin"></i> Cancelling...';


                        await cancelRide(
                            rideId
                        );

                    }
                );

            }

        }


        /* =====================================================
           OPEN CANCEL MODAL
        ===================================================== */

        function openCancelModal(
            ride
        ) {

            ridePendingCancellation =
                ride;


            if (cancelRideSource) {

                cancelRideSource.textContent =
                    ride.source ||
                    "Unknown";

            }


            if (
                cancelRideDestination
            ) {

                cancelRideDestination.textContent =
                    ride.destination ||
                    "Unknown";

            }


            if (
                cancelRideDeparture
            ) {

                cancelRideDeparture.textContent =
                    formatDepartureTime(
                        ride.departureTime
                    );

            }


            if (
                confirmCancelRideButton
            ) {

                confirmCancelRideButton.disabled =
                    false;


                confirmCancelRideButton.innerHTML =
                    '<i class="fa-solid fa-ban"></i> Cancel Ride';

            }


            if (cancelRideModal) {

                cancelRideModal.classList.remove(
                    "hidden"
                );

            }

        }


        /* =====================================================
           CLOSE CANCEL MODAL
        ===================================================== */

        function closeCancelModal() {

            ridePendingCancellation =
                null;


            if (cancelRideModal) {

                cancelRideModal.classList.add(
                    "hidden"
                );

            }

        }


        /* =====================================================
           CANCEL RIDE
        ===================================================== */

        async function cancelRide(
            rideId
        ) {

            try {

                const response =
                    await API.patch(
                        "/api/rides/" +
                        encodeURIComponent(
                            rideId
                        ) +
                        "/cancel"
                    );


                if (!response) {

                    throw new Error(
                        "No response received from server."
                    );

                }


                if (!response.ok) {

                    let message =
                        "Unable to cancel the ride.";


                    try {

                        const error =
                            await response.json();


                        message =
                            error?.message ||
                            error?.error ||
                            message;

                    }
                    catch (ignored) {
                    }


                    throw new Error(
                        message
                    );

                }


                closeCancelModal();


                showSuccess(
                    "Ride cancelled successfully."
                );


                await loadMyRides(
                    currentPage,
                    getSelectedStatus()
                );

            }
            catch (error) {

                console.error(
                    "Cancel ride error:",
                    error
                );


                closeCancelModal();


                showError(
                    error.message ||
                    "Unable to cancel the ride."
                );

            }
            finally {

                if (
                    confirmCancelRideButton
                ) {

                    confirmCancelRideButton.disabled =
                        false;


                    confirmCancelRideButton.innerHTML =
                        '<i class="fa-solid fa-ban"></i> Cancel Ride';

                }

            }

        }


        /* =====================================================
           EMPTY STATE
        ===================================================== */

        function showEmptyState() {

            hideLoading();

            hideError();


            if (myRidesContainer) {

                myRidesContainer.classList.add(
                    "hidden"
                );

            }


            if (pagination) {

                pagination.classList.add(
                    "hidden"
                );

            }


            if (
                selectedFilter ===
                "ALL"
            ) {

                if (emptyStateTitle) {

                    emptyStateTitle.textContent =
                        "No rides yet";

                }


                if (
                    emptyStateDescription
                ) {

                    emptyStateDescription.textContent =
                        "You haven't offered any rides yet. Create a ride and start sharing your journey.";

                }


                if (
                    emptyStateAction
                ) {

                    emptyStateAction.classList.remove(
                        "hidden"
                    );

                    emptyStateAction.innerHTML =
                        '<i class="fa-solid fa-plus"></i> Create Your First Ride';

                }

            }
            else {

                if (emptyStateTitle) {

                    emptyStateTitle.textContent =
                        "No " +
                        formatFilterName(
                            selectedFilter
                        ).toLowerCase() +
                        " rides";

                }


                if (
                    emptyStateDescription
                ) {

                    emptyStateDescription.textContent =
                        "There are no rides matching the selected status.";

                }


                if (
                    emptyStateAction
                ) {

                    emptyStateAction.classList.add(
                        "hidden"
                    );

                }

            }


            if (emptyState) {

                emptyState.classList.remove(
                    "hidden"
                );

            }

        }


        function hideEmptyState() {

            if (emptyState) {

                emptyState.classList.add(
                    "hidden"
                );

            }

        }


        /* =====================================================
           LOADING
        ===================================================== */

        function showLoading() {

            hideError();

            hideSuccess();

            hideEmptyState();


            if (pagination) {

                pagination.classList.add(
                    "hidden"
                );

            }


            if (myRidesContainer) {

                myRidesContainer.classList.add(
                    "hidden"
                );

            }


            if (loadingText) {

                loadingText.textContent =
                    "Please wait while we fetch your rides.";

            }


            if (loading) {

                loading.classList.remove(
                    "hidden"
                );

            }

        }


        function hideLoading() {

            if (loading) {

                loading.classList.add(
                    "hidden"
                );

            }

        }


        /* =====================================================
           ERROR
        ===================================================== */

        function showError(
            message
        ) {

            hideLoading();

            hideSuccess();

            hideEmptyState();


            if (myRidesContainer) {

                myRidesContainer.classList.add(
                    "hidden"
                );

            }


            if (pagination) {

                pagination.classList.add(
                    "hidden"
                );

            }


            if (errorText) {

                errorText.textContent =
                    message ||
                    "Something went wrong. Please try again.";

            }


            if (errorMessage) {

                errorMessage.classList.remove(
                    "hidden"
                );

            }

        }


        function hideError() {

            if (errorMessage) {

                errorMessage.classList.add(
                    "hidden"
                );

            }

        }


        /* =====================================================
           SUCCESS
        ===================================================== */

        function showSuccess(
            message
        ) {

            if (!successMessage) {

                return;

            }


            const messageText =
                successMessage.querySelector(
                    "span"
                );


            if (messageText) {

                messageText.textContent =
                    message;

            }


            successMessage.classList.remove(
                "hidden"
            );


            if (successTimer) {

                clearTimeout(
                    successTimer
                );

            }


            successTimer =
                setTimeout(
                    hideSuccess,
                    3500
                );

        }


        function hideSuccess() {

            if (successMessage) {

                successMessage.classList.add(
                    "hidden"
                );

            }

        }


        /* =====================================================
           STATUS HELPERS
        ===================================================== */

        function getStatusClass(
            status
        ) {

            switch (status) {

                case "SCHEDULED":
                    return "scheduled";

                case "STARTED":
                    return "started";

                case "COMPLETED":
                    return "completed";

                case "CANCELLED":
                    return "cancelled";

                default:
                    return "completed";

            }

        }


        function formatStatus(
            status
        ) {

            if (!status) {

                return "Unknown";

            }


            return status
                .toLowerCase()
                .replace(
                    /_/g,
                    " "
                )
                .replace(
                    /\b\w/g,
                    function (letter) {

                        return letter.toUpperCase();

                    }
                );

        }


        function formatFilterName(
            status
        ) {

            return formatStatus(
                status
            );

        }


        function formatCancellationActor(
            actor
        ) {

            switch (actor) {

                case "DRIVER":
                    return "You";

                case "ADMIN":
                    return "Admin";

                case "SYSTEM":
                    return "System";

                default:
                    return "Unknown";

            }

        }


        /* =====================================================
           DATE FORMATTERS
        ===================================================== */

        function formatDepartureTime(
            value
        ) {

            if (!value) {

                return "-";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return String(value);

            }


            return new Intl.DateTimeFormat(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            ).format(date);

        }


        function formatDateTime(
            value
        ) {

            if (!value) {

                return "-";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return String(value);

            }


            return new Intl.DateTimeFormat(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            ).format(date);

        }


        /* =====================================================
           PRICE
        ===================================================== */

        function formatPrice(
            value
        ) {

            const amount =
                Number(value);


            if (
                Number.isNaN(amount)
            ) {

                return "₹0.00";

            }


            return new Intl.NumberFormat(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            ).format(amount);

        }


        /* =====================================================
           VEHICLE
        ===================================================== */

        function buildVehicleText(
            ride
        ) {

            const model =
                ride.vehicleModel ||
                "Vehicle";


            const number =
                ride.vehicleNumber ||
                "";


            if (!number) {

                return model;

            }


            return model +
                " • " +
                number;

        }


        /* =====================================================
           ESCAPE HELPERS
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


        function escapeAttribute(
            value
        ) {

            return escapeHtml(
                value
            );

        }

    }
);