package com.carpool.user.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/users")
public class UserViewController {

    @GetMapping
    public String usersPage() {
        return "users/list";
    }

    @GetMapping("/new")
    public String createUserPage() {
        return "users/form";
    }

    @GetMapping("/{id}")
    public String userDetailsPage() {
        return "users/details";
    }

    @GetMapping("/{id}/edit")
    public String editUserPage() {
        return "users/form";
    }
}