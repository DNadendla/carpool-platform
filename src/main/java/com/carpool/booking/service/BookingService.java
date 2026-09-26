package com.carpool.booking.service;

import com.carpool.booking.dto.*;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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

    public BookingResponse createBooking(
            BookingRequest request) {

        // 1. Find passenger
        User passenger = authenticatedUserService.getCurrentUser();

        // 2. LOCK the ride
        Ride ride = rideRepository
                .findByIdForUpdate(request.getRideId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ride not found with id: "
                                        + request.getRideId()
                        )
                );

        if (!LocalDateTime.now().isBefore(ride.getDepartureTime())) {
            throw new BookingNotAllowedException(
                    "Cannot book a ride after its departure time"
            );
        }

        // 3. Check ride status
        if (ride.getStatus()
                != Ride.RideStatus.SCHEDULED) {

            throw new IllegalStateException(
                    "Ride is not available for booking"
            );
        }

        // 4. Driver cannot book own ride
        if (ride.getDriver().getId()
                .equals(passenger.getId())) {

            throw new IllegalArgumentException(
                    "Driver cannot book their own ride"
            );
        }

        // 5. Check duplicate booking
        boolean alreadyBooked =
                bookingRepository
                        .existsByRideIdAndPassengerIdAndStatus(
                                ride.getId(),
                                passenger.getId(),
                                Booking.BookingStatus.CONFIRMED
                        );

        if (alreadyBooked) {

            throw new DuplicateResourceException(
                    "Passenger already booked this ride"
            );
        }

        // 6. Check available seats
        if (request.getSeats()
                > ride.getAvailableSeats()) {

            throw new InsufficientSeatsException(
                    "Only "
                            + ride.getAvailableSeats()
                            + " seats are available"
            );
        }

        // 7. Reduce seats
        ride.setAvailableSeats(
                ride.getAvailableSeats()
                        - request.getSeats()
        );

        // 8. Create booking
        Booking booking = Booking.builder()
                .ride(ride)
                .passenger(passenger)
                .seats(request.getSeats())
                .status(Booking.BookingStatus.CONFIRMED)
                .build();

        // 9. Save
        Booking savedBooking =
                bookingRepository.save(booking);

        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {

        Booking booking =
                bookingRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Booking not found with id: "
                                                + id
                                )
                        );

        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByPassenger(
            Long passengerId) {

        return bookingRepository
                .findByPassengerId(passengerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByRide(
            Long rideId) {

        return bookingRepository
                .findByRideId(rideId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {

        User passenger =
                authenticatedUserService.getCurrentUser();


        // Lock the booking first
        Booking booking =
                bookingRepository.findByIdForUpdate(bookingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Booking not found with id: "
                                                + bookingId
                                )
                        );


        // =========================
        // OWNERSHIP CHECK
        // =========================

        if (!booking.getPassenger()
                .getId()
                .equals(passenger.getId())) {

            throw new BookingNotAllowedException(
                    "You are not allowed to cancel this booking"
            );
        }


        // =========================
        // STATUS CHECK
        // =========================

        if (booking.getStatus()
                != Booking.BookingStatus.CONFIRMED) {

            throw new BookingNotAllowedException(
                    "Only confirmed bookings can be cancelled"
            );
        }

        Ride ride =
                rideRepository.findByIdForUpdate(
                                booking.getRide().getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Ride not found with id: "
                                                + booking.getRide().getId()
                                )
                        );


        // =========================
        // DEPARTURE CHECK
        // =========================

        if (!LocalDateTime.now()
                .isBefore(ride.getDepartureTime())) {

            throw new BookingNotAllowedException(
                    "Cannot cancel a booking after ride departure"
            );
        }


        // =========================
        // RESTORE SEATS
        // =========================

        ride.setAvailableSeats(
                ride.getAvailableSeats()
                        + booking.getSeats()
        );


        // =========================
        // CANCEL BOOKING
        // =========================

        booking.setStatus(
                Booking.BookingStatus.CANCELLED
        );


        Booking savedBooking = bookingRepository.save(booking);

        return mapToResponse(savedBooking);
    }

    public List<BookingResponse> getMyBookings() {

        User passenger =
                authenticatedUserService.getCurrentUser();

        return bookingRepository
                .findByPassengerId(passenger.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private BookingResponse mapToResponse(Booking booking) {
        Ride ride = booking.getRide();
        User driver = ride.getDriver();
        Vehicle vehicle = ride.getVehicle();

        DriverSummaryResponse driverResponse =
                DriverSummaryResponse.builder()
                        .id(driver.getId())
                        .name(driver.getName())
                        .build();

        VehicleSummaryResponse vehicleResponse =
                VehicleSummaryResponse.builder()
                        .id(vehicle.getId())
                        .vehicleNumber(
                                vehicle.getVehicleNumber()
                        )
                        .model(
                                vehicle.getModel()
                        )
                        .type(
                                vehicle.getType()
                        )
                        .totalSeats(
                                vehicle.getTotalSeats()
                        )
                        .build();

        RideSummaryResponse rideResponse =
                RideSummaryResponse.builder()
                        .id(ride.getId())
                        .source(ride.getSource())
                        .destination(ride.getDestination())
                        .departureTime(
                                ride.getDepartureTime()
                        )
                        .availableSeats(
                                ride.getAvailableSeats()
                        )
                        .pricePerSeat(
                                ride.getPricePerSeat()
                        )
                        .status(
                                ride.getStatus()
                        )
                        .driver(
                                driverResponse
                        )
                        .vehicle(
                                vehicleResponse
                        )
                        .build();

        BigDecimal totalAmount =
                ride.getPricePerSeat()
                        .multiply(
                                BigDecimal.valueOf(
                                        booking.getSeats()
                                )
                        );

        return BookingResponse.builder()
                .id(booking.getId())
                .ride(rideResponse)
                .seats(booking.getSeats())
                .totalAmount(totalAmount)
                .status(booking.getStatus())
                .bookedAt(booking.getBookedAt())
                .build();
    }
}