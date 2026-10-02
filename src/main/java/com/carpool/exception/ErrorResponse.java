package com.carpool.exception;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

  private int status;
  private String error;
  private String message;
  private String path;
  private LocalDateTime timestamp;
  private Map<String, String> errors;
}
