package com.eventpulse.service;

import com.eventpulse.dto.EventIngestRequest;
import com.eventpulse.dto.EventIngestResponse;
import com.eventpulse.entity.Event;
import com.eventpulse.entity.EventDelivery;
import com.eventpulse.entity.WebhookEndpoint;
import com.eventpulse.repository.EventDeliveryRepository;
import com.eventpulse.repository.EventRepository;
import com.eventpulse.repository.WebhookEndpointRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service managing event ingestion, database idempotency guarantees,
 * and post-commit transactional dispatch to active webhook endpoints.
 */
@Service
public class EventIngestionService {

    private static final Logger log = LoggerFactory.getLogger(EventIngestionService.class);

    private final EventRepository eventRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final EventDeliveryRepository deliveryRepository;
    private final DeliveryDispatcherService dispatcherService;
    private final ObjectMapper objectMapper;

    public EventIngestionService(EventRepository eventRepository,
                                 WebhookEndpointRepository endpointRepository,
                                 EventDeliveryRepository deliveryRepository,
                                 DeliveryDispatcherService dispatcherService,
                                 ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.endpointRepository = endpointRepository;
        this.deliveryRepository = deliveryRepository;
        this.dispatcherService = dispatcherService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public EventIngestResponse ingestEvent(UUID organizationId, UUID projectId, EventIngestRequest request) {
        // 1. Idempotency Check
        String idempotencyKey = request.getIdempotencyKey() != null ? request.getIdempotencyKey().trim() : null;
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<Event> existingOpt = eventRepository.findByProjectIdAndIdempotencyKey(projectId, idempotencyKey);
            if (existingOpt.isPresent()) {
                Event existing = existingOpt.get();
                log.info("Idempotent request received for project {} with key {}. Returning existing event {}",
                        projectId, idempotencyKey, existing.getId());
                return new EventIngestResponse(
                        existing.getId(),
                        existing.getProjectId(),
                        existing.getEventType(),
                        existing.getStatus(),
                        0,
                        true,
                        existing.getCreatedAt()
                );
            }
        }

        // 2. Serialize Payload
        String payloadString;
        try {
            payloadString = objectMapper.writeValueAsString(request.getPayload());
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid JSON payload structure", e);
        }

        // 3. Persist Event
        Event event = new Event(organizationId, projectId, request.getEventType().trim(), payloadString);
        event.setIdempotencyKey(idempotencyKey);
        Event savedEvent = eventRepository.save(event);

        // 4. Fan-out to Active Endpoints
        List<WebhookEndpoint> endpoints = endpointRepository.findAllByProjectIdAndStatus(projectId, "ACTIVE");
        List<UUID> deliveryIdsToDispatch = new ArrayList<>();

        for (WebhookEndpoint endpoint : endpoints) {
            EventDelivery delivery = new EventDelivery(
                    organizationId,
                    projectId,
                    savedEvent.getId(),
                    endpoint.getId()
            );
            EventDelivery savedDelivery = deliveryRepository.save(delivery);
            deliveryIdsToDispatch.add(savedDelivery.getId());
        }

        log.info("Event {} ingested for project {}. Created {} webhook deliveries",
                savedEvent.getId(), projectId, deliveryIdsToDispatch.size());

        // 5. Post-Commit Transactional Dispatch
        if (!deliveryIdsToDispatch.isEmpty()) {
            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (UUID deliveryId : deliveryIdsToDispatch) {
                            dispatcherService.dispatch(deliveryId);
                        }
                    }
                });
            } else {
                for (UUID deliveryId : deliveryIdsToDispatch) {
                    dispatcherService.dispatch(deliveryId);
                }
            }
        }

        return new EventIngestResponse(
                savedEvent.getId(),
                projectId,
                savedEvent.getEventType(),
                "ACCEPTED",
                deliveryIdsToDispatch.size(),
                false,
                savedEvent.getCreatedAt()
        );
    }
}
