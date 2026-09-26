package com.carpool.vehicle.repository;

import com.carpool.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository
        extends JpaRepository<Vehicle, Long> {

    boolean existsByVehicleNumber(String vehicleNumber);

    List<Vehicle> findByOwnerId(Long ownerId);
}