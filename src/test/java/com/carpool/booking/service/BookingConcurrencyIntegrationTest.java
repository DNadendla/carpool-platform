package com.carpool.booking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.carpool.booking.entity.Booking;
import com.carpool.booking.exception.BookingNotAllowedException;
import com.carpool.booking.repository.BookingRepository;
import com.carpool.exception.ConflictException;
import com.carpool.ride.entity.Ride;
import com.carpool.ride.repository.RideRepository;
import com.carpool.ride.service.RideService;
import com.carpool.security.service.AuthenticatedUserService;
import com.carpool.user.entity.User;
import com.carpool.user.repository.UserRepository;
import com.carpool.vehicle.entity.Vehicle;
import com.carpool.vehicle.entity.Vehicle.VehicleType;
import com.carpool.vehicle.repository.VehicleRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
class BookingConcurrencyIntegrationTest {

  @Autowired private BookingService bookingService;
  @Autowired private RideService rideService;
  @Autowired private BookingRepository bookingRepository;
  @Autowired private RideRepository rideRepository;
  @Autowired private VehicleRepository vehicleRepository;
  @Autowired private UserRepository userRepository;

  @MockitoBean private AuthenticatedUserService authenticatedUserService;

  private final ThreadLocal<User> currentUser = new ThreadLocal<>();

  @BeforeEach
  void setUp() {
    deleteAllInDependencyOrder();

    org.mockito.Mockito.when(authenticatedUserService.getCurrentUser())
        .thenAnswer(invocation -> currentUser.get());
  }

  @AfterEach
  void clearThreadLocal() {
    currentUser.remove();
  }

  @Test
  void concurrentApprovalsShouldNotOversellSeats() throws Exception {
    User driver = createUser("driver-seat@carpool.test");
    User passengerOne = createUser("passenger-one@carpool.test");
    User passengerTwo = createUser("passenger-two@carpool.test");

    Ride ride = createRide(driver, 1);
    Booking bookingOne = createBooking(ride, passengerOne, 1, Booking.BookingStatus.PENDING);
    Booking bookingTwo = createBooking(ride, passengerTwo, 1, Booking.BookingStatus.PENDING);

    List<Outcome> outcomes =
        runConcurrently(
            () -> executeAs(driver, () -> bookingService.approveBooking(bookingOne.getId())),
            () -> executeAs(driver, () -> bookingService.approveBooking(bookingTwo.getId())));

    long successfulApprovals = outcomes.stream().filter(outcome -> outcome.success()).count();
    assertEquals(1, successfulApprovals);

    Ride refreshedRide = rideRepository.findById(ride.getId()).orElseThrow();
    assertEquals(0, refreshedRide.getAvailableSeats());

    Booking refreshedOne = bookingRepository.findById(bookingOne.getId()).orElseThrow();
    Booking refreshedTwo = bookingRepository.findById(bookingTwo.getId()).orElseThrow();

    long confirmedCount =
        List.of(refreshedOne, refreshedTwo).stream()
            .filter(booking -> booking.getStatus() == Booking.BookingStatus.CONFIRMED)
            .count();

    long pendingCount =
        List.of(refreshedOne, refreshedTwo).stream()
            .filter(booking -> booking.getStatus() == Booking.BookingStatus.PENDING)
            .count();

    assertEquals(1, confirmedCount);
    assertEquals(1, pendingCount);
  }

  @Test
  void concurrentApprovalOfSameBookingShouldDeductSeatsOnlyOnce() throws Exception {
    User driver = createUser("driver-same-booking@carpool.test");
    User passenger = createUser("passenger-same-booking@carpool.test");

    Ride ride = createRide(driver, 2);
    Booking booking = createBooking(ride, passenger, 2, Booking.BookingStatus.PENDING);

    List<Outcome> outcomes =
        runConcurrently(
            () -> executeAs(driver, () -> bookingService.approveBooking(booking.getId())),
            () -> executeAs(driver, () -> bookingService.approveBooking(booking.getId())));

    long successfulApprovals = outcomes.stream().filter(outcome -> outcome.success()).count();
    assertEquals(1, successfulApprovals);

    long conflictCount =
        outcomes.stream().filter(outcome -> outcome.error() instanceof ConflictException).count();
    assertEquals(1, conflictCount);

    Ride refreshedRide = rideRepository.findById(ride.getId()).orElseThrow();
    assertEquals(0, refreshedRide.getAvailableSeats());

    Booking refreshedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
    assertEquals(Booking.BookingStatus.CONFIRMED, refreshedBooking.getStatus());
  }

