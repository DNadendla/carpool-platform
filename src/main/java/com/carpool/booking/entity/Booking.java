package com.carpool.booking.entity;

import com.carpool.ride.entity.Ride;
import com.carpool.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
  private BookingStatus status = BookingStatus.PENDING;

  @Column(nullable = false)
  @Builder.Default
  private LocalDateTime bookedAt = LocalDateTime.now();

  // =========================
  // REJECTION AUDIT
  // =========================

  @Column(name = "rejection_reason", length = 500)
  private String rejectionReason;

  @Column(name = "rejected_at")
  private LocalDateTime rejectedAt;

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
    SYSTEM_CANCELLED,
    RIDE_EXPIRED
  }

  public enum BookingStatus {
    PENDING,
    CONFIRMED,
    REJECTED,
    CANCELLED
  }
}
