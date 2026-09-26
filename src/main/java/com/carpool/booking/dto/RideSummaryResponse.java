package com.carpool.booking.dto;

import com.carpool.ride.entity.Ride;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    private Ride.RideStatus status;

    private DriverSummaryResponse driver;

    private VehicleSummaryResponse vehicle;
}