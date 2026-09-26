package com.carpool.booking.controller;

import com.carpool.booking.dto.BookingRequest;
import com.carpool.booking.dto.BookingResponse;
import com.carpool.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(
            BookingService bookingService) {

        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        bookingService.createBooking(request)
                );
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bookingService.getBookingById(id)
        );
    }

    @GetMapping("/passenger/{passengerId}")
    public ResponseEntity<List<BookingResponse>>
    getBookingsByPassenger(
            @PathVariable Long passengerId) {

        return ResponseEntity.ok(
                bookingService.getBookingsByPassenger(
                        passengerId
                )
        );
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<List<BookingResponse>>
    getBookingsByRide(
            @PathVariable Long rideId) {

        return ResponseEntity.ok(
                bookingService.getBookingsByRide(
                        rideId
                )
        );
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        return ResponseEntity.ok(
                bookingService.getMyBookings()
        );
    }
}