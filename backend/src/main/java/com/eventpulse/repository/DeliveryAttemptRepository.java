package com.eventpulse.repository;

import com.eventpulse.entity.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for DeliveryAttempt audit logs.
 */
@Repository
public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {

    List<DeliveryAttempt> findAllByDeliveryIdOrderByAttemptNumberAsc(UUID deliveryId);

    List<DeliveryAttempt> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    @Query("SELECT d.latencyMs FROM DeliveryAttempt d WHERE d.organizationId = :organizationId AND d.latencyMs IS NOT NULL ORDER BY d.createdAt DESC")
    List<Long> findRecentLatenciesByOrganizationId(@Param("organizationId") UUID organizationId);
}
