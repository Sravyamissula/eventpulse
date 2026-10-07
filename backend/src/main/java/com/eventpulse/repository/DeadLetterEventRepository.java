package com.eventpulse.repository;

import com.eventpulse.entity.DeadLetterEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for DeadLetterEvent entity.
 */
@Repository
public interface DeadLetterEventRepository extends JpaRepository<DeadLetterEvent, UUID> {

    List<DeadLetterEvent> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<DeadLetterEvent> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<DeadLetterEvent> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<DeadLetterEvent> findByIdAndProjectId(UUID id, UUID projectId);

    long countByProjectId(UUID projectId);

    long countByOrganizationId(UUID organizationId);
}
