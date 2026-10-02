package com.carpool.booking.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverSummaryResponse {

  private Long id;

  private String name;
}
