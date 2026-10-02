package com.carpool.ride.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RidePageResponse {

  private List<RideResponse> content;

  private int page;

  private int size;

  private long totalElements;

  private int totalPages;

  private boolean first;

  private boolean last;

  private RideCountsResponse counts;
}
