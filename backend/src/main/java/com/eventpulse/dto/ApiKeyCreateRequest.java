package com.eventpulse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class ApiKeyCreateRequest {

    @NotBlank(message = "API key name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    private OffsetDateTime expiresAt;

    public ApiKeyCreateRequest() {
    }

    public ApiKeyCreateRequest(String name) {
        this.name = name;
    }

    public ApiKeyCreateRequest(String name, OffsetDateTime expiresAt) {
        this.name = name;
        this.expiresAt = expiresAt;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
