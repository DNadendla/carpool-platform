package com.carpool.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingCounts {
  private long all;
  private long confirmed;
  private long pending;
  private long cancelled;
  private long rejected;
}
