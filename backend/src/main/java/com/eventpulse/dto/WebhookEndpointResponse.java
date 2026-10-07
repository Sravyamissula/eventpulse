package com.eventpulse.dto;

import com.eventpulse.entity.WebhookEndpoint;

import java.time.OffsetDateTime;
import java.util.UUID;

public class WebhookEndpointResponse {

    private UUID id;
    private UUID organizationId;
    private UUID projectId;
    private String name;
    private String url;
    private String secretToken;
    private String status;
    private String circuitState;
    private int failureCount;
    private int rateLimitPerMinute;
    private OffsetDateTime circuitOpenedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public WebhookEndpointResponse() {
    }

    public WebhookEndpointResponse(UUID id, UUID organizationId, UUID projectId, String name,
                                   String url, String secretToken, String status, String circuitState,
                                   int failureCount, int rateLimitPerMinute, OffsetDateTime circuitOpenedAt,
                                   OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.organizationId = organizationId;
        this.projectId = projectId;
        this.name = name;
        this.url = url;
        this.secretToken = secretToken;
        this.status = status;
        this.circuitState = circuitState;
        this.failureCount = failureCount;
        this.rateLimitPerMinute = rateLimitPerMinute;
        this.circuitOpenedAt = circuitOpenedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static WebhookEndpointResponse fromEntity(WebhookEndpoint endpoint) {
        return new WebhookEndpointResponse(
                endpoint.getId(),
                endpoint.getOrganizationId(),
                endpoint.getProjectId(),
                endpoint.getName(),
                endpoint.getUrl(),
                endpoint.getSecretToken(),
                endpoint.getStatus(),
                endpoint.getCircuitState(),
                endpoint.getFailureCount(),
                endpoint.getRateLimitPerMinute(),
                endpoint.getCircuitOpenedAt(),
                endpoint.getCreatedAt(),
                endpoint.getUpdatedAt()
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

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getSecretToken() {
        return secretToken;
    }

    public void setSecretToken(String secretToken) {
        this.secretToken = secretToken;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCircuitState() {
        return circuitState;
    }

    public void setCircuitState(String circuitState) {
        this.circuitState = circuitState;
    }

    public int getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }

    public int getRateLimitPerMinute() {
        return rateLimitPerMinute;
    }

    public void setRateLimitPerMinute(int rateLimitPerMinute) {
        this.rateLimitPerMinute = rateLimitPerMinute;
    }

    public OffsetDateTime getCircuitOpenedAt() {
        return circuitOpenedAt;
    }

    public void setCircuitOpenedAt(OffsetDateTime circuitOpenedAt) {
        this.circuitOpenedAt = circuitOpenedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
