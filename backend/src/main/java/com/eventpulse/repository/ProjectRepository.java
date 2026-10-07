package com.eventpulse.repository;

import com.eventpulse.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for Project entity with tenant-scoped operations.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByOrganizationIdAndName(UUID organizationId, String name);

    List<Project> findAllByOrganizationId(UUID organizationId);

    boolean existsByOrganizationIdAndName(UUID organizationId, String name);
}
