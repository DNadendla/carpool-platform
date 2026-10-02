package com.carpool.booking.exception;

public class InsufficientSeatsException extends RuntimeException {

  public InsufficientSeatsException(String message) {
    super(message);
  }
}
