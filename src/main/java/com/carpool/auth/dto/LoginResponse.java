package com.carpool.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String message;
    private String email;
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
}