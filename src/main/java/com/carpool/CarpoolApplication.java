package com.carpool;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CarpoolApplication {

  public static void main(String[] args) {
    SpringApplication.run(CarpoolApplication.class, args);
  }
}
