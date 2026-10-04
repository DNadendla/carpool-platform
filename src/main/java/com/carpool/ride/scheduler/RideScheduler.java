package com.carpool.ride.scheduler;

import com.carpool.booking.entity.Booking;
import com.carpool.booking.service.BookingService;
import com.carpool.ride.entity.Ride;
import com.carpool.ride.repository.RideRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RideScheduler {

  private final RideRepository rideRepository;
  private final BookingService bookingService;

  @Value("${carpool.ride.start-grace-period-minutes:15}")
  private long startGracePeriodMinutes;

  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void expireUnstartedRides() {
    log.info("RideScheduler :: expireUnstartedRides");

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime expiryTime = now.minusMinutes(startGracePeriodMinutes);

    List<Ride> rides =
        rideRepository.findScheduledRidesEligibleForExpiry(Ride.RideStatus.SCHEDULED, expiryTime);

    if (rides.isEmpty()) {
      return;
    }

    for (Ride ride : rides) {

      if (ride.getStatus() != Ride.RideStatus.SCHEDULED) {
        continue;
      }

      ride.setStatus(Ride.RideStatus.EXPIRED);

      // A ride that expires must not leave active passenger bookings behind.
      // Both PENDING and CONFIRMED requests are cancelled by SYSTEM.
      bookingService.cancelActiveBookingsForRide(
          ride.getId(),
          Booking.CancellationActor.SYSTEM,
          Booking.CancellationReason.RIDE_EXPIRED,
          now);

      log.info(
          "Ride {} expired because it was not started within the grace period. Departure time: {}",
          ride.getId(),
          ride.getDepartureTime());
    }

    rideRepository.saveAll(rides);
  }
}
