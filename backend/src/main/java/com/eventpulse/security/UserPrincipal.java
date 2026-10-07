package com.eventpulse.security;

import java.security.Principal;
import java.util.Objects;
import java.util.UUID;

/**
 * Principal representing the authenticated user within the multi-tenant context.
 * Carries tenant and user identities extracted from validated JWT claims.
 */
public class UserPrincipal implements Principal {

    private final UUID userId;
    private final UUID organizationId;
    private final String email;

    public UserPrincipal(UUID userId, UUID organizationId, String email) {
        this.userId = userId;
        this.organizationId = organizationId;
        this.email = email;
    }

    @Override
    public String getName() {
        return userId != null ? userId.toString() : null;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(userId, that.userId) &&
                Objects.equals(organizationId, that.organizationId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, organizationId);
    }

    @Override
    public String toString() {
        return "UserPrincipal{" +
                "userId=" + userId +
                ", organizationId=" + organizationId +
                ", email='" + email + '\'' +
                '}';
    }
}
