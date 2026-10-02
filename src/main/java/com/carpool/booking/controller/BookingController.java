package com.carpool.booking.controller;

import com.carpool.booking.dto.BookingRequest;
import com.carpool.booking.dto.BookingResponse;
import com.carpool.booking.dto.MyBookingsResponse;
import com.carpool.booking.entity.Booking;
import com.carpool.booking.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {

    this.bookingService = bookingService;
  }

  @PostMapping
  public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {

    return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
  }

  @GetMapping("/my")
  public ResponseEntity<MyBookingsResponse> getMyBookings(
      @RequestParam(required = false) Booking.BookingStatus status,
      @PageableDefault(size = 10, sort = "bookedAt", direction = Sort.Direction.DESC)
          Pageable pageable) {

    return ResponseEntity.ok(bookingService.getMyBookings(status, pageable));
  }

  @GetMapping("/{id}")
  public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {

    return ResponseEntity.ok(bookingService.getBookingById(id));
  }

  @GetMapping("/ride/{rideId}")
  public ResponseEntity<List<BookingResponse>> getBookingsByRide(@PathVariable Long rideId) {

    return ResponseEntity.ok(bookingService.getBookingsByRide(rideId));
  }

  @PatchMapping("/{id}/cancel")
  public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
    return ResponseEntity.ok(bookingService.cancelBooking(id));
  }
}
