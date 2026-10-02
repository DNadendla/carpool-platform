package com.carpool.booking.entity;

import com.carpool.ride.entity.Ride;
import com.carpool.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ride_id", nullable = false)
  private Ride ride;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "passenger_id", nullable = false)
  private User passenger;

  @Column(nullable = false)
  private Integer seats;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private BookingStatus status = BookingStatus.CONFIRMED;

  @Column(nullable = false)
  @Builder.Default
  private LocalDateTime bookedAt = LocalDateTime.now();

  // =========================
  // CANCELLATION AUDIT
  // =========================

  @Enumerated(EnumType.STRING)
  @Column(name = "cancelled_by")
  private CancellationActor cancelledBy;

  @Enumerated(EnumType.STRING)
  @Column(name = "cancellation_reason")
  private CancellationReason cancellationReason;

  @Column(name = "cancelled_at")
  private LocalDateTime cancelledAt;

  public enum CancellationActor {
    PASSENGER,
    DRIVER,
    ADMIN,
    SYSTEM
  }

  public enum CancellationReason {
    PASSENGER_CANCELLED_BOOKING,
    DRIVER_CANCELLED_RIDE,
    ADMIN_CANCELLED,
    SYSTEM_CANCELLED
  }

  public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    REJECTED
  }
}
