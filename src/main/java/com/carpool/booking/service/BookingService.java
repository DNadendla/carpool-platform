package com.carpool.booking.service;

import com.carpool.booking.dto.BookingCounts;
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
import com.carpool.exception.DuplicateResourceException;
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

  public BookingResponse createBooking(BookingRequest request) {

    // 1. Find passenger
    User passenger = authenticatedUserService.getCurrentUser();

    // 2. LOCK the ride
    Ride ride =
        rideRepository
            .findByIdForUpdate(request.getRideId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Ride not found with id: " + request.getRideId()));

    if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {
      throw new BookingNotAllowedException("Cannot book a ride after its departure time");
    }

    // 3. Check ride status
    if (ride.getStatus() != Ride.RideStatus.SCHEDULED) {

      throw new IllegalStateException("Ride is not available for booking");
    }

    // 4. Driver cannot book own ride
    if (ride.getDriver().getId().equals(passenger.getId())) {

      throw new IllegalArgumentException("Driver cannot book their own ride");
    }

    // 5. Check duplicate booking
    boolean alreadyBooked =
        bookingRepository.existsByRideIdAndPassengerIdAndStatus(
            ride.getId(), passenger.getId(), Booking.BookingStatus.CONFIRMED);

    if (alreadyBooked) {

      throw new DuplicateResourceException("Passenger already booked this ride");
    }

    // 6. Check available seats
    if (request.getSeats() > ride.getAvailableSeats()) {

      throw new InsufficientSeatsException(
          "Only " + ride.getAvailableSeats() + " seats are available");
    }

    // 7. Reduce seats
    ride.setAvailableSeats(ride.getAvailableSeats() - request.getSeats());

    // 8. Create booking
    Booking booking =
        Booking.builder()
            .ride(ride)
            .passenger(passenger)
            .seats(request.getSeats())
            .status(Booking.BookingStatus.CONFIRMED)
            .build();

    // 9. Save
    Booking savedBooking = bookingRepository.save(booking);

    return mapToResponse(savedBooking);
  }

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

  public BookingResponse cancelBooking(Long bookingId) {
    User passenger = authenticatedUserService.getCurrentUser();

    // First read booking to determine the ride
    Booking existingBooking =
        bookingRepository
            .findById(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    Long rideId = existingBooking.getRide().getId();

    // =========================
    // LOCK RIDE FIRST
    // =========================

    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    // =========================
    // THEN LOCK BOOKING
    // =========================

    Booking booking =
        bookingRepository
            .findByIdForUpdate(bookingId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

    // =========================
    // OWNERSHIP CHECK
    // =========================

    if (!booking.getPassenger().getId().equals(passenger.getId())) {

      throw new BookingNotAllowedException("You are not allowed to cancel this booking");
    }

    // =========================
    // STATUS CHECK
    // =========================

    if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {

      throw new BookingNotAllowedException("Only confirmed bookings can be cancelled");
    }

    // =========================
    // DEPARTURE CHECK
    // =========================

    if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {

      throw new BookingNotAllowedException("Cannot cancel a booking after ride departure");
    }

    // =========================
    // RESTORE SEATS
    // =========================

    ride.setAvailableSeats(ride.getAvailableSeats() + booking.getSeats());

    // =========================
    // CANCEL BOOKING
    // =========================

    booking.setStatus(Booking.BookingStatus.CANCELLED);
    booking.setCancelledBy(Booking.CancellationActor.PASSENGER);
    booking.setCancellationReason(Booking.CancellationReason.PASSENGER_CANCELLED_BOOKING);
    booking.setCancelledAt(LocalDateTime.now());
    Booking savedBooking = bookingRepository.save(booking);

    return mapToResponse(savedBooking);
  }

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
        case CONFIRMED:
          confirmed = result.getCount();
          break;

        case PENDING:
          pending = result.getCount();
          break;

        case CANCELLED:
          cancelled = result.getCount();
          break;

        case REJECTED:
          rejected = result.getCount();
          break;
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

  private BookingResponse mapToResponse(Booking booking) {
    Ride ride = booking.getRide();
    User driver = ride.getDriver();
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
        .cancelledBy(booking.getCancelledBy())
        .cancellationReason(booking.getCancellationReason())
        .cancelledAt(booking.getCancelledAt())
        .bookedAt(booking.getBookedAt())
        .build();
  }
}
