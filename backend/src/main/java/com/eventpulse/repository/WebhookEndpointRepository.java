package com.eventpulse.repository;

import com.eventpulse.entity.WebhookEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for WebhookEndpoint entity with tenant & project scoping.
 */
@Repository
public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, UUID> {

    List<WebhookEndpoint> findAllByProjectId(UUID projectId);

    List<WebhookEndpoint> findAllByProjectIdAndStatus(UUID projectId, String status);

    List<WebhookEndpoint> findAllByOrganizationId(UUID organizationId);

    Optional<WebhookEndpoint> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<WebhookEndpoint> findByIdAndProjectId(UUID id, UUID projectId);
}
