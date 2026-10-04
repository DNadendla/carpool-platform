/* =====================================================
   BOOKING REQUESTS PAGE
===================================================== */

const BookingRequestsPage = {

    rideId: null,
    ride: null,
    bookings: [],
    currentStatus: "ALL",
    pendingAction: null,


    /* =====================================================
       INIT
    ===================================================== */

    async init() {

        this.cacheElements();
        this.rideId = this.getRideIdFromUrl();
        this.bindEvents();

        if (!this.rideId) {
            this.showError(
                "Invalid ride. The ride id is missing from the URL."
            );
            this.hideLoading();
            return;
        }

        await this.loadPage();
    },


    /* =====================================================
       CACHE
    ===================================================== */

    cacheElements() {

        this.loading = document.getElementById("loading");
        this.errorMessage = document.getElementById("errorMessage");
        this.errorText = document.getElementById("errorText");
        this.retryButton = document.getElementById("retryButton");
        this.refreshButton = document.getElementById("refreshButton");
        this.viewRideButton = document.getElementById("viewRideButton");

        this.rideSummary = document.getElementById("rideSummary");
        this.rideRouteTitle = document.getElementById("rideRouteTitle");
        this.rideRouteSubtext = document.getElementById("rideRouteSubtext");
        this.rideStatusBadge = document.getElementById("rideStatusBadge");
        this.rideDeparture = document.getElementById("rideDeparture");
        this.rideAvailableSeats = document.getElementById("rideAvailableSeats");
        this.ridePricePerSeat = document.getElementById("ridePricePerSeat");
        this.rideRequestCount = document.getElementById("rideRequestCount");

        this.requestsContent = document.getElementById("requestsContent");
        this.requestFilters = document.getElementById("requestFilters");
        this.requestsContainer = document.getElementById("requestsContainer");
        this.emptyState = document.getElementById("emptyState");
        this.emptyStateTitle = document.getElementById("emptyStateTitle");
        this.emptyStateDescription = document.getElementById("emptyStateDescription");

        this.successMessage = document.getElementById("successMessage");
        this.successText = document.getElementById("successText");

        this.countAll = document.getElementById("countAll");
        this.countPending = document.getElementById("countPending");
        this.countConfirmed = document.getElementById("countConfirmed");
        this.countRejected = document.getElementById("countRejected");
        this.countCancelled = document.getElementById("countCancelled");

        this.approveModal = document.getElementById("approveModal");
        this.closeApproveModalButton = document.getElementById("closeApproveModalButton");
        this.confirmApproveButton = document.getElementById("confirmApproveButton");
        this.approvePassengerName = document.getElementById("approvePassengerName");
        this.approveSeatCount = document.getElementById("approveSeatCount");
        this.approveErrorMessage = document.getElementById("approveErrorMessage");
        this.approveErrorText = document.getElementById("approveErrorText");

        this.rejectModal = document.getElementById("rejectModal");
        this.closeRejectModalButton = document.getElementById("closeRejectModalButton");
        this.confirmRejectButton = document.getElementById("confirmRejectButton");
        this.rejectionReason = document.getElementById("rejectionReason");
        this.rejectionReasonError = document.getElementById("rejectionReasonError");
        this.rejectionReasonCount = document.getElementById("rejectionReasonCount");
    },


    /* =====================================================
       EVENTS
    ===================================================== */

    bindEvents() {

        this.retryButton?.addEventListener(
            "click",
            () => this.loadPage()
        );

        this.refreshButton?.addEventListener(
            "click",
            () => this.refreshPage()
        );

        this.viewRideButton?.addEventListener(
            "click",
            () => {
                if (this.rideId) {
                    window.location.href =
                        "/rides/" + encodeURIComponent(this.rideId);
                }
            }
        );

        this.requestFilters?.addEventListener(
            "click",
            (event) => {
                const button = event.target.closest("[data-status]");

                if (!button) {
                    return;
                }

                this.currentStatus = button.dataset.status || "ALL";
                this.updateActiveFilter(button);
                this.renderRequests();
            }
        );

        this.confirmApproveButton?.addEventListener(
            "click",
            () => this.approveBooking()
        );

        this.closeApproveModalButton?.addEventListener(
            "click",
            () => this.closeApproveModal()
        );

        this.approveModal?.addEventListener(
            "click",
            (event) => {
                if (event.target.dataset.modalClose === "true") {
                    this.closeApproveModal();
                }
            }
        );

        this.confirmRejectButton?.addEventListener(
            "click",
            () => this.rejectBooking()
        );

        this.closeRejectModalButton?.addEventListener(
            "click",
            () => this.closeRejectModal()
        );

        this.rejectModal?.addEventListener(
            "click",
            (event) => {
                if (event.target.dataset.modalClose === "true") {
                    this.closeRejectModal();
                }
            }
        );

        this.rejectionReason?.addEventListener(
            "input",
            () => this.updateRejectionCounter()
        );

        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    this.closeApproveModal();
                    this.closeRejectModal();
                }
            }
        );
    },


    /* =====================================================
       LOAD
    ===================================================== */

    async loadPage() {

        this.showLoading();
        this.hideError();
        this.hideSuccess();

        try {

            const [rideResponse, bookingsResponse] =
                await Promise.all([
                    API.get(
                        "/api/rides/" + encodeURIComponent(this.rideId)
                    ),
                    API.get(
                        "/api/bookings/ride/" + encodeURIComponent(this.rideId)
                    )
                ]);

            if (!rideResponse || !bookingsResponse) {
                return;
            }

            if (!rideResponse.ok) {
                throw new Error(
                    await this.extractErrorMessage(
                        rideResponse,
                        "Unable to load the ride."
                    )
                );
            }

            if (!bookingsResponse.ok) {
                throw new Error(
                    await this.extractErrorMessage(
                        bookingsResponse,
                        "Unable to load booking requests."
                    )
                );
            }

            this.ride = await rideResponse.json();
            this.bookings = await bookingsResponse.json();

            if (!Array.isArray(this.bookings)) {
                this.bookings = [];
            }

            this.sortBookings();
            this.renderRideSummary();
            this.updateCounts();
            this.renderRequests();

            this.rideSummary?.classList.remove("hidden");
            this.requestsContent?.classList.remove("hidden");

        } catch (error) {

            console.error("Booking requests error:", error);

            this.showError(
                error.message ||
                "Unable to load booking requests."
            );

        } finally {
            this.hideLoading();
        }
    },


    async refreshPage() {

        if (this.refreshButton) {
            this.refreshButton.disabled = true;
            this.refreshButton.innerHTML =
                '<i class="fa-solid fa-rotate-right fa-spin"></i>';
        }

        try {
            await this.loadPage();
        } finally {
            if (this.refreshButton) {
                this.refreshButton.disabled = false;
                this.refreshButton.innerHTML =
                    '<i class="fa-solid fa-rotate-right"></i>';
            }
        }
    },


    sortBookings() {

        const priority = {
            PENDING: 0,
            CONFIRMED: 1,
            REJECTED: 2,
            CANCELLED: 3
        };

        this.bookings.sort((a, b) => {
            const statusDiff =
                (priority[a.status] ?? 99) -
                (priority[b.status] ?? 99);

            if (statusDiff !== 0) {
                return statusDiff;
            }

            const dateA =
                new Date(a.bookedAt || 0).getTime();
            const dateB =
                new Date(b.bookedAt || 0).getTime();

            return dateB - dateA;
        });
    },


    /* =====================================================
       RIDE SUMMARY
    ===================================================== */

    renderRideSummary() {

        const ride = this.ride || {};

        this.rideRouteTitle.textContent =
            (ride.source || "-") +
            " → " +
            (ride.destination || "-");

        this.rideRouteSubtext.textContent =
            "Ride #" +
            (ride.id ?? this.rideId) +
            " · Review and manage passenger bookings";

        this.rideStatusBadge.textContent =
            this.formatStatus(ride.status);

        this.rideDeparture.textContent =
            this.formatDateTime(ride.departureTime);

        this.rideAvailableSeats.textContent =
            String(ride.availableSeats ?? "-");

        this.ridePricePerSeat.textContent =
            this.formatAmount(ride.pricePerSeat);

        this.rideRequestCount.textContent =
            String(this.bookings.length);
    },


    /* =====================================================
       COUNTS
    ===================================================== */

    updateCounts() {

        const counts = {
            ALL: 0,
            PENDING: 0,
            CONFIRMED: 0,
            REJECTED: 0,
            CANCELLED: 0
        };

        this.bookings.forEach((booking) => {
            counts.ALL += 1;

            if (Object.prototype.hasOwnProperty.call(counts, booking.status)) {
                counts[booking.status] += 1;
            }
        });

        this.countAll.textContent = String(counts.ALL);
        this.countPending.textContent = String(counts.PENDING);
        this.countConfirmed.textContent = String(counts.CONFIRMED);
        this.countRejected.textContent = String(counts.REJECTED);
        this.countCancelled.textContent = String(counts.CANCELLED);
    },


    /* =====================================================
       RENDER
    ===================================================== */

    renderRequests() {

        const filtered =
            this.currentStatus === "ALL"
                ? this.bookings
                : this.bookings.filter(
                      (booking) =>
                          booking.status === this.currentStatus
                  );

        this.requestsContainer.innerHTML = "";

        if (!filtered.length) {
            this.requestsContainer.classList.add("hidden");
            this.emptyState.classList.remove("hidden");
            this.updateEmptyStateCopy();
            return;
        }

        this.emptyState.classList.add("hidden");
        this.requestsContainer.classList.remove("hidden");

        filtered.forEach((booking) => {
            this.requestsContainer.appendChild(
                this.createBookingCard(booking)
            );
        });
    },


    createBookingCard(booking) {

        const card = document.createElement("article");
        const status = booking.status || "UNKNOWN";
        const statusClass = status.toLowerCase();
        const isPending = status === "PENDING";

        const passenger =
            booking.passenger ||
            {};

        const passengerName =
            booking.passengerName ||
            passenger.name ||
            "Passenger";

        const passengerId =
            booking.passengerId ??
            passenger.id ??
            null;

        const passengerEmail =
            booking.passengerEmail ||
            passenger.email ||
            "";

        const passengerPhone =
            booking.passengerPhone ||
            passenger.phone ||
            "";

        const requestTime =
            booking.bookedAt ||
            booking.requestedAt ||
            null;

        const totalAmount =
            Number(booking.totalAmount || 0);

        const rejectionReason =
            booking.rejectionReason ||
            "No rejection reason provided.";

        const cancellationReason =
            this.formatCancellationReason(
                booking.cancellationReason
            );

        const cancellationActor =
            this.formatCancellationActor(
                booking.cancelledBy
            );

        const statusMessage =
            this.getStatusMessage(booking);

        const initials =
            this.getInitials(passengerName);

        card.className =
            "br-request-card " + statusClass;

        card.innerHTML = `

            <div class="br-request-head">

                <div class="br-request-ref">
                    BOOKING <strong>#${this.escapeHtml(booking.id)}</strong>
                </div>

                <span class="br-request-status ${this.escapeHtml(statusClass)}">
                    ${this.escapeHtml(this.formatStatus(status))}
                </span>

            </div>


            <div class="br-passenger-section">

                <div class="br-passenger-main">

                    <div class="br-avatar">
                        ${this.escapeHtml(initials)}
                    </div>

                    <div class="br-passenger-copy">

                        <span class="br-passenger-name">
                            ${this.escapeHtml(passengerName)}
                        </span>

                        <div class="br-passenger-meta">
                            <span>
                                Passenger
                            </span>
                            ${
                                passengerId !== null &&
                                passengerId !== undefined
                                    ? `
                                        <span>
                                            User #${this.escapeHtml(passengerId)}
                                        </span>
                                      `
                                    : ""
                            }
                        </div>

                        <div class="br-passenger-contact">
                            ${
                                passengerEmail
                                    ? `
                                        <span>
                                            <i class="fa-regular fa-envelope"></i>
                                            ${this.escapeHtml(passengerEmail)}
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                passengerPhone
                                    ? `
                                        <span>
                                            <i class="fa-solid fa-phone"></i>
                                            ${this.escapeHtml(passengerPhone)}
                                        </span>
                                      `
                                    : ""
                            }
                        </div>

                    </div>

                </div>

                <div class="br-requested-time">
                    <span>REQUESTED</span>
                    <strong>
                        ${this.escapeHtml(
                            this.formatDateTime(requestTime)
                        )}
                    </strong>
                </div>

            </div>


            <div class="br-request-grid">

                <div class="br-request-metric">
                    <span>SEATS REQUESTED</span>
                    <strong>${this.escapeHtml(booking.seats ?? "-")}</strong>
                </div>

                <div class="br-request-metric">
                    <span>TOTAL FARE</span>
                    <strong>
                        ${this.escapeHtml(
                            this.formatAmount(totalAmount)
                        )}
                    </strong>
                </div>

                <div class="br-request-metric">
                    <span>REQUEST STATUS</span>
                    <strong>
                        ${this.escapeHtml(
                            this.formatStatus(status)
                        )}
                    </strong>
                </div>

            </div>


            ${
                status === "REJECTED"
                    ? `
                        <div class="br-request-note">
                            <span class="br-request-note-label">
                                REJECTION REASON
                            </span>
                            <p>${this.escapeHtml(rejectionReason)}</p>
                        </div>
                      `
                    : ""
            }

            ${
                status === "CANCELLED"
                    ? `
                        <div class="br-request-note">
                            <span class="br-request-note-label">
                                CANCELLATION
                            </span>
                            <p>
                                ${this.escapeHtml(cancellationReason)}
                                ${
                                    cancellationActor
                                        ? " · " +
                                          this.escapeHtml(cancellationActor)
                                        : ""
                                }
                            </p>
                        </div>
                      `
                    : ""
            }


            <div class="br-request-footer">

                <div class="br-request-state-copy">
                    ${this.escapeHtml(statusMessage)}
                </div>

                <div class="br-request-actions">

                    ${
                        isPending
                            ? `
                                <button
                                    type="button"
                                    class="br-action-button reject"
                                    data-action="reject"
                                    data-booking-id="${this.escapeHtml(booking.id)}">
                                    <i class="fa-solid fa-ban"></i>
                                    Reject
                                </button>

                                <button
                                    type="button"
                                    class="br-action-button approve"
                                    data-action="approve"
                                    data-booking-id="${this.escapeHtml(booking.id)}">
                                    <i class="fa-solid fa-check"></i>
                                    Approve
                                </button>
                              `
                            : ""
                    }

                </div>

            </div>
        `;

        card.querySelector('[data-action="approve"]')?.addEventListener(
            "click",
            () => this.openApproveModal(booking)
        );

        card.querySelector('[data-action="reject"]')?.addEventListener(
            "click",
            () => this.openRejectModal(booking)
        );

        return card;
    },


    /* =====================================================
       APPROVE
    ===================================================== */

    openApproveModal(booking) {

        this.pendingAction = {
            bookingId: booking.id
        };

        this.approvePassengerName.textContent =
            booking.passengerName ||
            booking.passenger?.name ||
            "Passenger";

        this.approveSeatCount.textContent =
            String(booking.seats || 0);

        this.hideApproveError();

        this.approveModal.classList.remove("hidden");
        this.approveModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    },


    closeApproveModal() {

        this.approveModal?.classList.add("hidden");
        this.approveModal?.setAttribute("aria-hidden", "true");
        this.pendingAction = null;
        this.hideApproveError();

        if (this.confirmApproveButton) {
            this.confirmApproveButton.disabled = false;
            this.confirmApproveButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Approve Booking';
        }

        this.syncBodyModalState();
    },


    async approveBooking() {

        if (!this.pendingAction?.bookingId) {
            return;
        }

        const bookingId = this.pendingAction.bookingId;

        this.confirmApproveButton.disabled = true;
        this.confirmApproveButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Approving...';

        try {

            const response =
                await API.patch(
                    "/api/bookings/" +
                    encodeURIComponent(bookingId) +
                    "/approve"
                );

            if (!response) {
                throw new Error(
                    "Unable to contact the server while approving this booking."
                );
            }

            if (!response.ok) {
                throw new Error(
                    await this.extractErrorMessage(
                        response,
                        "Unable to approve this booking."
                    )
                );
            }

            this.closeApproveModal();
            await this.loadPage();
            this.showSuccess(
                "Booking #" +
                bookingId +
                " was approved successfully."
            );

        } catch (error) {

            console.error("Approve booking error:", error);

            this.confirmApproveButton.disabled = false;
            this.confirmApproveButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Approve Booking';

            this.showApproveError(
                error.message ||
                "Unable to approve this booking."
            );
        }
    },


    /* =====================================================
       REJECT
    ===================================================== */

    openRejectModal(booking) {

        this.pendingAction = {
            bookingId: booking.id
        };

        this.rejectionReason.value = "";
        this.rejectionReasonError.textContent = "";
        this.updateRejectionCounter();

        this.rejectModal.classList.remove("hidden");
        this.rejectModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        window.setTimeout(
            () => this.rejectionReason?.focus(),
            50
        );
    },


    closeRejectModal() {

        this.rejectModal?.classList.add("hidden");
        this.rejectModal?.setAttribute("aria-hidden", "true");
        this.pendingAction = null;

        if (this.confirmRejectButton) {
            this.confirmRejectButton.disabled = false;
            this.confirmRejectButton.innerHTML =
                '<i class="fa-solid fa-ban"></i> Reject Booking';
        }

        this.syncBodyModalState();
    },


    updateRejectionCounter() {

        const length =
            this.rejectionReason?.value?.length || 0;

        if (this.rejectionReasonCount) {
            this.rejectionReasonCount.textContent =
                length + " / 500";
        }
    },


    async rejectBooking() {

        if (!this.pendingAction?.bookingId) {
            return;
        }

        const bookingId = this.pendingAction.bookingId;
        const reason =
            String(this.rejectionReason.value || "").trim();

        if (!reason) {
            this.rejectionReasonError.textContent =
                "Rejection reason is required.";
            this.rejectionReason.focus();
            return;
        }

        if (reason.length > 500) {
            this.rejectionReasonError.textContent =
                "Rejection reason cannot exceed 500 characters.";
            return;
        }

        this.rejectionReasonError.textContent = "";
        this.confirmRejectButton.disabled = true;
        this.confirmRejectButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Rejecting...';

        try {

            const response =
                await API.patch(
                    "/api/bookings/" +
                    encodeURIComponent(bookingId) +
                    "/reject",
                    { reason: reason }
                );

            if (!response) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    await this.extractErrorMessage(
                        response,
                        "Unable to reject this booking."
                    )
                );
            }

            this.closeRejectModal();
            await this.loadPage();
            this.showSuccess(
                "Booking #" +
                bookingId +
                " was rejected."
            );

        } catch (error) {

            console.error("Reject booking error:", error);

            this.confirmRejectButton.disabled = false;
            this.confirmRejectButton.innerHTML =
                '<i class="fa-solid fa-ban"></i> Reject Booking';

            this.rejectionReasonError.textContent =
                error.message ||
                "Unable to reject this booking.";
        }
    },


    /* =====================================================
       HELPERS
    ===================================================== */

    getRideIdFromUrl() {

        const path =
            window.location.pathname || "";

        const match =
            path.match(/^\/rides\/(\d+)\/booking-requests\/?$/);

        return match ? match[1] : null;
    },


    updateActiveFilter(activeButton) {

        const buttons =
            this.requestFilters.querySelectorAll("[data-status]");

        buttons.forEach((button) => {
            const active = button === activeButton;
            button.classList.toggle("active", active);
            button.setAttribute(
                "aria-selected",
                active ? "true" : "false"
            );
        });
    },


    updateEmptyStateCopy() {

        const labels = {
            ALL: [
                "No booking requests",
                "There are no booking requests for this ride yet."
            ],
            PENDING: [
                "No pending requests",
                "There are no passengers waiting for your decision."
            ],
            CONFIRMED: [
                "No confirmed bookings",
                "No requests have been approved for this ride yet."
            ],
            REJECTED: [
                "No rejected requests",
                "No passenger requests have been rejected."
            ],
            CANCELLED: [
                "No cancelled bookings",
                "No booking requests have been cancelled."
            ]
        };

        const [title, description] =
            labels[this.currentStatus] || labels.ALL;

        this.emptyStateTitle.textContent = title;
        this.emptyStateDescription.textContent = description;
    },


    getStatusMessage(booking) {

        switch (booking.status) {
            case "PENDING":
                return "Waiting for your decision.";

            case "CONFIRMED":
                return "Booking approved and seats reserved.";

            case "REJECTED":
                return booking.rejectedAt
                    ? "Rejected on " + this.formatDateTime(booking.rejectedAt) + "."
                    : "Booking request was rejected.";

            case "CANCELLED":
                return booking.cancelledAt
                    ? "Cancelled on " + this.formatDateTime(booking.cancelledAt) + "."
                    : "Booking request was cancelled.";

            default:
                return "";
        }
    },


    getInitials(name) {

        const parts =
            String(name || "Passenger")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (!parts.length) {
            return "P";
        }

        return parts
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    },


    formatStatus(status) {

        if (!status) {
            return "Unknown";
        }

        return String(status)
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    },


    formatDateTime(value) {

        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
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
    },


    formatAmount(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "₹0.00";
        }

        return number.toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    },


    formatCancellationReason(reason) {

        if (!reason) {
            return "Booking cancelled.";
        }

        return String(reason)
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    },


    formatCancellationActor(actor) {

        if (!actor) {
            return "";
        }

        return String(actor)
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    },


    async extractErrorMessage(response, fallback) {

        try {
            const data = await response.json();

            return data.message || fallback;
        } catch (error) {
            return fallback;
        }
    },


    escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },


    syncBodyModalState() {

        const approveOpen =
            !this.approveModal?.classList.contains("hidden");

        const rejectOpen =
            !this.rejectModal?.classList.contains("hidden");

        document.body.classList.toggle(
            "modal-open",
            approveOpen || rejectOpen
        );
    },


    /* =====================================================
       APPROVE MODAL ERROR
    ===================================================== */

    showApproveError(message) {
        if (!this.approveErrorMessage || !this.approveErrorText) {
            this.showError(message);
            return;
        }

        this.approveErrorText.textContent = message;
        this.approveErrorMessage.classList.remove("hidden");
    },


    hideApproveError() {
        this.approveErrorMessage?.classList.add("hidden");
        if (this.approveErrorText) {
            this.approveErrorText.textContent = "";
        }
    },


    /* =====================================================
       UI STATES
    ===================================================== */

    showLoading() {
        this.loading?.classList.remove("hidden");
    },

    hideLoading() {
        this.loading?.classList.add("hidden");
    },

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove("hidden");
    },

    hideError() {
        this.errorMessage.classList.add("hidden");
    },

    showSuccess(message) {
        this.successText.textContent = message;
        this.successMessage.classList.remove("hidden");

        window.clearTimeout(this.successTimer);

        this.successTimer =
            window.setTimeout(
                () => this.hideSuccess(),
                3500
            );
    },

    hideSuccess() {
        this.successMessage?.classList.add("hidden");
    }
};


document.addEventListener(
    "DOMContentLoaded",
    () => BookingRequestsPage.init()
);
