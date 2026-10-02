package com.carpool.ride.service;

import com.carpool.exception.BusinessValidationException;
import com.carpool.exception.ConflictException;
import com.carpool.exception.OperationNotAllowedException;
import com.carpool.exception.ResourceNotFoundException;
import com.carpool.ride.dto.RideCountsResponse;
import com.carpool.ride.dto.RidePageResponse;
import com.carpool.ride.dto.RideRequest;
import com.carpool.ride.dto.RideResponse;
import com.carpool.ride.entity.Ride;
import com.carpool.ride.repository.RideRepository;
import com.carpool.security.service.AuthenticatedUserService;
import com.carpool.user.entity.User;
import com.carpool.vehicle.entity.Vehicle;
import com.carpool.vehicle.repository.VehicleRepository;
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
public class RideService {

  private final RideRepository rideRepository;

  private final VehicleRepository vehicleRepository;

  private final AuthenticatedUserService authenticatedUserService;

  public RideService(
      RideRepository rideRepository,
      VehicleRepository vehicleRepository,
      AuthenticatedUserService authenticatedUserService) {

    this.rideRepository = rideRepository;

    this.vehicleRepository = vehicleRepository;

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

    if (request.getSource().equalsIgnoreCase(request.getDestination())) {

      throw new BusinessValidationException("Source and destination cannot be the same");
    }

    Ride ride =
        Ride.builder()
            .driver(driver)
            .vehicle(vehicle)
            .source(request.getSource())
            .destination(request.getDestination())
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

  // =====================================================
  // CANCEL RIDE
  // =====================================================

  public RideResponse cancelRide(Long id) {

    User currentUser = authenticatedUserService.getCurrentUser();

    Ride ride =
        rideRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ride not found with id: " + id));

    // Ownership check

    if (!ride.getDriver().getId().equals(currentUser.getId())) {

      throw new OperationNotAllowedException("You can only cancel your own rides");
    }

    // Status check

    if (ride.getStatus() != Ride.RideStatus.SCHEDULED) {

      throw new ConflictException("Only scheduled rides can be cancelled");
    }

    ride.setStatus(Ride.RideStatus.CANCELLED);

    return mapToResponse(rideRepository.save(ride));
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

    List<Object[]> results = rideRepository.countByDriverIdGroupedByStatus(driverId);

    for (Object[] result : results) {

      Ride.RideStatus status = (Ride.RideStatus) result[0];

      long count = ((Number) result[1]).longValue();

      switch (status) {
        case SCHEDULED -> scheduled = count;

        case STARTED -> started = count;

        case COMPLETED -> completed = count;

        case CANCELLED -> cancelled = count;
      }
    }

    long all = scheduled + started + completed + cancelled;

    return RideCountsResponse.builder()
        .all(all)
        .scheduled(scheduled)
        .started(started)
        .completed(completed)
        .cancelled(cancelled)
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
        .build();
  }
}
