package com.carpool.ride.controller;

import com.carpool.ride.dto.RideRequest;
import com.carpool.ride.dto.RideResponse;
import com.carpool.ride.service.RideService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    private final RideService rideService;

    public RideController(RideService rideService) {
        this.rideService = rideService;
    }

    @PostMapping
    public ResponseEntity<RideResponse> createRide(
            @Valid @RequestBody RideRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(rideService.createRide(request));
    }


    @GetMapping
    public ResponseEntity<List<RideResponse>> getAllRides() {

        return ResponseEntity.ok(
                rideService.getAllRides()
        );
    }


    @GetMapping("/my")
    public ResponseEntity<List<RideResponse>> getMyRides() {

        return ResponseEntity.ok(
                rideService.getMyRides()
        );
    }


    @GetMapping("/search")
    public ResponseEntity<List<RideResponse>> searchRides(
            @RequestParam String source,
            @RequestParam String destination) {

        return ResponseEntity.ok(
                rideService.searchRides(
                        source,
                        destination
                )
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<RideResponse> getRideById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                rideService.getRideById(id)
        );
    }


    @PatchMapping("/{id}/cancel")
    public ResponseEntity<RideResponse> cancelRide(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                rideService.cancelRide(id)
        );
    }
}

/**
 * | Situation                                |    HTTP |
 * | ---------------------------------------- | ------: |
 * | No JWT                                   | **401** |
 * | Invalid/expired JWT                      | **401** |
 * | Wrong email/password                     | **401** |
 * | Ride doesn't exist                       | **404** |
 * | Vehicle doesn't exist                    | **404** |
 * | User tries to use another user's vehicle | **403** |
 * | User tries to cancel another user's ride | **403** |
 * | Seats exceed vehicle capacity            | **400** |
 * | Source = destination                     | **400** |
 * | Ride already cancelled                   | **409** |
 * | Insufficient seats during booking        | **409** |
 * | Duplicate booking                        | **409** |
 */