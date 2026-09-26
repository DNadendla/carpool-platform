package com.carpool.ride.service;

import com.carpool.exception.BusinessValidationException;
import com.carpool.exception.ConflictException;
import com.carpool.exception.OperationNotAllowedException;
import com.carpool.exception.ResourceNotFoundException;
import com.carpool.ride.dto.RideRequest;
import com.carpool.ride.dto.RideResponse;
import com.carpool.ride.entity.Ride;
import com.carpool.ride.repository.RideRepository;
import com.carpool.security.service.AuthenticatedUserService;
import com.carpool.user.entity.User;
import com.carpool.vehicle.entity.Vehicle;
import com.carpool.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    // =========================
    // CREATE RIDE
    // =========================

    public RideResponse createRide(RideRequest request) {

        // Get driver from JWT
        User driver = authenticatedUserService.getCurrentUser();

        // Find vehicle
        Vehicle vehicle = vehicleRepository.findById(
                request.getVehicleId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Vehicle not found with id: "
                                + request.getVehicleId()
                )
        );

        // Verify vehicle belongs to logged-in driver
        if (!vehicle.getOwner().getId().equals(driver.getId())) {

            throw new OperationNotAllowedException(
                    "Vehicle does not belong to the authenticated user"
            );
        }

        // Validate available seats
        if (request.getAvailableSeats() > vehicle.getTotalSeats()) {

            throw new BusinessValidationException(
                    "Available seats cannot exceed vehicle capacity"
            );
        }

        // Validate source and destination
        if (request.getSource()
                .equalsIgnoreCase(request.getDestination())) {

            throw new BusinessValidationException(
                    "Source and destination cannot be the same"
            );
        }

        // Create ride
        Ride ride = Ride.builder()
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

        // Save
        Ride savedRide = rideRepository.save(ride);

        return mapToResponse(savedRide);
    }


    // =========================
    // GET RIDE BY ID
    // =========================

    @Transactional(readOnly = true)
    public RideResponse getRideById(Long id) {

        Ride ride = rideRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ride not found with id: " + id
                        )
                );

        return mapToResponse(ride);
    }


    // =========================
    // GET ALL RIDES
    // =========================

    @Transactional(readOnly = true)
    public List<RideResponse> getAllRides() {

        return rideRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    // =========================
    // GET MY RIDES
    // =========================

    @Transactional(readOnly = true)
    public List<RideResponse> getMyRides() {

        Long driverId =
                authenticatedUserService.getCurrentUserId();

        return rideRepository.findByDriverId(driverId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    // =========================
    // SEARCH RIDES
    // =========================

    @Transactional(readOnly = true)
    public List<RideResponse> searchRides(
            String source,
            String destination) {

        return rideRepository
                .findBySourceIgnoreCaseAndDestinationIgnoreCase(
                        source,
                        destination
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    // =========================
    // CANCEL RIDE
    // =========================

    public RideResponse cancelRide(Long id) {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        Ride ride = rideRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ride not found with id: " + id
                        )
                );

        // Ownership check
        if (!ride.getDriver().getId()
                .equals(currentUser.getId())) {

            throw new OperationNotAllowedException(
                    "You can only cancel your own rides"
            );
        }

        // Status check
        if (ride.getStatus() != Ride.RideStatus.SCHEDULED) {

            throw new ConflictException(
                    "Only scheduled rides can be cancelled"
            );
        }

        ride.setStatus(Ride.RideStatus.CANCELLED);

        return mapToResponse(
                rideRepository.save(ride)
        );
    }


    // =========================
    // ENTITY -> RESPONSE
    // =========================

    private RideResponse mapToResponse(Ride ride) {

        return RideResponse.builder()
                .id(ride.getId())

                .driverId(ride.getDriver().getId())
                .driverName(ride.getDriver().getName())

                .vehicleId(ride.getVehicle().getId())
                .vehicleNumber(
                        ride.getVehicle().getVehicleNumber()
                )
                .vehicleModel(
                        ride.getVehicle().getModel()
                )

                .source(ride.getSource())
                .sourceLatitude(ride.getSourceLatitude())
                .sourceLongitude(ride.getSourceLongitude())

                .destination(ride.getDestination())
                .destinationLatitude(ride.getDestinationLatitude())
                .destinationLongitude(ride.getDestinationLongitude())

                .departureTime(ride.getDepartureTime())

                .availableSeats(
                        ride.getAvailableSeats()
                )

                .pricePerSeat(
                        ride.getPricePerSeat()
                )

                .status(ride.getStatus())

                .build();
    }
}