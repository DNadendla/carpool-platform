package com.carpool.booking.repository;

import com.carpool.booking.dto.BookingStatusCount;
import com.carpool.booking.entity.Booking;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

  @EntityGraph(attributePaths = {"ride", "ride.driver", "ride.vehicle"})
  Page<Booking> findByPassengerId(Long passengerId, Pageable pageable);

  @EntityGraph(attributePaths = {"ride", "ride.driver", "ride.vehicle"})
  Page<Booking> findByPassengerIdAndStatus(
      Long passengerId, Booking.BookingStatus status, Pageable pageable);

  long countByPassengerId(Long passengerId);

  long countByPassengerIdAndStatus(Long passengerId, Booking.BookingStatus status);

  List<Booking> findByPassengerId(Long passengerId);

  List<Booking> findByRideId(Long rideId);

  boolean existsByRideIdAndPassengerIdAndStatusIn(
      Long rideId, Long passengerId, List<Booking.BookingStatus> statuses);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT b FROM Booking b WHERE b.id = :id")
  Optional<Booking> findByIdForUpdate(@Param("id") Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
            SELECT b
            FROM Booking b
            WHERE b.ride.id = :rideId
              AND b.status = :status
            """)
  List<Booking> findByRideIdAndStatusForUpdate(
      @Param("rideId") Long rideId, @Param("status") Booking.BookingStatus status);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
            SELECT b
            FROM Booking b
            WHERE b.ride.id = :rideId
              AND b.status IN :statuses
            """)
  List<Booking> findByRideIdAndStatusInForUpdate(
      @Param("rideId") Long rideId, @Param("statuses") List<Booking.BookingStatus> statuses);

  @Query(
      """
            SELECT new com.carpool.booking.dto.BookingStatusCount(
                b.status,
                COUNT(b)
            )
            FROM Booking b
            WHERE b.passenger.id = :passengerId
            GROUP BY b.status
            """)
  List<BookingStatusCount> countByPassengerGroupedByStatus(@Param("passengerId") Long passengerId);

  @Query(
      """
    SELECT b.ride.id
    FROM Booking b
    WHERE b.id = :bookingId
    """)
  Optional<Long> findRideIdByBookingId(@Param("bookingId") Long bookingId);
}
