package com.carpool.ride.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideRequest {

  @NotNull(message = "Vehicle ID is required")
  private Long vehicleId;

  @NotNull(message = "Departure time is required")
  @Future(message = "Departure time must be in the future")
  private LocalDateTime departureTime;

  @NotNull(message = "Available seats are required")
  @Min(value = 1, message = "At least one seat must be available")
  private Integer availableSeats;

  @NotNull(message = "Price per seat is required")
  @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
  private BigDecimal pricePerSeat;

  @NotBlank(message = "Source is required")
  private String source;

  @NotNull(message = "Source latitude is required")
  private Double sourceLatitude;

  @NotNull(message = "Source longitude is required")
  private Double sourceLongitude;

  @NotBlank(message = "Destination is required")
  private String destination;

  @NotNull(message = "Destination latitude is required")
  private Double destinationLatitude;

  @NotNull(message = "Destination longitude is required")
  private Double destinationLongitude;
}
