package com.eventpulse.dto;

import com.eventpulse.entity.ApiKey;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ApiKeyCreatedResponse {

    private UUID id;
    private UUID organizationId;
    private UUID projectId;
    private String name;
    private String keyPrefix;
    private String apiKey; // Full plaintext key returned ONLY once upon creation
    private boolean active;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;

    public ApiKeyCreatedResponse() {
    }

    public ApiKeyCreatedResponse(UUID id, UUID organizationId, UUID projectId, String name,
                                 String keyPrefix, String apiKey, boolean active,
                                 OffsetDateTime expiresAt, OffsetDateTime createdAt) {
        this.id = id;
        this.organizationId = organizationId;
        this.projectId = projectId;
        this.name = name;
        this.keyPrefix = keyPrefix;
        this.apiKey = apiKey;
        this.active = active;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public static ApiKeyCreatedResponse fromEntity(ApiKey entity, String rawKey) {
        return new ApiKeyCreatedResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getKeyPrefix(),
                rawKey,
                entity.isActive(),
                entity.getExpiresAt(),
                entity.getCreatedAt()
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

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
