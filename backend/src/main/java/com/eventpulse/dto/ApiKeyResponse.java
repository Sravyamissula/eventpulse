package com.eventpulse.dto;

import com.eventpulse.entity.ApiKey;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ApiKeyResponse {

    private UUID id;
    private UUID organizationId;
    private UUID projectId;
    private String name;
    private String keyPrefix;
    private boolean active;
    private OffsetDateTime expiresAt;
    private OffsetDateTime lastUsedAt;
    private OffsetDateTime createdAt;

    public ApiKeyResponse() {
    }

    public ApiKeyResponse(UUID id, UUID organizationId, UUID projectId, String name,
                          String keyPrefix, boolean active, OffsetDateTime expiresAt,
                          OffsetDateTime lastUsedAt, OffsetDateTime createdAt) {
        this.id = id;
        this.organizationId = organizationId;
        this.projectId = projectId;
        this.name = name;
        this.keyPrefix = keyPrefix;
        this.active = active;
        this.expiresAt = expiresAt;
        this.lastUsedAt = lastUsedAt;
        this.createdAt = createdAt;
    }

    public static ApiKeyResponse fromEntity(ApiKey apiKey) {
        return new ApiKeyResponse(
                apiKey.getId(),
                apiKey.getOrganizationId(),
                apiKey.getProjectId(),
                apiKey.getName(),
                apiKey.getKeyPrefix(),
                apiKey.isActive(),
                apiKey.getExpiresAt(),
                apiKey.getLastUsedAt(),
                apiKey.getCreatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public void setKeyPrefix(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public OffsetDateTime getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(OffsetDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
