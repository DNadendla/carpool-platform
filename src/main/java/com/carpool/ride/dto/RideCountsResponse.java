package com.carpool.ride.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RideCountsResponse {
  private long all;
  private long scheduled;
  private long started;
  private long completed;
  private long cancelled;
}
