package com.carpool.security.handler;

import com.carpool.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException) {
    ErrorResponse errorResponse =
        ErrorResponse.builder()
            .status(HttpServletResponse.SC_UNAUTHORIZED)
            .error("UNAUTHORIZED")
            .message("Authentication is required")
            .path(request.getRequestURI())
            .timestamp(LocalDateTime.now())
            .build();
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    try {
      objectMapper.writeValue(response.getOutputStream(), errorResponse);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
