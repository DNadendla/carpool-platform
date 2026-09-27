package com.carpool.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long jwtExpiration;
    private final long refreshExpiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long jwtExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {

        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.jwtExpiration = jwtExpiration;
        this.refreshExpiration = refreshExpiration;
    }


    // =========================================================
    // ACCESS TOKEN
    // =========================================================

    public String generateToken(UserDetails userDetails) {

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + jwtExpiration
                        )
                )
                .signWith(secretKey)
                .compact();
    }


    // =========================================================
    // REFRESH TOKEN
    // =========================================================

    public String generateRefreshToken(UserDetails userDetails) {

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + refreshExpiration
                        )
                )
                .signWith(secretKey)
                .compact();
    }


    // =========================================================
    // CLAIMS
    // =========================================================

    public String extractUsername(String token) {

        return extractClaim(
                token,
                Claims::getSubject
        );
    }


    public Date extractExpiration(String token) {

        return extractClaim(
                token,
                Claims::getExpiration
        );
    }


    public String extractTokenType(String token) {

        return extractClaim(
                token,
                claims -> claims.get("type", String.class)
        );
    }


    // =========================================================
    // VALIDATION
    // =========================================================

    public boolean isTokenExpired(String token) {

        return extractExpiration(token)
                .before(new Date());
    }


    public boolean isTokenValid(
            String token,
            UserDetails userDetails) {

        String username = extractUsername(token);

        return username.equals(userDetails.getUsername())
                && !isTokenExpired(token);
    }


    public boolean isRefreshToken(String token) {
        String tokenType = extractTokenType(token);
        return "refresh".equals(tokenType);
    }


    // =========================================================
    // TOKEN EXPIRATION VALUES
    // =========================================================

    public long getJwtExpiration() {
        return jwtExpiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }


    // =========================================================
    // INTERNAL CLAIM EXTRACTION
    // =========================================================

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }


    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}