package com.carpool.vehicle.dto;

import com.carpool.vehicle.entity.Vehicle.VehicleType;
import jakarta.validation.constraints.*;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleRequest {

    @NotBlank(message = "Vehicle number is required")
    private String vehicleNumber;

    @NotBlank(message = "Vehicle model is required")
    private String model;

    @NotNull(message = "Vehicle type is required")
    private VehicleType type;

    @NotNull(message = "Total seats are required")
    @Min(value = 1, message = "Vehicle must have at least 1 seat")
    @Max(value = 10, message = "Vehicle cannot have more than 10 seats")
    private Integer totalSeats;

}