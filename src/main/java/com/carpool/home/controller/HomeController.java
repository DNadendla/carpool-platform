package com.carpool.home.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

  @GetMapping("/")
  public String root() {
    return "redirect:/app";
  }

  @GetMapping("/app")
  public String app() {
    return "app";
  }

  @GetMapping("/home")
  public String home() {
    return "home";
  }

  @GetMapping("/login")
  public String loginPage() {
    return "login";
  }

  @GetMapping("/register")
  public String registerPage() {
    return "register";
  }

  @GetMapping("/unauthorized")
  public String unauthorized() {
    return "unauthorized";
  }
}