  @Test
  void concurrentCancellationOfDifferentConfirmedBookingsShouldRestoreAllSeats() throws Exception {
    User driver = createUser("driver-cancel@carpool.test");
    User passengerOne = createUser("passenger-cancel-one@carpool.test");
    User passengerTwo = createUser("passenger-cancel-two@carpool.test");

    Ride ride = createRide(driver, 0);
    Booking bookingOne = createBooking(ride, passengerOne, 1, Booking.BookingStatus.CONFIRMED);
    Booking bookingTwo = createBooking(ride, passengerTwo, 1, Booking.BookingStatus.CONFIRMED);

    List<Outcome> outcomes =
        runConcurrently(
            () -> executeAs(passengerOne, () -> bookingService.cancelBooking(bookingOne.getId())),
            () -> executeAs(passengerTwo, () -> bookingService.cancelBooking(bookingTwo.getId())));

    long successfulCancellations = outcomes.stream().filter(outcome -> outcome.success()).count();
    assertEquals(2, successfulCancellations);

    Ride refreshedRide = rideRepository.findById(ride.getId()).orElseThrow();
    assertEquals(2, refreshedRide.getAvailableSeats());

    assertEquals(
        Booking.BookingStatus.CANCELLED,
        bookingRepository.findById(bookingOne.getId()).orElseThrow().getStatus());
    assertEquals(
        Booking.BookingStatus.CANCELLED,
        bookingRepository.findById(bookingTwo.getId()).orElseThrow().getStatus());
  }

  @Test
  void concurrentCancellationOfSameConfirmedBookingShouldRestoreSeatsOnlyOnce() throws Exception {
    User driver = createUser("driver-same-cancel@carpool.test");
    User passenger = createUser("passenger-same-cancel@carpool.test");

    Ride ride = createRide(driver, 0);
    Booking booking = createBooking(ride, passenger, 1, Booking.BookingStatus.CONFIRMED);

    List<Outcome> outcomes =
        runConcurrently(
            () -> executeAs(passenger, () -> bookingService.cancelBooking(booking.getId())),
            () -> executeAs(passenger, () -> bookingService.cancelBooking(booking.getId())));

    long successfulCancellations = outcomes.stream().filter(outcome -> outcome.success()).count();
    assertEquals(1, successfulCancellations);

    long conflictCount =
        outcomes.stream()
            .filter(
                outcome ->
                    outcome.error() instanceof ConflictException
                        || outcome.error() instanceof BookingNotAllowedException)
            .count();
    assertEquals(1, conflictCount);

    Ride refreshedRide = rideRepository.findById(ride.getId()).orElseThrow();
    assertEquals(1, refreshedRide.getAvailableSeats());

    Booking refreshedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
    assertEquals(Booking.BookingStatus.CANCELLED, refreshedBooking.getStatus());
  }

  @Test
  void concurrentRideCancellationAndBookingApprovalShouldLeaveNoActiveBooking() throws Exception {
    User driver = createUser("driver-ride-cancel-race@carpool.test");
    User passenger = createUser("passenger-ride-cancel-race@carpool.test");

    Ride ride = createRide(driver, 1);
    Booking booking = createBooking(ride, passenger, 1, Booking.BookingStatus.PENDING);

    List<Outcome> outcomes =
        runConcurrently(
            () -> executeAs(driver, () -> bookingService.approveBooking(booking.getId())),
            () ->
                executeAs(
                    driver, () -> rideService.cancelRide(ride.getId(), "Driver unavailable")));

    Ride refreshedRide = rideRepository.findById(ride.getId()).orElseThrow();
    Booking refreshedBooking = bookingRepository.findById(booking.getId()).orElseThrow();

    assertEquals(Ride.RideStatus.CANCELLED, refreshedRide.getStatus());
    assertEquals(Booking.BookingStatus.CANCELLED, refreshedBooking.getStatus());

    long unexpectedFailures =
        outcomes.stream()
            .filter(outcome -> outcome.error() != null)
            .filter(outcome -> !(outcome.error() instanceof ConflictException))
            .count();

    assertEquals(0, unexpectedFailures);
  }

  @Test
  void concurrentApprovalAndPassengerCancellationShouldLeaveConsistentFinalState()
      throws Exception {
    User driver = createUser("driver-race@carpool.test");
    User passenger = createUser("passenger-race@carpool.test");

    Ride ride = createRide(driver, 1);
    Booking booking = createBooking(ride, passenger, 1, Booking.BookingStatus.PENDING);

    List<Outcome> outcomes =
        runConcurrently(
            () -> executeAs(driver, () -> bookingService.approveBooking(booking.getId())),
            () -> executeAs(passenger, () -> bookingService.cancelBooking(booking.getId())));

    Booking refreshedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
    Ride refreshedRide = rideRepository.findById(ride.getId()).orElseThrow();

    assertEquals(Booking.BookingStatus.CANCELLED, refreshedBooking.getStatus());
    assertEquals(1, refreshedRide.getAvailableSeats());

    long unexpectedFailures =
        outcomes.stream()
            .filter(outcome -> outcome.error() != null)
            .filter(outcome -> !(outcome.error() instanceof ConflictException))
            .count();

    assertEquals(0, unexpectedFailures);
  }

