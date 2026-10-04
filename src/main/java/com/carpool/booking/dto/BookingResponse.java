package com.carpool.booking.dto;

import com.carpool.booking.entity.Booking;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

  private String rejectionReason;
  private LocalDateTime rejectedAt;

  private Booking.CancellationActor cancelledBy;
  private Booking.CancellationReason cancellationReason;
  private LocalDateTime cancelledAt;

  private Long passengerId;
  private String passengerName;
  private String passengerEmail;
  private String passengerPhone;
}
