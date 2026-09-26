package com.carpool.auth.service;

import com.carpool.auth.dto.LoginRequest;
import com.carpool.auth.dto.LoginResponse;
import com.carpool.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final long jwtExpiration;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       @Value("${jwt.expiration}") long jwtExpiration) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.jwtExpiration = jwtExpiration;
    }

    public LoginResponse login(LoginRequest request) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getEmail(),
                                request.getPassword()
                        )
                );

        String token =
                jwtService.generateToken(
                        (org.springframework.security.core.userdetails.UserDetails)
                                authentication.getPrincipal()
                );

        return LoginResponse.builder()
                .message("Login successful")
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .email(authentication.getName())
                .build();
    }
}