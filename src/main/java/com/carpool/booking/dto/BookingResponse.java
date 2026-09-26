package com.carpool.booking.dto;

import com.carpool.booking.entity.Booking;
import com.carpool.booking.entity.Booking.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private Long id;

    private RideSummaryResponse ride;

    private Integer seats;

    private BigDecimal totalAmount;

    private Booking.BookingStatus status;

    private LocalDateTime bookedAt;
}