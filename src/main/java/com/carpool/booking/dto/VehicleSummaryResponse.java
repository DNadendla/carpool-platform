package com.carpool.booking.dto;

import com.carpool.vehicle.entity.Vehicle;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleSummaryResponse {

    private Long id;

    private String vehicleNumber;

    private String model;

    private Vehicle.VehicleType type;

    private Integer totalSeats;
}