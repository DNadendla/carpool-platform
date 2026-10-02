package com.carpool.exception;

import com.carpool.booking.exception.BookingNotAllowedException;
import com.carpool.booking.exception.InsufficientSeatsException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  // =========================================================
  // 401 - Invalid login credentials
  // =========================================================

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(
      BadCredentialsException ex, HttpServletRequest request) {

    return buildErrorResponse(
        HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid email or password", request);
  }

  // =========================================================
  // 404 - Resource not found
  // =========================================================

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(
      ResourceNotFoundException ex, HttpServletRequest request) {

    return buildErrorResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request);
  }

  // =========================================================
  // 409 - Duplicate resource
  // =========================================================

  @ExceptionHandler(DuplicateResourceException.class)
  public ResponseEntity<ErrorResponse> handleDuplicate(
      DuplicateResourceException ex, HttpServletRequest request) {

    return buildErrorResponse(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", ex.getMessage(), request);
  }

  // =========================================================
  // 400 - Bean validation errors
  // =========================================================

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {

    Map<String, String> errors = new HashMap<>();

    ex.getBindingResult()
        .getFieldErrors()
        .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

    ErrorResponse response =
        ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .error("VALIDATION_ERROR")
            .message("Request validation failed")
            .path(request.getRequestURI())
            .timestamp(LocalDateTime.now())
            .errors(errors)
            .build();

    return ResponseEntity.badRequest().body(response);
  }

  // =========================================================
  // 403 - Operation not allowed
  // =========================================================

  @ExceptionHandler(OperationNotAllowedException.class)
  public ResponseEntity<ErrorResponse> handleOperationNotAllowed(
      OperationNotAllowedException ex, HttpServletRequest request) {

    return buildErrorResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage(), request);
  }

  // =========================================================
  // 400 - Business validation
  // =========================================================

  @ExceptionHandler(BusinessValidationException.class)
  public ResponseEntity<ErrorResponse> handleBusinessValidation(
      BusinessValidationException ex, HttpServletRequest request) {

    return buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request);
  }

  // =========================================================
  // 409 - Resource state conflict
  // =========================================================

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ErrorResponse> handleConflict(
      ConflictException ex, HttpServletRequest request) {

    return buildErrorResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request);
  }

  // =========================================================
  // 403 / Booking operation not allowed
  // =========================================================

  @ExceptionHandler(BookingNotAllowedException.class)
  public ResponseEntity<ErrorResponse> handleBookingNotAllowed(
      BookingNotAllowedException ex, HttpServletRequest request) {

    return buildErrorResponse(
        HttpStatus.FORBIDDEN, "BOOKING_NOT_ALLOWED", ex.getMessage(), request);
  }

  // =========================================================
  // 409 - Insufficient seats
  // =========================================================

  @ExceptionHandler(InsufficientSeatsException.class)
  public ResponseEntity<ErrorResponse> handleInsufficientSeats(
      InsufficientSeatsException ex, HttpServletRequest request) {

    return buildErrorResponse(HttpStatus.CONFLICT, "INSUFFICIENT_SEATS", ex.getMessage(), request);
  }

  // =========================================================
  // Common ErrorResponse builder
  // =========================================================

  private ResponseEntity<ErrorResponse> buildErrorResponse(
      HttpStatus status, String error, String message, HttpServletRequest request) {

    ErrorResponse response =
        ErrorResponse.builder()
            .status(status.value())
            .error(error)
            .message(message)
            .path(request.getRequestURI())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(status).body(response);
  }
}
