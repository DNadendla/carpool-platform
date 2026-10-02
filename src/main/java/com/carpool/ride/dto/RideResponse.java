package com.carpool.ride.dto;

import com.carpool.ride.entity.Ride;
import com.carpool.ride.entity.Ride.RideStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideResponse {

  private Long id;

  private Long driverId;

  private String driverName;

  private Long vehicleId;

  private String vehicleNumber;

  private String vehicleModel;

  private String source;

  private String destination;

  private LocalDateTime departureTime;

  private Integer availableSeats;

  private BigDecimal pricePerSeat;

  private RideStatus status;

  private Double sourceLatitude;
  private Double sourceLongitude;

  private Double destinationLatitude;
  private Double destinationLongitude;

  private Ride.CancellationActor cancelledBy;
  private LocalDateTime cancelledAt;
}
