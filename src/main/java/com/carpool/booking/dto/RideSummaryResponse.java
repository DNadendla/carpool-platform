package com.carpool.booking.dto;

import com.carpool.ride.entity.Ride;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideSummaryResponse {

  private Long id;

  private String source;

  private String destination;

  private LocalDateTime departureTime;

  private Integer availableSeats;

  private BigDecimal pricePerSeat;

  private DriverSummaryResponse driver;

  private VehicleSummaryResponse vehicle;

  private Ride.RideStatus status;

  private Ride.CancellationActor cancelledBy;

  private LocalDateTime cancelledAt;
}
