package com.eventpulse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Entity representing an external webhook destination endpoint.
 * Tracks endpoint URL, signing secret, health status, and circuit breaker state.
 */
@Entity
@Table(name = "webhook_endpoints")
public class WebhookEndpoint {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "url", nullable = false, length = 1024)
    private String url;

    @Column(name = "secret_token", nullable = false)
    private String secretToken;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @Column(name = "circuit_state", nullable = false)
    private String circuitState = "CLOSED";

    @Column(name = "failure_count", nullable = false)
    private int failureCount = 0;

    @Column(name = "rate_limit_per_minute", nullable = false)
    private int rateLimitPerMinute = 60;

    @Column(name = "circuit_opened_at")
    private OffsetDateTime circuitOpenedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public WebhookEndpoint() {
    }

    public WebhookEndpoint(UUID organizationId, UUID projectId, String name, String url, String secretToken) {
        this.organizationId = organizationId;
        this.projectId = projectId;
        this.name = name;
        this.url = url;
        this.secretToken = secretToken;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WebhookEndpoint that = (WebhookEndpoint) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "WebhookEndpoint{" +
                "id=" + id +
                ", organizationId=" + organizationId +
                ", projectId=" + projectId +
                ", name='" + name + '\'' +
                ", url='" + url + '\'' +
                ", status='" + status + '\'' +
                ", circuitState='" + circuitState + '\'' +
                '}';
    }
}
