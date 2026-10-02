document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       DOM ELEMENTS
       ===================================================== */

    const ridesList =
        document.getElementById("ridesList");

    const loadingState =
        document.getElementById("loadingState");

    const emptyState =
        document.getElementById("emptyState");

    const errorState =
        document.getElementById("errorState");

    const errorMessage =
        document.getElementById("errorMessage");

    const searchValidation =
        document.getElementById("searchValidation");

    const rideCount =
        document.getElementById("rideCount");

    const sourceInput =
        document.getElementById("source");

    const destinationInput =
        document.getElementById("destination");

    const searchButton =
        document.getElementById("searchButton");

    const clearSearchButton =
        document.getElementById("clearSearchButton");

    const retryButton =
        document.getElementById("retryButton");

    const offerRideButton =
        document.getElementById("offerRideButton");

    const pagination =
        document.getElementById("pagination");


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const PAGE_SIZE = 5;


    /* =====================================================
       STATE
       ===================================================== */

    let currentPage = 0;

    let currentSource = "";

    let currentDestination = "";

    let isSearching = false;

    let isLoading = false;


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    loadRides(0);


    /* =====================================================
       SEARCH
       ===================================================== */

    searchButton.addEventListener(
        "click",
        function () {

            const source =
                sourceInput.value.trim();

            const destination =
                destinationInput.value.trim();


            if (!source || !destination) {

                showSearchValidation();

                return;
            }


            hideSearchValidation();

            currentSource = source;

            currentDestination = destination;

            isSearching = true;

            loadRides(0);
        }
    );


    /* =====================================================
       CLEAR SEARCH
       ===================================================== */

    clearSearchButton.addEventListener(
        "click",
        function () {

            sourceInput.value = "";

            destinationInput.value = "";

            currentSource = "";

            currentDestination = "";

            isSearching = false;

            hideSearchValidation();

            hideError();

            loadRides(0);
        }
    );


    /* =====================================================
       ENTER KEY SEARCH
       ===================================================== */

    sourceInput.addEventListener(
        "keydown",
        handleEnter
    );

    destinationInput.addEventListener(
        "keydown",
        handleEnter
    );


    function handleEnter(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchButton.click();
        }
    }


    /* =====================================================
       RETRY
       ===================================================== */

    retryButton.addEventListener(
        "click",
        function () {

            loadRides(currentPage);
        }
    );


    /* =====================================================
       OFFER RIDE
       ===================================================== */

    offerRideButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/rides/create";
        }
    );


    /* =====================================================
       LOAD RIDES
       ===================================================== */

    async function loadRides(page) {

        /*
         * Prevent duplicate requests.
         *
         * Example:
         * User clicks page 2 multiple times quickly.
         *
         * Only one request should be active.
         */

        if (isLoading) {
            return;
        }


        isLoading = true;

        currentPage = page;

        hideSearchValidation();

        showLoading();


        try {

            let url;


            /* ---------------------------------------------
               SEARCH MODE
               --------------------------------------------- */

            if (
                isSearching &&
                currentSource &&
                currentDestination
            ) {

                const params =
                    new URLSearchParams({
                        source: currentSource,
                        destination: currentDestination,
                        page: page,
                        size: PAGE_SIZE
                    });

                url =
                    `/api/rides/search?${params.toString()}`;
            }


            /* ---------------------------------------------
               NORMAL MODE
               --------------------------------------------- */

            else {

                const params =
                    new URLSearchParams({
                        page: page,
                        size: PAGE_SIZE
                    });

                url =
                    `/api/rides?${params.toString()}`;
            }


            /* ---------------------------------------------
               API CALL
               --------------------------------------------- */

            const response =
                await API.get(url);


            if (!response) {

                throw new Error(
                    "No response received from server."
                );
            }


            if (!response.ok) {

                let message =
                    "Unable to load rides.";

                try {

                    const error =
                        await response.json();

                    message =
                        error?.message ||
                        error?.error ||
                        message;

                } catch (e) {

                    // Ignore JSON parsing errors
                }

                throw new Error(message);
            }


            const data =
                await response.json();


            renderResponse(data);


        } catch (error) {

            console.error(
                "Error loading rides:",
                error
            );


            showError(
                error.message ||
                "Unable to load rides. Please try again."
            );

        } finally {

            isLoading = false;
        }
    }


    /* =====================================================
       HANDLE API RESPONSE
       ===================================================== */

    function renderResponse(data) {

        /*
         * Backend now returns RidePageResponse:
         *
         * {
         *     content: [],
         *     page: 0,
         *     size: 5,
         *     totalElements: 20,
         *     totalPages: 4,
         *     first: true,
         *     last: false
         * }
         */


        if (
            !data ||
            !Array.isArray(data.content)
        ) {

            throw new Error(
                "Unexpected response received from rides API."
            );
        }


        const rides =
            data.content;


        const totalElements =
            Number(
                data.totalElements || 0
            );


        /*
         * IMPORTANT:
         *
         * Your custom RidePageResponse contains
         * "page", not Spring Page's "number".
         */

        const page =
            Number(
                data.page || 0
            );


        const totalPages =
            Number(
                data.totalPages || 0
            );


        const first =
            Boolean(data.first);


        const last =
            Boolean(data.last);


        currentPage = page;


        renderRideList(
            rides,
            totalElements
        );


        renderPagination(
            page,
            totalPages,
            first,
            last
        );
    }


    /* =====================================================
       RENDER RIDE LIST
       ===================================================== */

    function renderRideList(
        rides,
        totalElements
    ) {

        hideAllStates();


        ridesList.innerHTML = "";


        /* ---------------------------------------------
           COUNT
           --------------------------------------------- */

        rideCount.textContent =
            totalElements +
            (
                totalElements === 1
                    ? " ride"
                    : " rides"
            );


        /* ---------------------------------------------
           EMPTY
           --------------------------------------------- */

        if (
            !rides ||
            rides.length === 0
        ) {

            showEmpty();

            return;
        }


        /* ---------------------------------------------
           CARDS
           --------------------------------------------- */

        rides.forEach(
            function (ride) {

                const card =
                    createRideCard(ride);

                ridesList.appendChild(card);
            }
        );


        ridesList.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       CREATE RIDE CARD
       ===================================================== */

    function createRideCard(ride) {

        const card =
            document.createElement("article");

        card.className =
            "ride-card";


        /* =================================================
           STATUS
           ================================================= */

        const status =
            String(
                ride?.status ||
                "SCHEDULED"
            ).toUpperCase();


        let statusClass =
            "ride-status-active";


        if (
            status === "CANCELLED"
        ) {

            statusClass =
                "ride-status-cancelled";

        } else if (
            status === "STARTED" ||
            status === "IN_PROGRESS"
        ) {

            statusClass =
                "ride-status-started";

        } else if (
            status === "COMPLETED"
        ) {

            statusClass =
                "ride-status-completed";
        }


        /* =================================================
           DATE
           ================================================= */

        const departure =
            formatDateTime(
                ride?.departureTime
            );


        /* =================================================
           CARD HTML
           ================================================= */

        card.innerHTML = `

            <div class="ride-card-header">

                <div class="ride-route">

                    <span
                        class="ride-route-location"
                        title="${escapeHtml(
                            ride?.source
                        )}">

                        ${escapeHtml(
                            ride?.source ||
                            "Unknown"
                        )}

                    </span>


                    <span
                        class="ride-route-arrow"
                        aria-hidden="true">

                        <i class="fa-solid fa-arrow-right"></i>

                    </span>


                    <span
                        class="ride-route-location"
                        title="${escapeHtml(
                            ride?.destination
                        )}">

                        ${escapeHtml(
                            ride?.destination ||
                            "Unknown"
                        )}

                    </span>

                </div>


                <span
                    class="ride-status ${statusClass}">

                    ${formatStatus(status)}

                </span>

            </div>


            <div class="ride-details">


                <div class="ride-detail">

                    <div class="ride-detail-label">
                        Departure
                    </div>

                    <div class="ride-detail-value">

                        <i class="fa-regular fa-calendar"></i>

                        ${departure}

                    </div>

                </div>


                <div class="ride-detail">

                    <div class="ride-detail-label">
                        Available Seats
                    </div>

                    <div class="ride-detail-value">

                        <i class="fa-solid fa-chair"></i>

                        ${escapeHtml(
                            ride?.availableSeats ??
                            "N/A"
                        )}

                    </div>

                </div>


                <div class="ride-detail">

                    <div class="ride-detail-label">
                        Price / Seat
                    </div>

                    <div class="ride-detail-value ride-price">

                        ₹${formatPrice(
                            ride?.pricePerSeat
                        )}

                    </div>

                </div>


                <div class="ride-detail">

                    <div class="ride-detail-label">
                        Vehicle
                    </div>

                    <div class="ride-detail-value">

                        ${escapeHtml(
                            ride?.vehicleNumber ||
                            "N/A"
                        )}

                    </div>

                </div>

            </div>


            <div class="ride-driver">

                <div class="driver-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>


                <div class="driver-info">

                    <span class="driver-name">

                        ${escapeHtml(
                            ride?.driverName ||
                            "Unknown Driver"
                        )}

                    </span>


                    <span class="driver-vehicle">

                        ${escapeHtml(
                            ride?.vehicleModel ||
                            "Vehicle"
                        )}

                    </span>

                </div>

            </div>

        `;


        /* =================================================
           CARD CLICK
           ================================================= */

        card.addEventListener(
            "click",
            function () {

                if (!ride?.id) {
                    return;
                }

                window.location.href =
                    `/rides/${ride.id}`;
            }
        );


        return card;
    }


    /* =====================================================
       PAGINATION
       ===================================================== */

    function renderPagination(
        page,
        totalPages,
        first,
        last
    ) {

        pagination.innerHTML = "";


        if (
            !totalPages ||
            totalPages <= 1
        ) {

            hidePagination();

            return;
        }


        pagination.classList.remove(
            "hidden"
        );


        /* ---------------------------------------------
           PREVIOUS
           --------------------------------------------- */

        const previousButton =
            createPaginationButton(
                '<i class="fa-solid fa-chevron-left"></i>',
                first,
                function () {

                    if (!first) {

                        loadRides(
                            page - 1
                        );
                    }
                }
            );


        previousButton.setAttribute(
            "aria-label",
            "Previous page"
        );


        pagination.appendChild(
            previousButton
        );


        /* ---------------------------------------------
           PAGE NUMBERS
           --------------------------------------------- */

        const maxVisiblePages = 5;


        let startPage =
            Math.max(
                0,
                page -
                Math.floor(
                    maxVisiblePages / 2
                )
            );


        let endPage =
            Math.min(
                totalPages,
                startPage + maxVisiblePages
            );


        /*
         * Re-adjust start when we're
         * near the final pages.
         */

        if (
            endPage - startPage <
            maxVisiblePages
        ) {

            startPage =
                Math.max(
                    0,
                    endPage -
                    maxVisiblePages
                );
        }


        for (
            let i = startPage;
            i < endPage;
            i++
        ) {

            const pageButton =
                document.createElement("button");


            pageButton.type =
                "button";


            pageButton.className =
                "pagination-button";


            if (i === page) {

                pageButton.classList.add(
                    "active"
                );

                pageButton.setAttribute(
                    "aria-current",
                    "page"
                );
            }


            pageButton.textContent =
                i + 1;


            pageButton.addEventListener(
                "click",
                function () {

                    if (
                        i !== page &&
                        !isLoading
                    ) {

                        loadRides(i);
                    }
                }
            );


            pagination.appendChild(
                pageButton
            );
        }


        /* ---------------------------------------------
           NEXT
           --------------------------------------------- */

        const nextButton =
            createPaginationButton(
                '<i class="fa-solid fa-chevron-right"></i>',
                last,
                function () {

                    if (!last) {

                        loadRides(
                            page + 1
                        );
                    }
                }
            );


        nextButton.setAttribute(
            "aria-label",
            "Next page"
        );


        pagination.appendChild(
            nextButton
        );
    }


    /* =====================================================
       CREATE PAGINATION BUTTON
       ===================================================== */

    function createPaginationButton(
        content,
        disabled,
        clickHandler
    ) {

        const button =
            document.createElement("button");


        button.type =
            "button";


        button.className =
            "pagination-button";


        button.innerHTML =
            content;


        button.disabled =
            disabled;


        button.addEventListener(
            "click",
            clickHandler
        );


        return button;
    }


    /* =====================================================
       FORMAT STATUS
       ===================================================== */

    function formatStatus(status) {

        if (!status) {
            return "Scheduled";
        }


        return String(status)
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                function (char) {

                    return char.toUpperCase();
                }
            );
    }


    /* =====================================================
       FORMAT DATE / TIME
       ===================================================== */

    function formatDateTime(dateTime) {

        if (!dateTime) {
            return "N/A";
        }


        const date =
            new Date(dateTime);


        if (
            isNaN(
                date.getTime()
            )
        ) {

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


    /* =====================================================
       FORMAT PRICE
       ===================================================== */

    function formatPrice(price) {

        if (
            price === null ||
            price === undefined ||
            price === ""
        ) {

            return "0.00";
        }


        const numericPrice =
            Number(price);


        if (
            Number.isNaN(
                numericPrice
            )
        ) {

            return "0.00";
        }


        return numericPrice.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    /* =====================================================
       SEARCH VALIDATION
       ===================================================== */

    function showSearchValidation() {

        if (!searchValidation) {
            return;
        }


        searchValidation.classList.remove(
            "hidden"
        );
    }


    function hideSearchValidation() {

        if (!searchValidation) {
            return;
        }


        searchValidation.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       SHOW LOADING
       ===================================================== */

    function showLoading() {

        hideAllStates();

        hidePagination();


        loadingState.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       SHOW EMPTY
       ===================================================== */

    function showEmpty() {

        hideAllStates();

        hidePagination();


        emptyState.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       SHOW ERROR
       ===================================================== */

    function showError(message) {

        hideAllStates();

        hidePagination();


        errorMessage.textContent =
            message;


        errorState.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       HIDE ERROR
       ===================================================== */

    function hideError() {

        errorState.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       HIDE PAGINATION
       ===================================================== */

    function hidePagination() {

        pagination.innerHTML = "";

        pagination.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       HIDE ALL STATES
       ===================================================== */

    function hideAllStates() {

        loadingState.classList.add(
            "hidden"
        );

        emptyState.classList.add(
            "hidden"
        );

        errorState.classList.add(
            "hidden"
        );

        ridesList.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(value) {

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

});
