package com.eventpulse.security;

import com.eventpulse.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Service managing JWT generation, cryptographic signing, parsing, and claim validation.
 * Uses HMAC-SHA256 (HS256) with a secret supplied via environment configuration.
 */
@Service
public class JwtService {

    private final String rawSecret;
    private final long expirationSeconds;
    private SecretKey signingKey;

    public JwtService(
            @Value("${eventpulse.jwt.secret:${EVENTPULSE_JWT_SECRET:}}") String rawSecret,
            @Value("${eventpulse.jwt.expiration-seconds:${EVENTPULSE_JWT_EXPIRATION_SECONDS:3600}}") long expirationSeconds) {
        this.rawSecret = rawSecret;
        this.expirationSeconds = expirationSeconds;
    }

    @PostConstruct
    public void init() {
        if (rawSecret == null || rawSecret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret must be configured via EVENTPULSE_JWT_SECRET (minimum 256 bits / 32 bytes)");
        }
        this.signingKey = createSigningKey(this.rawSecret);
    }

    private SecretKey createSigningKey(String secret) {
        byte[] keyBytes;
        try {
            // Attempt base64 decoding if the secret is base64 encoded
            keyBytes = Decoders.BASE64.decode(secret.trim());
            if (keyBytes.length < 32) {
                keyBytes = secret.trim().getBytes(StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            keyBytes = secret.trim().getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 256 bits (32 bytes) for HS256 signing");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT for the authenticated user.
     *
     * @param user user entity containing id, organizationId, and email
     * @return compact signed JWT string
     */
    public String generateToken(User user) {
        return generateToken(user.getId(), user.getOrganizationId(), user.getEmail());
    }

    /**
     * Generates a signed JWT with user and tenant identities.
     *
     * @param userId user UUID
     * @param organizationId organization UUID
     * @param email normalized user email
     * @return compact signed JWT string
     */
    public String generateToken(UUID userId, UUID organizationId, String email) {
        return generateTokenWithExpiry(userId, organizationId, email, expirationSeconds * 1000L);
    }

    /**
     * Generates a signed JWT with customizable validity duration (used for token generation and test scenarios).
     *
     * @param userId user UUID
     * @param organizationId organization UUID
     * @param email normalized user email
     * @param validityDurationMs validity duration in milliseconds
     * @return compact signed JWT string
     */
    public String generateTokenWithExpiry(UUID userId, UUID organizationId, String email, long validityDurationMs) {
        long nowMs = System.currentTimeMillis();
        Date issuedAt = new Date(nowMs);
        Date expiration = new Date(nowMs + validityDurationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("organization_id", organizationId.toString())
                .claim("email", email)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Validates signature, expiration, and extracts claims from the JWT.
     *
     * @param token compact JWT string
     * @return verified JWT Claims
     * @throws JwtException if token is invalid, expired, malformed, or untrusted
     */
    public Claims validateAndExtractClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // Enforce required claims presence
        if (claims.getSubject() == null || claims.getSubject().isBlank()) {
            throw new JwtException("JWT is missing required 'sub' subject claim");
        }
        if (claims.get("organization_id", String.class) == null || claims.get("organization_id", String.class).isBlank()) {
            throw new JwtException("JWT is missing required 'organization_id' claim");
        }
        if (claims.get("email", String.class) == null || claims.get("email", String.class).isBlank()) {
            throw new JwtException("JWT is missing required 'email' claim");
        }

        return claims;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    SecretKey getSigningKey() {
        return signingKey;
    }
}
