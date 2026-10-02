package com.carpool.vehicle.dto;

import com.carpool.vehicle.entity.Vehicle.VehicleType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleResponse {

  private Long id;

  private String vehicleNumber;

  private String model;

  private VehicleType type;

  private Integer totalSeats;

  private Long ownerId;

  private String ownerName;
}
