package com.eventpulse.repository;

import com.eventpulse.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for API keys with multi-tenant and project scoping.
 */
@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    Optional<ApiKey> findByKeyHashAndActiveTrue(String keyHash);

    List<ApiKey> findAllByProjectId(UUID projectId);

    List<ApiKey> findAllByOrganizationId(UUID organizationId);

    Optional<ApiKey> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<ApiKey> findByIdAndProjectId(UUID id, UUID projectId);
}
