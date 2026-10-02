package com.carpool.vehicle.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class VehiclePageController {

  @GetMapping("/vehicles")
  public String vehiclesPage() {
    return "vehicle/vehicles";
  }

  @GetMapping("/vehicles/create")
  public String createVehiclePage() {
    return "vehicle/vehicle-form";
  }
}
