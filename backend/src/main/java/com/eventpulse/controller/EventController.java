package com.eventpulse.controller;

import com.eventpulse.dto.EventIngestRequest;
import com.eventpulse.dto.EventIngestResponse;
import com.eventpulse.entity.DeliveryAttempt;
import com.eventpulse.entity.Event;
import com.eventpulse.entity.EventDelivery;
import com.eventpulse.exception.ResourceNotFoundException;
import com.eventpulse.repository.DeliveryAttemptRepository;
import com.eventpulse.repository.EventDeliveryRepository;
import com.eventpulse.repository.EventRepository;
import com.eventpulse.security.ApiKeyPrincipal;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.EventIngestionService;
import com.eventpulse.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for event ingestion and event/delivery inspection.
 * Supports authentication via X-API-Key for external machines and Bearer JWT for dashboard users.
 */
@RestController
public class EventController {

    private final EventIngestionService ingestionService;
    private final EventRepository eventRepository;
    private final EventDeliveryRepository deliveryRepository;
    private final DeliveryAttemptRepository attemptRepository;
    private final ProjectService projectService;

    public EventController(EventIngestionService ingestionService,
                           EventRepository eventRepository,
                           EventDeliveryRepository deliveryRepository,
                           DeliveryAttemptRepository attemptRepository,
                           ProjectService projectService) {
        this.ingestionService = ingestionService;
        this.eventRepository = eventRepository;
        this.deliveryRepository = deliveryRepository;
        this.attemptRepository = attemptRepository;
        this.projectService = projectService;
    }

    @PostMapping("/api/v1/events")
    public ResponseEntity<EventIngestResponse> ingestEvent(
            @Valid @RequestBody EventIngestRequest request,
            @RequestParam(value = "projectId", required = false) UUID paramProjectId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String xIdempotencyKeyHeader) {

        if (request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank()) {
            if (idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank()) {
                request.setIdempotencyKey(idempotencyKeyHeader.trim());
            } else if (xIdempotencyKeyHeader != null && !xIdempotencyKeyHeader.isBlank()) {
                request.setIdempotencyKey(xIdempotencyKeyHeader.trim());
            }
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication != null ? authentication.getPrincipal() : null;

        UUID orgId;
        UUID projectId;

        if (principal instanceof ApiKeyPrincipal apiKeyPrincipal) {
            orgId = apiKeyPrincipal.getOrganizationId();
            projectId = apiKeyPrincipal.getProjectId();
        } else if (principal instanceof UserPrincipal userPrincipal) {
            orgId = userPrincipal.getOrganizationId();
            if (paramProjectId == null) {
                return ResponseEntity.badRequest().build();
            }
            projectService.getProjectEntity(orgId, paramProjectId);
            projectId = paramProjectId;
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        EventIngestResponse response = ingestionService.ingestEvent(orgId, projectId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/api/projects/{projectId}/events")
    public ResponseEntity<List<Event>> getEvents(
            @PathVariable("projectId") UUID projectId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getPrincipal() instanceof UserPrincipal up) {
            projectService.getProjectEntity(up.getOrganizationId(), projectId);
        }
        List<Event> events = eventRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/api/projects/{projectId}/events/{eventId}")
    public ResponseEntity<Event> getEvent(
            @PathVariable("projectId") UUID projectId,
            @PathVariable("eventId") UUID eventId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getPrincipal() instanceof UserPrincipal up) {
            projectService.getProjectEntity(up.getOrganizationId(), projectId);
        }
        Event event = eventRepository.findById(eventId)
                .filter(e -> e.getProjectId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
        return ResponseEntity.ok(event);
    }

    @GetMapping("/api/projects/{projectId}/events/{eventId}/deliveries")
    public ResponseEntity<List<EventDelivery>> getEventDeliveries(
            @PathVariable("projectId") UUID projectId,
            @PathVariable("eventId") UUID eventId) {
        List<EventDelivery> deliveries = deliveryRepository.findAllByEventId(eventId);
        return ResponseEntity.ok(deliveries);
    }

    @GetMapping("/api/projects/{projectId}/deliveries")
    public ResponseEntity<List<EventDelivery>> getProjectDeliveries(
            @PathVariable("projectId") UUID projectId) {
        List<EventDelivery> deliveries = deliveryRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId);
        return ResponseEntity.ok(deliveries);
    }

    @GetMapping("/api/projects/{projectId}/deliveries/{deliveryId}/attempts")
    public ResponseEntity<List<DeliveryAttempt>> getDeliveryAttempts(
            @PathVariable("projectId") UUID projectId,
            @PathVariable("deliveryId") UUID deliveryId) {
        List<DeliveryAttempt> attempts = attemptRepository.findAllByDeliveryIdOrderByAttemptNumberAsc(deliveryId);
        return ResponseEntity.ok(attempts);
    }
}
