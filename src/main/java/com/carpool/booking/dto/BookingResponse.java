package com.carpool.booking.dto;

import com.carpool.booking.entity.Booking;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

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

  private Booking.CancellationActor cancelledBy;
  private Booking.CancellationReason cancellationReason;
  private LocalDateTime cancelledAt;
}
