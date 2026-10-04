package com.carpool.ride.repository;

import com.carpool.ride.entity.Ride;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface RideRepository extends JpaRepository<Ride, Long> {

  // =====================================================
  // EXISTING
  // =====================================================

  List<Ride> findByDriverId(Long driverId);

  List<Ride> findByStatus(Ride.RideStatus status);

  List<Ride> findBySourceIgnoreCaseAndDestinationIgnoreCase(String source, String destination);

  List<Ride> findBySourceIgnoreCaseAndDestinationIgnoreCaseAndDepartureTimeBetween(
      String source, String destination, LocalDateTime start, LocalDateTime end);

  // =====================================================
  // FIND AVAILABLE RIDES - PAGINATION
  // =====================================================

  Page<Ride> findByStatusAndDepartureTimeAfterAndAvailableSeatsGreaterThanOrderByDepartureTimeAsc(
      Ride.RideStatus status,
      LocalDateTime departureTime,
      Integer availableSeats,
      Pageable pageable);

  // =====================================================
  // SEARCH AVAILABLE RIDES - PAGINATION
  // =====================================================

  Page<Ride>
      findByStatusAndDepartureTimeAfterAndAvailableSeatsGreaterThanAndSourceIgnoreCaseAndDestinationIgnoreCaseOrderByDepartureTimeAsc(
          Ride.RideStatus status,
          LocalDateTime departureTime,
          Integer availableSeats,
          String source,
          String destination,
          Pageable pageable);

  // =====================================================
  // MY RIDES - PAGINATION
  // =====================================================

  Page<Ride> findByDriverId(Long driverId, Pageable pageable);

  // =====================================================
  // MY RIDES - PAGINATION + STATUS
  // =====================================================

  Page<Ride> findByDriverIdAndStatus(Long driverId, Ride.RideStatus status, Pageable pageable);

  // =====================================================
  // MY RIDES - FILTER COUNTS
  // =====================================================

  @Query(
      """
            SELECT r.status, COUNT(r)
            FROM Ride r
            WHERE r.driver.id = :driverId
            GROUP BY r.status
            """)
  List<Object[]> countByDriverIdGroupedByStatus(@Param("driverId") Long driverId);

  // =====================================================
  // RIDE LOCK
  // =====================================================

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
            SELECT r
            FROM Ride r
            WHERE r.id = :id
            """)
  Optional<Ride> findByIdForUpdate(@Param("id") Long id);

  // =====================================================
  // RIDE EXPIRY
  // =====================================================

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
    SELECT r
    FROM Ride r
    WHERE r.status = :status
      AND r.departureTime <= :expiryTime
    """)
  List<Ride> findScheduledRidesEligibleForExpiry(
      @Param("status") Ride.RideStatus status, @Param("expiryTime") LocalDateTime expiryTime);

  // =====================================================
  // GEOGRAPHIC SEARCH - PAGINATION
  // =====================================================

  @Query(
      value =
          """
        SELECT r.*
        FROM rides r
        WHERE r.status = :status
          AND r.departure_time > :departureTime
          AND r.available_seats > 0

          AND (
              6371 * ACOS(
                  LEAST(
                      1.0,
                      GREATEST(
                          -1.0,
                          COS(RADIANS(:sourceLatitude))
                          * COS(RADIANS(r.source_latitude))
                          * COS(
                              RADIANS(r.source_longitude)
                              - RADIANS(:sourceLongitude)
                          )
                          + SIN(RADIANS(:sourceLatitude))
                          * SIN(RADIANS(r.source_latitude))
                      )
                  )
              )
          ) <= :radiusKm

          AND (
              6371 * ACOS(
                  LEAST(
                      1.0,
                      GREATEST(
                          -1.0,
                          COS(RADIANS(:destinationLatitude))
                          * COS(RADIANS(r.destination_latitude))
                          * COS(
                              RADIANS(r.destination_longitude)
                              - RADIANS(:destinationLongitude)
                          )
                          + SIN(RADIANS(:destinationLatitude))
                          * SIN(RADIANS(r.destination_latitude))
                      )
                  )
              )
          ) <= :radiusKm

        """,
      countQuery =
          """
        SELECT COUNT(*)
        FROM rides r
        WHERE r.status = :status
          AND r.departure_time > :departureTime
          AND r.available_seats > 0

          AND (
              6371 * ACOS(
                  LEAST(
                      1.0,
                      GREATEST(
                          -1.0,
                          COS(RADIANS(:sourceLatitude))
                          * COS(RADIANS(r.source_latitude))
                          * COS(
                              RADIANS(r.source_longitude)
                              - RADIANS(:sourceLongitude)
                          )
                          + SIN(RADIANS(:sourceLatitude))
                          * SIN(RADIANS(r.source_latitude))
                      )
                  )
              )
          ) <= :radiusKm

          AND (
              6371 * ACOS(
                  LEAST(
                      1.0,
                      GREATEST(
                          -1.0,
                          COS(RADIANS(:destinationLatitude))
                          * COS(RADIANS(r.destination_latitude))
                          * COS(
                              RADIANS(r.destination_longitude)
                              - RADIANS(:destinationLongitude)
                          )
                          + SIN(RADIANS(:destinationLatitude))
                          * SIN(RADIANS(r.destination_latitude))
                      )
                  )
              ) <= :radiusKm
        """,
      nativeQuery = true)
  Page<Ride> searchNearbyRides(
      @Param("status") String status,
      @Param("departureTime") LocalDateTime departureTime,
      @Param("sourceLatitude") Double sourceLatitude,
      @Param("sourceLongitude") Double sourceLongitude,
      @Param("destinationLatitude") Double destinationLatitude,
      @Param("destinationLongitude") Double destinationLongitude,
      @Param("radiusKm") Double radiusKm,
      Pageable pageable);
}
