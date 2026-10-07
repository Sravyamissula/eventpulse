package com.eventpulse.controller;

import com.eventpulse.entity.DeadLetterEvent;
import com.eventpulse.entity.EventDelivery;
import com.eventpulse.exception.ResourceNotFoundException;
import com.eventpulse.repository.DeadLetterEventRepository;
import com.eventpulse.repository.EventDeliveryRepository;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.DeliveryDispatcherService;
import com.eventpulse.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for inspecting and managing Dead Letter Queue (DLQ) events.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/dlq")
public class DeadLetterQueueController {

    private final DeadLetterEventRepository dlqRepository;
    private final EventDeliveryRepository deliveryRepository;
    private final DeliveryDispatcherService dispatcherService;
    private final ProjectService projectService;

    public DeadLetterQueueController(DeadLetterEventRepository dlqRepository,
                                     EventDeliveryRepository deliveryRepository,
                                     DeliveryDispatcherService dispatcherService,
                                     ProjectService projectService) {
        this.dlqRepository = dlqRepository;
        this.deliveryRepository = deliveryRepository;
        this.dispatcherService = dispatcherService;
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<DeadLetterEvent>> getDeadLetterEvents(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId) {
        projectService.getProjectEntity(principal.getOrganizationId(), projectId);
        List<DeadLetterEvent> events = dlqRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId);
        return ResponseEntity.ok(events);
    }

    @PostMapping("/{dlqId}/retry")
    public ResponseEntity<DeadLetterEvent> retryDeadLetterEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("dlqId") UUID dlqId) {
        projectService.getProjectEntity(principal.getOrganizationId(), projectId);
        DeadLetterEvent dlqEvent = dlqRepository.findByIdAndProjectId(dlqId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Dead letter event not found with ID: " + dlqId));

        dlqEvent.setStatus("RESOLVED");
        DeadLetterEvent savedDlq = dlqRepository.save(dlqEvent);

        // Reset delivery state and re-dispatch
        EventDelivery delivery = deliveryRepository.findById(dlqEvent.getDeliveryId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated delivery not found"));
        delivery.setStatus("PENDING");
        delivery.setAttemptCount(0);
        delivery.setNextRetryAt(null);
        delivery.setLastError(null);
        deliveryRepository.save(delivery);

        dispatcherService.dispatch(delivery.getId());

        return ResponseEntity.ok(savedDlq);
    }

    @DeleteMapping("/{dlqId}")
    public ResponseEntity<DeadLetterEvent> discardDeadLetterEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("dlqId") UUID dlqId) {
        projectService.getProjectEntity(principal.getOrganizationId(), projectId);
        DeadLetterEvent dlqEvent = dlqRepository.findByIdAndProjectId(dlqId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Dead letter event not found with ID: " + dlqId));

        dlqEvent.setStatus("DISCARDED");
        DeadLetterEvent saved = dlqRepository.save(dlqEvent);
        return ResponseEntity.ok(saved);
    }
}
