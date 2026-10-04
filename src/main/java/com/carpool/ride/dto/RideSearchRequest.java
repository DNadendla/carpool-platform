package com.carpool.ride.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideSearchRequest {

  @NotNull(message = "Source latitude is required")
  private Double sourceLatitude;

  @NotNull(message = "Source longitude is required")
  private Double sourceLongitude;

  @NotNull(message = "Destination latitude is required")
  private Double destinationLatitude;

  @NotNull(message = "Destination longitude is required")
  private Double destinationLongitude;

  @Builder.Default private Double radiusKm = 10.0;
}
