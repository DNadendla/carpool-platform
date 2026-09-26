package com.carpool.booking.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class BookingPageController {

    @GetMapping("/bookings")
    public String bookingsPage() {
        return "booking/bookings";
    }
}