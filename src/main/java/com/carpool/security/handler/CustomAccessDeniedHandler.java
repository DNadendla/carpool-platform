package com.carpool.security.handler;

import com.carpool.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

  private final ObjectMapper objectMapper;

  public CustomAccessDeniedHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void handle(
      HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException) {
    ErrorResponse errorResponse =
        ErrorResponse.builder()
            .status(HttpServletResponse.SC_FORBIDDEN)
            .error("FORBIDDEN")
            .message("You do not have permission to perform this action")
            .path(request.getRequestURI())
            .timestamp(LocalDateTime.now())
            .build();
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    try {
      objectMapper.writeValue(response.getOutputStream(), errorResponse);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
