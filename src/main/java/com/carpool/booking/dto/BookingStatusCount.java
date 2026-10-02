package com.carpool.booking.dto;

import com.carpool.booking.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BookingStatusCount {
  private Booking.BookingStatus status;
  private long count;
}
