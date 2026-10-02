package com.carpool.vehicle.repository;

import com.carpool.vehicle.entity.Vehicle;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

  boolean existsByVehicleNumber(String vehicleNumber);

  List<Vehicle> findByOwnerId(Long ownerId);
}