  private Outcome executeAs(User user, ThrowingSupplier<?> operation) {
    currentUser.set(user);
    try {
      return Outcome.success(operation.get());
    } catch (Throwable throwable) {
      return Outcome.failure(throwable);
    } finally {
      currentUser.remove();
    }
  }

  private List<Outcome> runConcurrently(ThrowingSupplier<?>... operations) throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(operations.length);
    CountDownLatch ready = new CountDownLatch(operations.length);
    CountDownLatch start = new CountDownLatch(1);
    List<Future<Outcome>> futures = new ArrayList<>();

    try {
      for (ThrowingSupplier<?> operation : operations) {
        futures.add(
            executor.submit(
                () -> {
                  ready.countDown();
                  if (!start.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("Concurrency test start timed out");
                  }
                  return (Outcome) operation.get();
                }));
      }

      if (!ready.await(10, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Concurrency test workers did not become ready");
      }

      start.countDown();

      List<Outcome> results = new ArrayList<>();
      for (Future<Outcome> future : futures) {
        try {
          Outcome outcome = future.get(30, TimeUnit.SECONDS);
          assertNotNull(outcome);
          results.add(outcome);
        } catch (ExecutionException executionException) {
          Throwable cause = executionException.getCause();
          results.add(Outcome.failure(cause));
        }
      }
      return results;
    } finally {
      executor.shutdownNow();
      executor.awaitTermination(10, TimeUnit.SECONDS);
    }
  }

  private User createUser(String email) {
    return userRepository.save(
        User.builder()
            .name(email.substring(0, email.indexOf('@')))
            .email(email)
            .password("test-password")
            .phone("9000000000")
            .build());
  }

  private Ride createRide(User driver, int availableSeats) {
    Vehicle vehicle =
        vehicleRepository.save(
            Vehicle.builder()
                .vehicleNumber("TEST-" + System.nanoTime())
                .model("Test Model")
                .type(VehicleType.SEDAN)
                .totalSeats(Math.max(availableSeats, 2))
                .owner(driver)
                .build());

    return rideRepository.save(
        Ride.builder()
            .driver(driver)
            .vehicle(vehicle)
            .departureTime(LocalDateTime.now().plusHours(2))
            .availableSeats(availableSeats)
            .pricePerSeat(BigDecimal.valueOf(100))
            .status(Ride.RideStatus.SCHEDULED)
            .source("Hyderabad")
            .sourceLatitude(17.3850)
            .sourceLongitude(78.4867)
            .destination("Ongole")
            .destinationLatitude(15.5057)
            .destinationLongitude(80.0499)
            .build());
  }

  private Booking createBooking(
      Ride ride, User passenger, int seats, Booking.BookingStatus status) {
    return bookingRepository.save(
        Booking.builder().ride(ride).passenger(passenger).seats(seats).status(status).build());
  }

  private void deleteAllInDependencyOrder() {
    bookingRepository.deleteAll();
    rideRepository.deleteAll();
    vehicleRepository.deleteAll();
    userRepository.deleteAll();
  }

  @FunctionalInterface
  private interface ThrowingSupplier<T> {
    T get() throws Exception;
  }

  private record Outcome(Object result, Throwable error) {
    static Outcome success(Object result) {
      return new Outcome(result, null);
    }

    static Outcome failure(Throwable error) {
      return new Outcome(null, error);
    }

    boolean success() {
      return error == null;
    }
  }
}
/**
 * 1. Concurrent approval of two pending bookings → only one can consume the last seat
 *
 * <p>2. Concurrent approval of the same booking → approval happens once → seats deducted once
 *
 * <p>3. Concurrent cancellation of two confirmed bookings → both cancellations succeed → all seats
 * restored
 *
 * <p>4. Concurrent cancellation of the same confirmed booking → cancellation happens once → seats
 * restored once
 *
 * <p>5. Concurrent ride cancellation + booking approval → ride ends CANCELLED → booking ends
 * CANCELLED → no active booking remains
 *
 * <p>6. Concurrent approval + passenger cancellation → final booking is CANCELLED → seat count
 * remains consistent
 */
