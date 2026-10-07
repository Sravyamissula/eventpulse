package com.eventpulse.service;

import com.eventpulse.entity.DeadLetterEvent;
import com.eventpulse.entity.DeliveryAttempt;
import com.eventpulse.entity.Event;
import com.eventpulse.entity.EventDelivery;
import com.eventpulse.entity.WebhookEndpoint;
import com.eventpulse.repository.DeadLetterEventRepository;
import com.eventpulse.repository.DeliveryAttemptRepository;
import com.eventpulse.repository.EventDeliveryRepository;
import com.eventpulse.repository.EventRepository;
import com.eventpulse.repository.WebhookEndpointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Worker responsible for executing individual webhook delivery HTTP requests,
 * evaluating circuit breaker thresholds, recording attempts, calculating exponential backoff,
 * and routing dead-letter items to the DLQ upon retry exhaustion.
 */
@Service
public class WebhookDeliveryWorker {

    private static final Logger log = LoggerFactory.getLogger(WebhookDeliveryWorker.class);
    private static final int CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
    private static final long CIRCUIT_BREAKER_RESET_TIMEOUT_SECONDS = 60;

    private final EventDeliveryRepository deliveryRepository;
    private final EventRepository eventRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final DeliveryAttemptRepository attemptRepository;
    private final DeadLetterEventRepository dlqRepository;
    private final WebhookSignatureService signatureService;
    private final RateLimiterService rateLimiterService;

    private final HttpClient httpClient;

