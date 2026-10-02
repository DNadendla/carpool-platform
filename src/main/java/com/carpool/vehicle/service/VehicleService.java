package com.carpool.vehicle.service;

import com.carpool.exception.DuplicateResourceException;
import com.carpool.exception.ResourceNotFoundException;
import com.carpool.security.service.AuthenticatedUserService;
import com.carpool.user.entity.User;
import com.carpool.user.repository.UserRepository;
import com.carpool.vehicle.dto.VehicleRequest;
import com.carpool.vehicle.dto.VehicleResponse;
import com.carpool.vehicle.entity.Vehicle;
import com.carpool.vehicle.repository.VehicleRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VehicleService {

  private final VehicleRepository vehicleRepository;
  private final UserRepository userRepository;

  private final AuthenticatedUserService authenticatedUserService;

  public VehicleService(
      VehicleRepository vehicleRepository,
      UserRepository userRepository,
      AuthenticatedUserService authenticatedUserService) {

    this.vehicleRepository = vehicleRepository;
    this.userRepository = userRepository;
    this.authenticatedUserService = authenticatedUserService;
  }

  @Transactional(readOnly = true)
  public List<VehicleResponse> getMyVehicles() {

    Long ownerId = authenticatedUserService.getCurrentUserId();

    return vehicleRepository.findByOwnerId(ownerId).stream().map(this::mapToResponse).toList();
  }

  public VehicleResponse createVehicle(VehicleRequest request) {

    if (vehicleRepository.existsByVehicleNumber(request.getVehicleNumber())) {

      throw new DuplicateResourceException("Vehicle already exists: " + request.getVehicleNumber());
    }

    User owner = authenticatedUserService.getCurrentUser();

    Vehicle vehicle =
        Vehicle.builder()
            .vehicleNumber(request.getVehicleNumber())
            .model(request.getModel())
            .type(request.getType())
            .totalSeats(request.getTotalSeats())
            .owner(owner)
            .build();

    Vehicle savedVehicle = vehicleRepository.save(vehicle);

    return mapToResponse(savedVehicle);
  }

  @Transactional(readOnly = true)
  public List<VehicleResponse> getAllVehicles() {

    return vehicleRepository.findAll().stream().map(this::mapToResponse).toList();
  }

  @Transactional(readOnly = true)
  public VehicleResponse getVehicleById(Long id) {

    Vehicle vehicle =
        vehicleRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

    return mapToResponse(vehicle);
  }

  @Transactional(readOnly = true)
  public List<VehicleResponse> getVehiclesByOwner(Long ownerId) {

    if (!userRepository.existsById(ownerId)) {
      throw new ResourceNotFoundException("User not found with id: " + ownerId);
    }

    return vehicleRepository.findByOwnerId(ownerId).stream().map(this::mapToResponse).toList();
  }

  public VehicleResponse updateVehicle(Long id, VehicleRequest request) {

    Vehicle existingVehicle =
        vehicleRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

    User owner = authenticatedUserService.getCurrentUser();

    existingVehicle.setVehicleNumber(request.getVehicleNumber());

    existingVehicle.setModel(request.getModel());

    existingVehicle.setType(request.getType());

    existingVehicle.setTotalSeats(request.getTotalSeats());

    existingVehicle.setOwner(owner);

    Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

    return mapToResponse(updatedVehicle);
  }

  public void deleteVehicle(Long id) {

    if (!vehicleRepository.existsById(id)) {

      throw new ResourceNotFoundException("Vehicle not found with id: " + id);
    }

    vehicleRepository.deleteById(id);
  }

  private VehicleResponse mapToResponse(Vehicle vehicle) {

    return VehicleResponse.builder()
        .id(vehicle.getId())
        .vehicleNumber(vehicle.getVehicleNumber())
        .model(vehicle.getModel())
        .type(vehicle.getType())
        .totalSeats(vehicle.getTotalSeats())
        .ownerId(vehicle.getOwner().getId())
        .ownerName(vehicle.getOwner().getName())
        .build();
  }
}
