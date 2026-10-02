package com.carpool.ride.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class RidePageController {

  @GetMapping("/rides")
  public String ridesPage() {
    return "ride/rides";
  }

  @GetMapping("/rides/create")
  public String createRidePage() {
    return "ride/ride-form";
  }

  @GetMapping("/rides/{id}")
  public String rideDetailsPage(@PathVariable Long id) {
    return "ride/ride-details";
  }

  @GetMapping("/rides/my")
  public String myRidesPage() {
    return "ride/my-rides";
  }
}
