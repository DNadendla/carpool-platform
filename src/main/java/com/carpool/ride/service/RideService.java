package com.carpool.ride.service;

import com.carpool.booking.entity.Booking;
import com.carpool.booking.service.BookingService;
import com.carpool.exception.BusinessValidationException;
import com.carpool.exception.ConflictException;
import com.carpool.exception.OperationNotAllowedException;
import com.carpool.exception.ResourceNotFoundException;
import com.carpool.ride.dto.RideCountsResponse;
import com.carpool.ride.dto.RidePageResponse;
import com.carpool.ride.dto.RideRequest;
import com.carpool.ride.dto.RideResponse;
import com.carpool.ride.dto.RideSearchRequest;
import com.carpool.ride.entity.Ride;
import com.carpool.ride.repository.RideRepository;
import com.carpool.security.service.AuthenticatedUserService;
import com.carpool.user.entity.User;
import com.carpool.vehicle.entity.Vehicle;
import com.carpool.vehicle.repository.VehicleRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RideService {

  private final RideRepository rideRepository;

  private final VehicleRepository vehicleRepository;

  private final BookingService bookingService;

  private final AuthenticatedUserService authenticatedUserService;

  /*
   * Grace period after scheduled departure time.
   *
   * Example:
   * departureTime = 10:00
   * grace period   = 15 minutes
   * expiry         = 10:15
   */
  @Value("${carpool.ride.start-grace-period-minutes:15}")
  private long startGracePeriodMinutes;

  public RideService(
      RideRepository rideRepository,
      VehicleRepository vehicleRepository,
      BookingService bookingService,
      AuthenticatedUserService authenticatedUserService) {

    this.rideRepository = rideRepository;
    this.vehicleRepository = vehicleRepository;
    this.bookingService = bookingService;
    this.authenticatedUserService = authenticatedUserService;
  }

  // =====================================================
  // CREATE RIDE
  // =====================================================

  public RideResponse createRide(RideRequest request) {

    User driver = authenticatedUserService.getCurrentUser();

    Vehicle vehicle =
        vehicleRepository
            .findById(request.getVehicleId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Vehicle not found with id: " + request.getVehicleId()));

    // Verify vehicle ownership

    if (!vehicle.getOwner().getId().equals(driver.getId())) {

      throw new OperationNotAllowedException("Vehicle does not belong to the authenticated user");
    }

    // Validate available seats

    if (request.getAvailableSeats() > vehicle.getTotalSeats()) {

      throw new BusinessValidationException("Available seats cannot exceed vehicle capacity");
    }

    // Validate route

    if (request.getSource().trim().equalsIgnoreCase(request.getDestination().trim())) {

      throw new BusinessValidationException("Source and destination cannot be the same");
    }

    Ride ride =
        Ride.builder()
            .driver(driver)
            .vehicle(vehicle)
            .source(request.getSource().trim())
            .destination(request.getDestination().trim())
            .departureTime(request.getDepartureTime())
            .availableSeats(request.getAvailableSeats())
            .sourceLatitude(request.getSourceLatitude())
            .sourceLongitude(request.getSourceLongitude())
            .destinationLatitude(request.getDestinationLatitude())
            .destinationLongitude(request.getDestinationLongitude())
            .pricePerSeat(request.getPricePerSeat())
            .status(Ride.RideStatus.SCHEDULED)
            .build();

    Ride savedRide = rideRepository.save(ride);

    return mapToResponse(savedRide);
  }

  // =====================================================
  // GET RIDE BY ID
  // =====================================================

  @Transactional(readOnly = true)
  public RideResponse getRideById(Long id) {

    Ride ride =
        rideRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + id));

    return mapToResponse(ride);
  }

  // =====================================================
  // GET ALL RIDES
  // =====================================================

  @Transactional(readOnly = true)
  public List<RideResponse> getAllRides() {

    return rideRepository.findAll().stream().map(this::mapToResponse).toList();
  }

  // =====================================================
  // GET AVAILABLE RIDES - PAGINATED
  // =====================================================

  @Transactional(readOnly = true)
  public RidePageResponse getAvailableRides(Pageable pageable) {

    Pageable sortedPageable = buildRidePageable(pageable);

    Page<Ride> ridePage =
        rideRepository
            .findByStatusAndDepartureTimeAfterAndAvailableSeatsGreaterThanOrderByDepartureTimeAsc(
                Ride.RideStatus.SCHEDULED, LocalDateTime.now(), 0, sortedPageable);

    return mapToPageResponse(ridePage);
  }

  // =====================================================
  // GET MY RIDES - PAGINATED
  // =====================================================

  @Transactional(readOnly = true)
  public RidePageResponse getMyRides(Ride.RideStatus status, Pageable pageable) {

    Long driverId = authenticatedUserService.getCurrentUserId();

    Pageable sortedPageable = buildRidePageable(pageable);

    Page<Ride> ridePage;

    if (status == null) {

      ridePage = rideRepository.findByDriverId(driverId, sortedPageable);

    } else {

      ridePage = rideRepository.findByDriverIdAndStatus(driverId, status, sortedPageable);
    }

    RideCountsResponse counts = buildRideCounts(driverId);

    return mapToPageResponse(ridePage, counts);
  }

  // =====================================================
  // SEARCH AVAILABLE RIDES - PAGINATED
  // =====================================================

  @Transactional(readOnly = true)
  public RidePageResponse searchRides(String source, String destination, Pageable pageable) {

    String normalizedSource = source == null ? "" : source.trim();

    String normalizedDestination = destination == null ? "" : destination.trim();

    if (normalizedSource.isBlank() || normalizedDestination.isBlank()) {

      throw new BusinessValidationException("Source and destination are required");
    }

    if (normalizedSource.equalsIgnoreCase(normalizedDestination)) {

      throw new BusinessValidationException("Source and destination cannot be the same");
    }

    Pageable sortedPageable = buildRidePageable(pageable);

    Page<Ride> ridePage =
        rideRepository
            .findByStatusAndDepartureTimeAfterAndAvailableSeatsGreaterThanAndSourceIgnoreCaseAndDestinationIgnoreCaseOrderByDepartureTimeAsc(
                Ride.RideStatus.SCHEDULED,
                LocalDateTime.now(),
                0,
                normalizedSource,
                normalizedDestination,
                sortedPageable);

    return mapToPageResponse(ridePage);
  }

  public RidePageResponse searchRides(RideSearchRequest request, Pageable pageable) {

    validateSearchRequest(request);

    Page<Ride> rides =
        rideRepository.searchNearbyRides(
            Ride.RideStatus.SCHEDULED.name(),
            LocalDateTime.now(),
            request.getSourceLatitude(),
            request.getSourceLongitude(),
            request.getDestinationLatitude(),
            request.getDestinationLongitude(),
            request.getRadiusKm(),
            pageable);

    return mapToPageResponse(rides);
  }

  private void validateSearchRequest(RideSearchRequest request) {
    if (request == null) {
      throw new BusinessValidationException("Search request is required");
    }

    if (request.getSourceLatitude() == null || request.getSourceLongitude() == null) {

      throw new BusinessValidationException("Source location coordinates are required");
    }

    if (request.getDestinationLatitude() == null || request.getDestinationLongitude() == null) {

      throw new BusinessValidationException("Destination location coordinates are required");
    }

    if (request.getRadiusKm() == null || request.getRadiusKm() <= 0) {

      throw new BusinessValidationException("Search radius must be greater than zero");
    }

    if (request.getRadiusKm() > 100) {

      throw new BusinessValidationException("Search radius cannot exceed 100 km");
    }

    if (request.getSourceLatitude() < -90
        || request.getSourceLatitude() > 90
        || request.getDestinationLatitude() < -90
        || request.getDestinationLatitude() > 90) {

      throw new BusinessValidationException("Latitude must be between -90 and 90");
    }

    if (request.getSourceLongitude() < -180
        || request.getSourceLongitude() > 180
        || request.getDestinationLongitude() < -180
        || request.getDestinationLongitude() > 180) {

      throw new BusinessValidationException("Longitude must be between -180 and 180");
    }

    if (request.getSourceLatitude().equals(request.getDestinationLatitude())
        && request.getSourceLongitude().equals(request.getDestinationLongitude())) {

      throw new BusinessValidationException("Source and destination cannot be the same");
    }
  }

  // =====================================================
  // START RIDE
  // =====================================================

  public RideResponse startRide(Long rideId) {

    User currentUser = authenticatedUserService.getCurrentUser();

    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    validateDriver(ride, currentUser);

    /*
     * Only SCHEDULED rides can be started.
     */

    validateTransition(ride.getStatus(), Ride.RideStatus.STARTED);

    LocalDateTime now = LocalDateTime.now();

    /*
     * Driver cannot start before departure time.
     */

    if (now.isBefore(ride.getDepartureTime())) {

      throw new ConflictException("Ride cannot be started before its departure time");
    }

    /*
     * If the grace period has already expired,
     * the scheduler may not have run yet.
     *
     * We must still prevent the driver from
     * starting the ride.
     */

    LocalDateTime expiryTime = ride.getDepartureTime().plusMinutes(startGracePeriodMinutes);

    if (!now.isBefore(expiryTime)) {

      throw new ConflictException(
          "Ride can no longer be started because the start grace period has expired");
    }

    ride.setStatus(Ride.RideStatus.STARTED);

    Ride savedRide = rideRepository.save(ride);

    return mapToResponse(savedRide);
  }

  // =====================================================
  // COMPLETE RIDE
  // =====================================================

  public RideResponse completeRide(Long rideId) {

    User currentUser = authenticatedUserService.getCurrentUser();

    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    validateDriver(ride, currentUser);

    /*
     * Only STARTED rides can be completed.
     */

    validateTransition(ride.getStatus(), Ride.RideStatus.COMPLETED);

    ride.setStatus(Ride.RideStatus.COMPLETED);

    Ride savedRide = rideRepository.save(ride);

    return mapToResponse(savedRide);
  }

  // =====================================================
  // CANCEL RIDE
  // =====================================================

  public RideResponse cancelRide(Long rideId, String reason) {
    User currentUser = authenticatedUserService.getCurrentUser();
    Ride ride =
        rideRepository
            .findByIdForUpdate(rideId)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + rideId));

    validateDriver(ride, currentUser);

    /*
     * Only SCHEDULED rides can be cancelled.
     *
     * STARTED -> CANCELLED is intentionally NOT allowed.
     */

    validateTransition(ride.getStatus(), Ride.RideStatus.CANCELLED);

    if (reason == null || reason.trim().isBlank()) {
      throw new BusinessValidationException("Cancellation reason is required");
    }

    LocalDateTime cancellationTime = LocalDateTime.now();

    ride.setStatus(Ride.RideStatus.CANCELLED);
    ride.setCancelledBy(Ride.CancellationActor.DRIVER);
    ride.setCancelledAt(cancellationTime);
    ride.setCancellationReason(getReason(reason));

    Ride savedRide = rideRepository.save(ride);

    // Keep active bookings synchronized with the ride lifecycle.
    // No seat restoration is required because the ride is no longer bookable.
    bookingService.cancelActiveBookingsForRide(
        ride.getId(),
        Booking.CancellationActor.DRIVER,
        Booking.CancellationReason.DRIVER_CANCELLED_RIDE,
        cancellationTime);

    return mapToResponse(savedRide);
  }

  private static String getReason(String reason) {
    String normalizedReason = reason.trim();

    if (normalizedReason.length() > 500) {
      throw new BusinessValidationException("Cancellation reason cannot exceed 500 characters");
    }
    return normalizedReason;
  }

  // =====================================================
  // VALIDATE DRIVER
  // =====================================================

  private void validateDriver(Ride ride, User currentUser) {
    if (!ride.getDriver().getId().equals(currentUser.getId())) {
      throw new OperationNotAllowedException("You are not authorized to manage this ride");
    }
  }

  // =====================================================
  // VALIDATE STATUS TRANSITION
  // =====================================================

  private void validateTransition(Ride.RideStatus currentStatus, Ride.RideStatus targetStatus) {

    boolean allowed =
        (currentStatus == Ride.RideStatus.SCHEDULED && targetStatus == Ride.RideStatus.STARTED)
            || (currentStatus == Ride.RideStatus.SCHEDULED
                && targetStatus == Ride.RideStatus.CANCELLED)
            || (currentStatus == Ride.RideStatus.STARTED
                && targetStatus == Ride.RideStatus.COMPLETED);

    if (!allowed) {

      throw new ConflictException(
          "Invalid ride status transition: " + currentStatus + " -> " + targetStatus);
    }
  }

  // =====================================================
  // BUILD PAGEABLE
  // =====================================================

  private Pageable buildRidePageable(Pageable pageable) {

    int pageNumber = Math.max(pageable.getPageNumber(), 0);

    int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), 50);

    return PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.ASC, "departureTime"));
  }

  // =====================================================
  // BUILD MY RIDE COUNTS
  // =====================================================

  private RideCountsResponse buildRideCounts(Long driverId) {

    long scheduled = 0;
    long started = 0;
    long completed = 0;
    long cancelled = 0;
    long expired = 0;

    List<Object[]> results = rideRepository.countByDriverIdGroupedByStatus(driverId);

    for (Object[] result : results) {

      Ride.RideStatus status = (Ride.RideStatus) result[0];

      long count = ((Number) result[1]).longValue();

      switch (status) {
        case SCHEDULED -> scheduled = count;

        case STARTED -> started = count;

        case COMPLETED -> completed = count;

        case CANCELLED -> cancelled = count;

        case EXPIRED -> expired = count;
      }
    }

    long all = scheduled + started + completed + cancelled + expired;

    return RideCountsResponse.builder()
        .all(all)
        .scheduled(scheduled)
        .started(started)
        .completed(completed)
        .cancelled(cancelled)
        .expired(expired)
        .build();
  }

  // =====================================================
  // PAGE -> RESPONSE
  // =====================================================

  private RidePageResponse mapToPageResponse(Page<Ride> ridePage) {

    return mapToPageResponse(ridePage, null);
  }

  // =====================================================
  // PAGE -> RESPONSE WITH COUNTS
  // =====================================================

  private RidePageResponse mapToPageResponse(Page<Ride> ridePage, RideCountsResponse counts) {

    List<RideResponse> content = ridePage.getContent().stream().map(this::mapToResponse).toList();

    return RidePageResponse.builder()
        .content(content)
        .page(ridePage.getNumber())
        .size(ridePage.getSize())
        .totalElements(ridePage.getTotalElements())
        .totalPages(ridePage.getTotalPages())
        .first(ridePage.isFirst())
        .last(ridePage.isLast())
        .counts(counts)
        .build();
  }

  // =====================================================
  // ENTITY -> RESPONSE
  // =====================================================

  private RideResponse mapToResponse(Ride ride) {

    return RideResponse.builder()
        .id(ride.getId())
        .driverId(ride.getDriver().getId())
        .driverName(ride.getDriver().getName())
        .vehicleId(ride.getVehicle().getId())
        .vehicleNumber(ride.getVehicle().getVehicleNumber())
        .vehicleModel(ride.getVehicle().getModel())
        .source(ride.getSource())
        .sourceLatitude(ride.getSourceLatitude())
        .sourceLongitude(ride.getSourceLongitude())
        .destination(ride.getDestination())
        .destinationLatitude(ride.getDestinationLatitude())
        .destinationLongitude(ride.getDestinationLongitude())
        .departureTime(ride.getDepartureTime())
        .availableSeats(ride.getAvailableSeats())
        .pricePerSeat(ride.getPricePerSeat())
        .status(ride.getStatus())
        .cancelledBy(ride.getCancelledBy())
        .cancelledAt(ride.getCancelledAt())
        .cancellationReason(ride.getCancellationReason())
        .build();
  }
}
