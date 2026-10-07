package com.eventpulse.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Locale;
import java.util.UUID;

/**
 * Data transfer object representing a login request.
 * Requires organizationId, email, and password to unambiguously authenticate
 * in the multi-tenant schema.
 */
public class LoginRequest {

    @NotNull(message = "Organization ID is required")
    private UUID organizationId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(UUID organizationId, String email, String password) {
        this.organizationId = organizationId;
        setEmail(email);
        this.password = password;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase(Locale.ROOT) : null;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "LoginRequest{" +
                "organizationId=" + organizationId +
                ", email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
