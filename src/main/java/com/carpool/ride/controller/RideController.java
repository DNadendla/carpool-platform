package com.carpool.ride.controller;

import com.carpool.ride.dto.RidePageResponse;
import com.carpool.ride.dto.RideRequest;
import com.carpool.ride.dto.RideResponse;
import com.carpool.ride.service.RideService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rides")
public class RideController {

  private final RideService rideService;

  public RideController(RideService rideService) {

    this.rideService = rideService;
  }

  // =====================================================
  // CREATE RIDE
  // =====================================================

  @PostMapping
  public ResponseEntity<RideResponse> createRide(@Valid @RequestBody RideRequest request) {

    return ResponseEntity.status(HttpStatus.CREATED).body(rideService.createRide(request));
  }

  // =====================================================
  // GET AVAILABLE RIDES - PAGINATED
  // =====================================================

  @GetMapping
  public ResponseEntity<RidePageResponse> getAvailableRides(Pageable pageable) {

    return ResponseEntity.ok(rideService.getAvailableRides(pageable));
  }

  // =====================================================
  // SEARCH AVAILABLE RIDES - PAGINATED
  // =====================================================

  @GetMapping("/search")
  public ResponseEntity<RidePageResponse> searchRides(
      @RequestParam String source, @RequestParam String destination, Pageable pageable) {

    return ResponseEntity.ok(rideService.searchRides(source, destination, pageable));
  }

  // =====================================================
  // GET RIDE BY ID
  // =====================================================

  @GetMapping("/{id}")
  public ResponseEntity<RideResponse> getRideById(@PathVariable Long id) {

    return ResponseEntity.ok(rideService.getRideById(id));
  }

  // =====================================================
  // GET MY RIDES
  // =====================================================

  @GetMapping("/my")
  public ResponseEntity<RidePageResponse> getMyRides(
      @RequestParam(required = false) com.carpool.ride.entity.Ride.RideStatus status,
      Pageable pageable) {

    return ResponseEntity.ok(rideService.getMyRides(status, pageable));
  }

  // =====================================================
  // CANCEL RIDE
  // =====================================================

  @PatchMapping("/{id}/cancel")
  public ResponseEntity<RideResponse> cancelRide(@PathVariable Long id) {

    return ResponseEntity.ok(rideService.cancelRide(id));
  }
}
