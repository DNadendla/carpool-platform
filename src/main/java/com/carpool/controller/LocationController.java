package com.carpool.controller;

import com.carpool.service.GeoapifyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final GeoapifyService geoapifyService;

    public LocationController(GeoapifyService geoapifyService) {
        this.geoapifyService = geoapifyService;
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<JsonNode> autocomplete(@RequestParam String text) {

        if (text == null || text.trim().length() < 3) {
            return ResponseEntity.badRequest().build();
        }

        JsonNode result = geoapifyService.autocomplete(text.trim());

        return ResponseEntity.ok(result);
    }
}