    public WebhookDeliveryWorker(EventDeliveryRepository deliveryRepository,
                                 EventRepository eventRepository,
                                 WebhookEndpointRepository endpointRepository,
                                 DeliveryAttemptRepository attemptRepository,
                                 DeadLetterEventRepository dlqRepository,
                                 WebhookSignatureService signatureService,
                                 RateLimiterService rateLimiterService) {
        this.deliveryRepository = deliveryRepository;
        this.eventRepository = eventRepository;
        this.endpointRepository = endpointRepository;
        this.attemptRepository = attemptRepository;
        this.dlqRepository = dlqRepository;
        this.signatureService = signatureService;
        this.rateLimiterService = rateLimiterService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Transactional
    public void processDelivery(UUID deliveryId) {
        Optional<EventDelivery> deliveryOpt = deliveryRepository.findById(deliveryId);
        if (deliveryOpt.isEmpty()) {
            log.warn("Delivery {} not found for execution", deliveryId);
            return;
        }

        EventDelivery delivery = deliveryOpt.get();
        if ("SUCCESS".equals(delivery.getStatus()) || "FAILED".equals(delivery.getStatus())) {
            return; // terminal state
        }

        Optional<Event> eventOpt = eventRepository.findById(delivery.getEventId());
        Optional<WebhookEndpoint> endpointOpt = endpointRepository.findById(delivery.getEndpointId());

        if (eventOpt.isEmpty() || endpointOpt.isEmpty()) {
            log.error("Missing associated event or endpoint for delivery {}", deliveryId);
            delivery.setStatus("FAILED");
            delivery.setLastError("Associated event or webhook endpoint was deleted");
            deliveryRepository.save(delivery);
            return;
        }

        Event event = eventOpt.get();
        WebhookEndpoint endpoint = endpointOpt.get();

        if (!"ACTIVE".equalsIgnoreCase(endpoint.getStatus())) {
            log.info("Endpoint {} is not ACTIVE ({}); skipping delivery", endpoint.getId(), endpoint.getStatus());
            delivery.setStatus("PAUSED");
            deliveryRepository.save(delivery);
            return;
        }

        // Circuit breaker check
        if ("OPEN".equalsIgnoreCase(endpoint.getCircuitState())) {
            OffsetDateTime openedAt = endpoint.getCircuitOpenedAt();
            if (openedAt != null && openedAt.plusSeconds(CIRCUIT_BREAKER_RESET_TIMEOUT_SECONDS).isBefore(OffsetDateTime.now())) {
                log.info("Probe delivery allowed: Transitioning circuit to HALF_OPEN for endpoint {}", endpoint.getId());
                endpoint.setCircuitState("HALF_OPEN");
                endpointRepository.save(endpoint);
            } else {
                log.warn("Circuit OPEN for endpoint {}. Rescheduling delivery {}", endpoint.getId(), deliveryId);
                delivery.setStatus("CIRCUIT_OPEN");
                delivery.setNextRetryAt(OffsetDateTime.now().plusSeconds(30));
                deliveryRepository.save(delivery);
                return;
            }
        }

        // Rate limiter check
        if (!rateLimiterService.tryAcquire(endpoint.getId(), endpoint.getRateLimitPerMinute())) {
            log.info("Rate limit exceeded for endpoint {}. Rescheduling delivery {}", endpoint.getId(), deliveryId);
            delivery.setStatus("RATE_LIMITED");
            delivery.setNextRetryAt(OffsetDateTime.now().plusSeconds(10));
            deliveryRepository.save(delivery);
            return;
        }

        // Prepare request
        long timestamp = OffsetDateTime.now().toEpochSecond();
        String payload = event.getPayload();
        String signatureHeader = signatureService.generateSignatureHeader(payload, endpoint.getSecretToken(), timestamp);

        HttpRequest request;
        try {
            request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint.getUrl()))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "EventPulse-Delivery-Worker/1.0")
                    .header("X-EventPulse-Event-Id", event.getId().toString())
                    .header("X-EventPulse-Event-Type", event.getEventType())
                    .header("X-EventPulse-Delivery-Id", delivery.getId().toString())
                    .header("X-EventPulse-Timestamp", String.valueOf(timestamp))
                    .header("X-EventPulse-Signature", signatureHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(10))
                    .build();
        } catch (Exception e) {
            handleFailure(delivery, endpoint, event, null, 0, "Invalid URL configuration: " + e.getMessage(), payload);
            return;
        }

        long startTime = System.currentTimeMillis();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long latencyMs = System.currentTimeMillis() - startTime;
            int statusCode = response.statusCode();

            if (statusCode >= 200 && statusCode < 300) {
                handleSuccess(delivery, endpoint, statusCode, latencyMs, payload, response.body());
            } else {
                String error = "HTTP " + statusCode + ": " + (response.body() != null && response.body().length() > 500 ? response.body().substring(0, 500) : response.body());
                handleFailure(delivery, endpoint, event, statusCode, latencyMs, error, payload);
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - startTime;
            handleFailure(delivery, endpoint, event, null, latencyMs, e.getClass().getSimpleName() + ": " + e.getMessage(), payload);
        }
    }

    private void handleSuccess(EventDelivery delivery,
                               WebhookEndpoint endpoint,
                               int statusCode,
                               long latencyMs,
                               String requestBody,
                               String responseBody) {
        int attemptNumber = delivery.getAttemptCount() + 1;
        delivery.setAttemptCount(attemptNumber);
        delivery.setStatus("SUCCESS");
        delivery.setLastHttpStatus(statusCode);
        delivery.setLastLatencyMs(latencyMs);
        delivery.setLastError(null);
        delivery.setNextRetryAt(null);
        deliveryRepository.save(delivery);

        // Reset circuit breaker on success
        endpoint.setFailureCount(0);
        endpoint.setCircuitState("CLOSED");
        endpoint.setCircuitOpenedAt(null);
        endpointRepository.save(endpoint);

        // Record attempt audit
        DeliveryAttempt attempt = new DeliveryAttempt(
                delivery.getOrganizationId(),
                delivery.getId(),
                attemptNumber,
                "SUCCESS"
        );
        attempt.setHttpStatus(statusCode);
        attempt.setLatencyMs(latencyMs);
        attempt.setRequestBody(requestBody);
        attempt.setResponseBody(responseBody != null && responseBody.length() > 2000 ? responseBody.substring(0, 2000) : responseBody);
        attemptRepository.save(attempt);

        log.info("Delivery {} succeeded on attempt {} with latency {}ms", delivery.getId(), attemptNumber, latencyMs);
    }

    private void handleFailure(EventDelivery delivery,
                              WebhookEndpoint endpoint,
                              Event event,
                              Integer statusCode,
                              long latencyMs,
                              String errorMessage,
                              String requestBody) {
        int attemptNumber = delivery.getAttemptCount() + 1;
        delivery.setAttemptCount(attemptNumber);
        delivery.setLastHttpStatus(statusCode);
        delivery.setLastLatencyMs(latencyMs);
        delivery.setLastError(errorMessage);

        // Update endpoint failure count and check circuit breaker
        int failures = endpoint.getFailureCount() + 1;
        endpoint.setFailureCount(failures);
        if (failures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD || "HALF_OPEN".equalsIgnoreCase(endpoint.getCircuitState())) {
            endpoint.setCircuitState("OPEN");
            endpoint.setCircuitOpenedAt(OffsetDateTime.now());
            log.warn("Circuit Breaker OPENED for endpoint {} after {} consecutive failures", endpoint.getId(), failures);
        }
        endpointRepository.save(endpoint);

        // Record attempt audit
        DeliveryAttempt attempt = new DeliveryAttempt(
                delivery.getOrganizationId(),
                delivery.getId(),
                attemptNumber,
                "FAILED"
        );
        attempt.setHttpStatus(statusCode);
        attempt.setLatencyMs(latencyMs);
        attempt.setRequestBody(requestBody);
        attempt.setErrorMessage(errorMessage);
        attemptRepository.save(attempt);

        if (attemptNumber < delivery.getMaxAttempts()) {
            // Exponential backoff: min(3600, pow(2, attemptNumber) * 5)
            long delaySeconds = Math.min(3600, (long) Math.pow(2, attemptNumber) * 5);
            delivery.setStatus("RETRYING");
            delivery.setNextRetryAt(OffsetDateTime.now().plusSeconds(delaySeconds));
            deliveryRepository.save(delivery);
            log.warn("Delivery {} attempt {} failed: {}. Retrying in {}s", delivery.getId(), attemptNumber, errorMessage, delaySeconds);
        } else {
            // Retries exhausted -> route to DLQ
            delivery.setStatus("FAILED");
            delivery.setNextRetryAt(null);
            deliveryRepository.save(delivery);

            DeadLetterEvent dlqEvent = new DeadLetterEvent(
                    delivery.getOrganizationId(),
                    delivery.getProjectId(),
                    event.getId(),
                    delivery.getId(),
                    endpoint.getId(),
                    "Exhausted " + attemptNumber + " delivery attempts. Last error: " + errorMessage
            );
            dlqRepository.save(dlqEvent);
            log.error("Delivery {} permanently failed after {} attempts. Sent to DLQ", delivery.getId(), attemptNumber);
        }
    }
}
