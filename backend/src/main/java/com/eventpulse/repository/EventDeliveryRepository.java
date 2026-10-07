package com.eventpulse.repository;

import com.eventpulse.entity.EventDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for EventDelivery tracking.
 */
@Repository
public interface EventDeliveryRepository extends JpaRepository<EventDelivery, UUID> {

    List<EventDelivery> findAllByEventId(UUID eventId);

    List<EventDelivery> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Page<EventDelivery> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    List<EventDelivery> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Page<EventDelivery> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    List<EventDelivery> findAllByEndpointId(UUID endpointId);

    List<EventDelivery> findAllByStatusAndNextRetryAtBefore(String status, OffsetDateTime time);

    Optional<EventDelivery> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, String status);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndStatus(UUID organizationId, String status);
}
