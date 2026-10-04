package com.carpool.auth.service;

import com.carpool.auth.dto.LoginRequest;
import com.carpool.auth.dto.LoginResponse;
import com.carpool.security.JwtService;
import com.carpool.user.entity.User;
import com.carpool.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final AuthenticationManager authenticationManager;

  private final JwtService jwtService;

  private final UserDetailsService userDetailsService;

  private final UserRepository userRepository;

  private final long jwtExpiration;

  public AuthService(
      AuthenticationManager authenticationManager,
      JwtService jwtService,
      UserDetailsService userDetailsService,
      UserRepository userRepository,
      @Value("${jwt.expiration}") long jwtExpiration) {

    this.authenticationManager = authenticationManager;

    this.jwtService = jwtService;

    this.userDetailsService = userDetailsService;

    this.userRepository = userRepository;

    this.jwtExpiration = jwtExpiration;
  }

  // =========================================================
  // LOGIN
  // =========================================================

  public LoginResponse login(LoginRequest request) {

    Authentication authentication =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();

    String accessToken = jwtService.generateToken(userDetails);

    String refreshToken = jwtService.generateRefreshToken(userDetails);

    User user =
        userRepository
            .findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

    return LoginResponse.builder()
        .message("Login successful")
        .userId(user.getId())
        .email(authentication.getName())
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .tokenType("Bearer")
        .expiresIn(jwtExpiration)
        .build();
  }

  // =========================================================
  // REFRESH ACCESS TOKEN
  // =========================================================

  public LoginResponse refresh(String refreshToken) {

    if (refreshToken == null || refreshToken.isBlank()) {

      throw new IllegalArgumentException("Refresh token is required");
    }

    if (!jwtService.isRefreshToken(refreshToken)) {

      throw new IllegalArgumentException("Invalid refresh token");
    }

    if (jwtService.isTokenExpired(refreshToken)) {

      throw new IllegalArgumentException("Refresh token has expired");
    }

    String username = jwtService.extractUsername(refreshToken);

    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

    if (!jwtService.isTokenValid(refreshToken, userDetails)) {

      throw new IllegalArgumentException("Invalid refresh token");
    }

    String newAccessToken = jwtService.generateToken(userDetails);

    User user =
        userRepository
            .findByEmail(username)
            .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

    return LoginResponse.builder()
        .message("Session extended")
        .userId(user.getId())
        .accessToken(newAccessToken)
        .tokenType("Bearer")
        .expiresIn(jwtExpiration)
        .email(username)
        .build();
  }
}
