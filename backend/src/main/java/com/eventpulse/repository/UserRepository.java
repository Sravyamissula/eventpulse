package com.eventpulse.repository;

import com.eventpulse.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for User entity with tenant-scoped operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByOrganizationIdAndEmail(UUID organizationId, String email);

    List<User> findAllByOrganizationId(UUID organizationId);

    boolean existsByOrganizationIdAndEmail(UUID organizationId, String email);
}
