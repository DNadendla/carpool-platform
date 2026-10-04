package com.carpool.ride.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideCancellationRequest {

  @NotBlank(message = "Cancellation reason is required")
  @Size(max = 500, message = "Cancellation reason cannot exceed 500 characters")
  private String reason;
}
