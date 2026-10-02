package com.carpool.booking.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyBookingsResponse {

  private List<BookingResponse> content;

  private int page;

  private int size;

  private long totalElements;

  private int totalPages;

  private boolean first;

  private boolean last;

  private BookingCounts counts;
}
