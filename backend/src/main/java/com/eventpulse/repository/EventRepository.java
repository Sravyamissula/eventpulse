package com.eventpulse.repository;

import com.eventpulse.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for immutable Event records.
 */
@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    Optional<Event> findByProjectIdAndIdempotencyKey(UUID projectId, String idempotencyKey);

    List<Event> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Page<Event> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    List<Event> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Page<Event> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    Optional<Event> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByProjectId(UUID projectId);

    long countByOrganizationId(UUID organizationId);
}
