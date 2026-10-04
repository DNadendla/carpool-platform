package com.carpool.ride.entity;

import com.carpool.user.entity.User;
import com.carpool.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "rides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ride {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "driver_id", nullable = false)
  private User driver;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "vehicle_id", nullable = false)
  private Vehicle vehicle;

  @Column(nullable = false)
  private LocalDateTime departureTime;

  @Column(nullable = false)
  private Integer availableSeats;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal pricePerSeat;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private RideStatus status = RideStatus.SCHEDULED;

  // =========================
  // CANCELLATION AUDIT
  // =========================

  @Enumerated(EnumType.STRING)
  @Column(name = "cancelled_by")
  private CancellationActor cancelledBy;

  @Column(name = "cancelled_at")
  private LocalDateTime cancelledAt;

  @Column(name = "cancellation_reason", length = 500)
  private String cancellationReason;

  // =========================
  // LOCATION
  // =========================

  @Column(nullable = false)
  private String source;

  @Column(nullable = false)
  private Double sourceLatitude;

  @Column(nullable = false)
  private Double sourceLongitude;

  @Column(nullable = false)
  private String destination;

  @Column(nullable = false)
  private Double destinationLatitude;

  @Column(nullable = false)
  private Double destinationLongitude;

  // =========================
  // RIDE STATUS
  // =========================

  public enum RideStatus {
    SCHEDULED,
    STARTED,
    COMPLETED,
    CANCELLED,
    EXPIRED
  }

  // =========================
  // CANCELLATION ACTOR
  // =========================

  public enum CancellationActor {
    DRIVER,
    ADMIN,
    SYSTEM
  }
}
