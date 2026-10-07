package com.eventpulse.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data transfer object returned after successful registration.
 * Explicitly excludes password, passwordHash, and authentication tokens.
 */
public class RegisterResponse {

    private UUID organizationId;
    private String organizationName;
    private UUID userId;
    private String email;
    private OffsetDateTime createdAt;

    public RegisterResponse() {
    }

    public RegisterResponse(UUID organizationId, String organizationName, UUID userId, String email, OffsetDateTime createdAt) {
        this.organizationId = organizationId;
        this.organizationName = organizationName;
        this.userId = userId;
        this.email = email;
        this.createdAt = createdAt;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "RegisterResponse{" +
                "organizationId=" + organizationId +
                ", organizationName='" + organizationName + '\'' +
                ", userId=" + userId +
                ", email='" + email + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
