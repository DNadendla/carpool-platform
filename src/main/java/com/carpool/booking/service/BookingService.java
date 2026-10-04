package com.carpool.booking.service;

import com.carpool.booking.dto.BookingCounts;
import com.carpool.booking.dto.BookingRejectionRequest;
import com.carpool.booking.dto.BookingRequest;
import com.carpool.booking.dto.BookingResponse;
import com.carpool.booking.dto.BookingStatusCount;
import com.carpool.booking.dto.DriverSummaryResponse;
import com.carpool.booking.dto.MyBookingsResponse;
import com.carpool.booking.dto.RideSummaryResponse;
import com.carpool.booking.dto.VehicleSummaryResponse;
import com.carpool.booking.entity.Booking;
import com.carpool.booking.exception.BookingNotAllowedException;
import com.carpool.booking.exception.InsufficientSeatsException;
import com.carpool.booking.repository.BookingRepository;
import com.carpool.exception.BusinessValidationException;
import com.carpool.exception.ConflictException;
import com.carpool.exception.DuplicateResourceException;
import com.carpool.exception.OperationNotAllowedException;
import com.carpool.exception.ResourceNotFoundException;
import com.carpool.ride.entity.Ride;
import com.carpool.ride.repository.RideRepository;
import com.carpool.security.service.AuthenticatedUserService;
import com.carpool.user.entity.User;
import com.carpool.vehicle.entity.Vehicle;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookingService {

  private final BookingRepository bookingRepository;
  private final RideRepository rideRepository;
  private final AuthenticatedUserService authenticatedUserService;

  public BookingService(
      BookingRepository bookingRepository,
      RideRepository rideRepository,
      AuthenticatedUserService authenticatedUserService) {

    this.bookingRepository = bookingRepository;
    this.rideRepository = rideRepository;
    this.authenticatedUserService = authenticatedUserService;
  }

  // =====================================================
  // CREATE BOOKING
  // =====================================================

  public BookingResponse createBooking(BookingRequest request) {

    User passenger = authenticatedUserService.getCurrentUser();

    Ride ride =
        rideRepository
            .findByIdForUpdate(request.getRideId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Ride not found with id: " + request.getRideId()));

    validateRideAvailableForBooking(ride);

    if (ride.getDriver().getId().equals(passenger.getId())) {
      throw new BookingNotAllowedException("Driver cannot book their own ride");
    }

    boolean alreadyBooked =
        bookingRepository.existsByRideIdAndPassengerIdAndStatusIn(
            ride.getId(),
            passenger.getId(),
            List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED));

    if (alreadyBooked) {
      throw new DuplicateResourceException(
          "Passenger already has an active booking request for this ride");
    }

    if (request.getSeats() > ride.getAvailableSeats()) {
      throw new InsufficientSeatsException(
          "Only " + ride.getAvailableSeats() + " seats are currently available");
    }

    /*
     * Phase #2 rule:
     * PENDING bookings do not consume seats.
     * Seats are reserved only when the driver approves the booking.
     */

    Booking booking =
        Booking.builder()
            .ride(ride)
            .passenger(passenger)
            .seats(request.getSeats())
            .status(Booking.BookingStatus.PENDING)
            .build();

    Booking savedBooking = bookingRepository.save(booking);

    return mapToResponse(savedBooking);
  }

  // =====================================================
  // APPROVE BOOKING
  // =====================================================

  public BookingResponse approveBooking(Long bookingId) {

    User driver = authenticatedUserService.getCurrentUser();

    // =====================================================
    // GET RIDE ID ONLY
    // Do NOT load Booking entity before locking.
    // =====================================================

    Long rideId =
        bookingRepository
            .findRideIdByBookingId(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =====================================================
    // LOCK ORDER: RIDE -> BOOKING
    // =====================================================

    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    Booking booking =
        bookingRepository
            .findByIdForUpdate(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =====================================================
    // DRIVER OWNERSHIP
    // =====================================================

    validateDriverOwnsRide(ride, driver);

    // =====================================================
    // RIDE STATUS
    // =====================================================

    validateBookingRideIsScheduled(ride);

    if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {

      throw new ConflictException("Cannot approve a booking after ride departure time");
    }

    // =====================================================
    // BOOKING STATUS
    // =====================================================

    if (booking.getStatus() != Booking.BookingStatus.PENDING) {

      throw new ConflictException(
          "Only pending bookings can be approved. " + "Current status: " + booking.getStatus());
    }

    // =====================================================
    // SEAT CHECK
    // =====================================================

    if (booking.getSeats() > ride.getAvailableSeats()) {

      throw new InsufficientSeatsException(
          "Only " + ride.getAvailableSeats() + " seats are available for approval");
    }

    // =====================================================
    // RESERVE SEATS
    // =====================================================

    ride.setAvailableSeats(ride.getAvailableSeats() - booking.getSeats());

    // =====================================================
    // CONFIRM BOOKING
    // =====================================================

    booking.setStatus(Booking.BookingStatus.CONFIRMED);

    booking.setRejectionReason(null);
    booking.setRejectedAt(null);

    Booking savedBooking = bookingRepository.save(booking);

    return mapToResponse(savedBooking);
  }

  // =====================================================
  // REJECT BOOKING
  // =====================================================

  public BookingResponse rejectBooking(Long bookingId, BookingRejectionRequest request) {

    User driver = authenticatedUserService.getCurrentUser();

    String reason = normalizeRejectionReason(request.getReason());

    // =====================================================
    // GET RIDE ID ONLY
    // =====================================================

    Long rideId =
        bookingRepository
            .findRideIdByBookingId(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =====================================================
    // LOCK ORDER: RIDE -> BOOKING
    // =====================================================

    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    Booking booking =
        bookingRepository
            .findByIdForUpdate(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =====================================================
    // DRIVER OWNERSHIP
    // =====================================================

    validateDriverOwnsRide(ride, driver);

    // =====================================================
    // RIDE STATUS
    // =====================================================

    validateBookingRideIsScheduled(ride);

    if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {

      throw new ConflictException("Cannot reject a booking after ride departure time");
    }

    // =====================================================
    // BOOKING STATUS
    // =====================================================

    if (booking.getStatus() != Booking.BookingStatus.PENDING) {

      throw new ConflictException(
          "Only pending bookings can be rejected. " + "Current status: " + booking.getStatus());
    }

    // =====================================================
    // REJECT
    // =====================================================

    booking.setStatus(Booking.BookingStatus.REJECTED);

    booking.setRejectionReason(reason);

    booking.setRejectedAt(LocalDateTime.now());

    Booking savedBooking = bookingRepository.save(booking);

    return mapToResponse(savedBooking);
  }

  // =====================================================
  // GET BOOKING BY ID
  // =====================================================

  @Transactional(readOnly = true)
  public BookingResponse getBookingById(Long id) {

    User currentUser = authenticatedUserService.getCurrentUser();

    Booking booking =
        bookingRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

    boolean isPassenger = booking.getPassenger().getId().equals(currentUser.getId());
    boolean isDriver = booking.getRide().getDriver().getId().equals(currentUser.getId());

    if (!isPassenger && !isDriver) {
      throw new BookingNotAllowedException("You are not allowed to view this booking");
    }

    return mapToResponse(booking);
  }

  // =====================================================
  // GET BOOKINGS BY RIDE
  // =====================================================

  @Transactional(readOnly = true)
  public List<BookingResponse> getBookingsByRide(Long rideId) {

    User currentUser = authenticatedUserService.getCurrentUser();

    Ride ride =
        rideRepository
            .findById(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    if (!ride.getDriver().getId().equals(currentUser.getId())) {
      throw new BookingNotAllowedException("You are not allowed to view bookings for this ride");
    }

    return bookingRepository.findByRideId(rideId).stream().map(this::mapToResponse).toList();
  }

  // =====================================================
  // CANCEL BOOKING
  // =====================================================

  public BookingResponse cancelBooking(Long bookingId) {

    User passenger = authenticatedUserService.getCurrentUser();

    // =====================================================
    // GET RIDE ID ONLY
    // Do NOT load Booking entity before locking.
    // =====================================================

    Long rideId =
        bookingRepository
            .findRideIdByBookingId(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =====================================================
    // LOCK ORDER: RIDE -> BOOKING
    // =====================================================

    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    Booking booking =
        bookingRepository
            .findByIdForUpdate(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =====================================================
    // PASSENGER OWNERSHIP
    // =====================================================

    if (!booking.getPassenger().getId().equals(passenger.getId())) {

      throw new BookingNotAllowedException("You are not allowed to cancel this booking");
    }

    // =====================================================
    // BOOKING STATUS
    // =====================================================

    if (booking.getStatus() != Booking.BookingStatus.PENDING
        && booking.getStatus() != Booking.BookingStatus.CONFIRMED) {

      throw new BookingNotAllowedException("Only pending or confirmed bookings can be cancelled");
    }

    // =====================================================
    // RIDE STATUS
    // =====================================================

    validateBookingRideIsScheduled(ride);

    if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {

      throw new BookingNotAllowedException("Cannot cancel a booking after ride departure");
    }

    // =====================================================
    // RESTORE SEATS ONLY FOR CONFIRMED BOOKING
    // =====================================================

    if (booking.getStatus() == Booking.BookingStatus.CONFIRMED) {

      ride.setAvailableSeats(ride.getAvailableSeats() + booking.getSeats());
    }

    // =====================================================
    // CANCEL BOOKING
    // =====================================================

    booking.setStatus(Booking.BookingStatus.CANCELLED);

    booking.setCancelledBy(Booking.CancellationActor.PASSENGER);

    booking.setCancellationReason(Booking.CancellationReason.PASSENGER_CANCELLED_BOOKING);

    booking.setCancelledAt(LocalDateTime.now());

    Booking savedBooking = bookingRepository.save(booking);

    return mapToResponse(savedBooking);
  }

  // =====================================================
  // RIDE -> BOOKING SYNCHRONIZATION
  // =====================================================

  /**
   * Cancels all active bookings belonging to a ride.
   *
   * <p>Both PENDING and CONFIRMED bookings are considered active. This method is called while the
   * ride row is already locked, and it locks the affected booking rows as well.
   *
   * <p>No seats are restored here because the entire ride has already become unavailable.
   */
  public void cancelActiveBookingsForRide(
      Long rideId,
      Booking.CancellationActor cancelledBy,
      Booking.CancellationReason cancellationReason,
      LocalDateTime cancelledAt) {

    List<Booking> activeBookings =
        bookingRepository.findByRideIdAndStatusInForUpdate(
            rideId, List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED));

    if (activeBookings.isEmpty()) {
      return;
    }

    for (Booking booking : activeBookings) {
      booking.setStatus(Booking.BookingStatus.CANCELLED);
      booking.setCancelledBy(cancelledBy);
      booking.setCancellationReason(cancellationReason);
      booking.setCancelledAt(cancelledAt);
    }

    bookingRepository.saveAll(activeBookings);
  }

  // =====================================================
  // GET MY BOOKINGS
  // =====================================================

  @Transactional(readOnly = true)
  public MyBookingsResponse getMyBookings(Booking.BookingStatus status, Pageable pageable) {

    User passenger = authenticatedUserService.getCurrentUser();

    int pageNumber = Math.max(pageable.getPageNumber(), 0);
    int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), 50);

    Pageable sortedPageable =
        PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "bookedAt"));

    Page<Booking> bookingPage;

    if (status == null) {
      bookingPage = bookingRepository.findByPassengerId(passenger.getId(), sortedPageable);
    } else {
      bookingPage =
          bookingRepository.findByPassengerIdAndStatus(passenger.getId(), status, sortedPageable);
    }

    List<BookingResponse> content =
        bookingPage.getContent().stream().map(this::mapToResponse).toList();

    BookingCounts counts = buildBookingCounts(passenger.getId());

    return MyBookingsResponse.builder()
        .content(content)
        .page(bookingPage.getNumber())
        .size(bookingPage.getSize())
        .totalElements(bookingPage.getTotalElements())
        .totalPages(bookingPage.getTotalPages())
        .first(bookingPage.isFirst())
        .last(bookingPage.isLast())
        .counts(counts)
        .build();
  }

  // =====================================================
  // PRIVATE VALIDATION HELPERS
  // =====================================================

  private void validateRideAvailableForBooking(Ride ride) {

    if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {
      throw new BookingNotAllowedException("Cannot book a ride after its departure time");
    }

    if (ride.getStatus() != Ride.RideStatus.SCHEDULED) {
      throw new ConflictException("Ride is not available for booking");
    }
  }

  private void validateBookingRideIsScheduled(Ride ride) {

    if (ride.getStatus() != Ride.RideStatus.SCHEDULED) {
      throw new ConflictException("Booking actions are allowed only while the ride is scheduled");
    }
  }

  private void validateDriverOwnsRide(Ride ride, User driver) {

    if (!ride.getDriver().getId().equals(driver.getId())) {
      throw new OperationNotAllowedException(
          "You are not authorized to manage bookings for this ride");
    }
  }

  private String normalizeRejectionReason(String reason) {

    String normalizedReason = reason == null ? "" : reason.trim();

    if (normalizedReason.isBlank()) {
      throw new BusinessValidationException("Rejection reason is required");
    }

    if (normalizedReason.length() > 500) {
      throw new BusinessValidationException("Rejection reason cannot exceed 500 characters");
    }

    return normalizedReason;
  }

  // =====================================================
  // BUILD BOOKING COUNTS
  // =====================================================

  private BookingCounts buildBookingCounts(Long passengerId) {

    List<BookingStatusCount> results =
        bookingRepository.countByPassengerGroupedByStatus(passengerId);

    long confirmed = 0;
    long pending = 0;
    long cancelled = 0;
    long rejected = 0;

    for (BookingStatusCount result : results) {

      if (result.getStatus() == null) {
        continue;
      }

      switch (result.getStatus()) {
        case CONFIRMED -> confirmed = result.getCount();
        case PENDING -> pending = result.getCount();
        case CANCELLED -> cancelled = result.getCount();
        case REJECTED -> rejected = result.getCount();
      }
    }

    long all = confirmed + pending + cancelled + rejected;

    return BookingCounts.builder()
        .all(all)
        .confirmed(confirmed)
        .pending(pending)
        .cancelled(cancelled)
        .rejected(rejected)
        .build();
  }

  // =====================================================
  // ENTITY -> RESPONSE
  // =====================================================

  private BookingResponse mapToResponse(Booking booking) {

    Ride ride = booking.getRide();
    User driver = ride.getDriver();
    User passenger = booking.getPassenger();
    Vehicle vehicle = ride.getVehicle();

    DriverSummaryResponse driverResponse =
        DriverSummaryResponse.builder().id(driver.getId()).name(driver.getName()).build();

    VehicleSummaryResponse vehicleResponse =
        VehicleSummaryResponse.builder()
            .id(vehicle.getId())
            .vehicleNumber(vehicle.getVehicleNumber())
            .model(vehicle.getModel())
            .type(vehicle.getType())
            .totalSeats(vehicle.getTotalSeats())
            .build();

    RideSummaryResponse rideResponse =
        RideSummaryResponse.builder()
            .id(ride.getId())
            .source(ride.getSource())
            .destination(ride.getDestination())
            .departureTime(ride.getDepartureTime())
            .availableSeats(ride.getAvailableSeats())
            .pricePerSeat(ride.getPricePerSeat())
            .status(ride.getStatus())
            .cancelledBy(ride.getCancelledBy())
            .cancelledAt(ride.getCancelledAt())
            .driver(driverResponse)
            .vehicle(vehicleResponse)
            .build();

    BigDecimal totalAmount =
        ride.getPricePerSeat().multiply(BigDecimal.valueOf(booking.getSeats()));

    return BookingResponse.builder()
        .id(booking.getId())
        .ride(rideResponse)
        .seats(booking.getSeats())
        .totalAmount(totalAmount)
        .status(booking.getStatus())
        .bookedAt(booking.getBookedAt())
        .rejectionReason(booking.getRejectionReason())
        .rejectedAt(booking.getRejectedAt())
        .cancelledBy(booking.getCancelledBy())
        .cancellationReason(booking.getCancellationReason())
        .cancelledAt(booking.getCancelledAt())
        .passengerId(passenger.getId())
        .passengerName(passenger.getName())
        .passengerEmail(passenger.getEmail())
        .passengerPhone(passenger.getPhone())
        .build();
  }
}
