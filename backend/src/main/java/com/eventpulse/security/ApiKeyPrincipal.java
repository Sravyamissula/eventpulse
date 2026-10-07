package com.eventpulse.security;

import java.security.Principal;
import java.util.Objects;
import java.util.UUID;

/**
 * Principal representing an authenticated API Key client for ingestion APIs.
 * Scoped to an organization and a specific project.
 */
public class ApiKeyPrincipal implements Principal {

    private final UUID organizationId;
    private final UUID projectId;
    private final UUID apiKeyId;
    private final String keyPrefix;

    public ApiKeyPrincipal(UUID organizationId, UUID projectId, UUID apiKeyId, String keyPrefix) {
        this.organizationId = organizationId;
        this.projectId = projectId;
        this.apiKeyId = apiKeyId;
        this.keyPrefix = keyPrefix;
    }

    @Override
    public String getName() {
        return keyPrefix != null ? keyPrefix : (apiKeyId != null ? apiKeyId.toString() : "api-client");
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getApiKeyId() {
        return apiKeyId;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ApiKeyPrincipal that = (ApiKeyPrincipal) o;
        return Objects.equals(apiKeyId, that.apiKeyId) &&
                Objects.equals(projectId, that.projectId) &&
                Objects.equals(organizationId, that.organizationId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(organizationId, projectId, apiKeyId);
    }

    @Override
    public String toString() {
        return "ApiKeyPrincipal{" +
                "organizationId=" + organizationId +
                ", projectId=" + projectId +
                ", apiKeyId=" + apiKeyId +
                ", keyPrefix='" + keyPrefix + '\'' +
                '}';
    }
}
