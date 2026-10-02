package com.carpool.user.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/users")
public class UserViewController {

  @GetMapping
  public String usersPage() {
    return "user/users";
  }

  @GetMapping("/new")
  public String createUserPage() {
    return "user/user-form";
  }

  @GetMapping("/{id}")
  public String userDetailsPage() {
    return "user/details";
  }

  @GetMapping("/{id}/edit")
  public String editUserPage() {
    return "user/user-form";
  }
}
