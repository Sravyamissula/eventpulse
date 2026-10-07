package com.eventpulse.service;

import com.eventpulse.dto.AiAnalysisResponse;
import com.eventpulse.dto.AiIncidentSummaryResponse;
import com.eventpulse.entity.DeadLetterEvent;
import com.eventpulse.entity.DeliveryAttempt;
import com.eventpulse.entity.EventDelivery;
import com.eventpulse.entity.WebhookEndpoint;
import com.eventpulse.repository.DeadLetterEventRepository;
import com.eventpulse.repository.DeliveryAttemptRepository;
import com.eventpulse.repository.EventDeliveryRepository;
import com.eventpulse.repository.WebhookEndpointRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Client service interacting with the EventPulse AI Intelligence Microservice
 * with fallback heuristics when the microservice is offline.
 */
@Service
public class AiClientService {

    private static final Logger log = LoggerFactory.getLogger(AiClientService.class);

    private final String aiServiceUrl;
    private final EventDeliveryRepository deliveryRepository;
    private final DeliveryAttemptRepository attemptRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final DeadLetterEventRepository dlqRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiClientService(
            @Value("${eventpulse.ai-service.url:http://localhost:8000}") String aiServiceUrl,
            EventDeliveryRepository deliveryRepository,
            DeliveryAttemptRepository attemptRepository,
            WebhookEndpointRepository endpointRepository,
            DeadLetterEventRepository dlqRepository,
            ObjectMapper objectMapper) {
        this.aiServiceUrl = aiServiceUrl;
        this.deliveryRepository = deliveryRepository;
        this.attemptRepository = attemptRepository;
        this.endpointRepository = endpointRepository;
        this.dlqRepository = dlqRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    public AiAnalysisResponse analyzeDeliveryFailure(UUID deliveryId) {
        Optional<EventDelivery> deliveryOpt = deliveryRepository.findById(deliveryId);
        if (deliveryOpt.isEmpty()) {
            return new AiAnalysisResponse(
                    deliveryId.toString(),
                    "UNKNOWN",
                    0.0,
                    "Delivery record not found.",
                    List.of("Check delivery ID validity."),
                    false,
                    "DISCARD"
            );
        }

        EventDelivery delivery = deliveryOpt.get();
        Optional<WebhookEndpoint> endpointOpt = endpointRepository.findById(delivery.getEndpointId());
        String endpointUrl = endpointOpt.map(WebhookEndpoint::getUrl).orElse("unknown");

        List<DeliveryAttempt> attempts = attemptRepository.findAllByDeliveryIdOrderByAttemptNumberAsc(deliveryId);
        DeliveryAttempt latestAttempt = attempts.isEmpty() ? null : attempts.get(attempts.size() - 1);

        Integer httpStatus = delivery.getLastHttpStatus();
        String errorMessage = delivery.getLastError();
        String responseBody = latestAttempt != null ? latestAttempt.getResponseBody() : null;

        // Try calling Python AI service
        try {
            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("delivery_id", deliveryId.toString());
            reqBody.put("http_status", httpStatus);
            reqBody.put("error_message", errorMessage);
            reqBody.put("response_body", responseBody);
            reqBody.put("endpoint_url", endpointUrl);
            reqBody.put("attempt_count", delivery.getAttemptCount());

            String jsonPayload = objectMapper.writeValueAsString(reqBody);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/api/ai/analyze-failure"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(3))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                List<String> remediations = new ArrayList<>();
                if (root.has("suggested_remediation")) {
                    for (JsonNode item : root.get("suggested_remediation")) {
                        remediations.add(item.asText());
                    }
                }
                return new AiAnalysisResponse(
                        root.path("delivery_id").asText(deliveryId.toString()),
                        root.path("root_cause_category").asText("UNCLASSIFIED"),
                        root.path("confidence_score").asDouble(0.85),
                        root.path("explanation").asText(""),
                        remediations,
                        root.path("is_retryable").asBoolean(true),
                        root.path("recommended_action").asText("WAIT_AND_RETRY")
                );
            }
        } catch (Exception e) {
            log.debug("AI microservice not reachable, using embedded analysis engine: {}", e.getMessage());
        }

        // Embedded Intelligent Fallback Engine
        return fallbackAnalyze(deliveryId.toString(), endpointUrl, httpStatus, errorMessage, responseBody);
    }

    public AiIncidentSummaryResponse summarizeProjectIncidents(UUID projectId) {
        List<DeadLetterEvent> dlqEvents = dlqRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId);
        List<EventDelivery> failedDeliveries = deliveryRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .filter(d -> "FAILED".equalsIgnoreCase(d.getStatus()) || "RETRYING".equalsIgnoreCase(d.getStatus()))
                .limit(50)
                .collect(Collectors.toList());

        int totalFailures = dlqEvents.size() + failedDeliveries.size();
        if (totalFailures == 0) {
            return new AiIncidentSummaryResponse(
                    "No Active Delivery Incidents",
                    "LOW",
                    "All webhooks are delivering smoothly. No active delivery incidents or DLQ items detected.",
                    List.of(),
                    "All endpoints healthy and processing traffic with 100% success.",
                    List.of("Continue standard monitoring."),
                    "All circuit breakers closed."
            );
        }

        List<String> affectedEndpoints = endpointRepository.findAllByProjectId(projectId)
                .stream()
                .map(WebhookEndpoint::getUrl)
                .collect(Collectors.toList());

        String severity = totalFailures >= 20 ? "HIGH" : (totalFailures >= 5 ? "MEDIUM" : "LOW");

        return new AiIncidentSummaryResponse(
                "Incident Report: " + totalFailures + " Webhook Deliveries Impacted",
                severity,
                totalFailures + " deliveries encountered errors or exhaustion in project " + projectId,
                affectedEndpoints,
                "Failures concentrated on recipient endpoints. Circuit breakers active to prevent cascading delays.",
                List.of(
                        "Check recipient webhook server logs for recent application crashes or HTTP 500 errors.",
                        "Inspect DLQ tab to retry quarantined messages once recipient is recovered.",
                        "Verify recipient endpoint secret token matches signature configuration."
                ),
                "Keep circuit breaker OPEN until recipient health endpoint returns 200 OK."
        );
    }

    private AiAnalysisResponse fallbackAnalyze(String deliveryId, String endpointUrl, Integer status, String err, String resp) {
        String lowerErr = (err != null ? err.toLowerCase() : "");
        String lowerResp = (resp != null ? resp.toLowerCase() : "");

        if ((status != null && (status == 401 || status == 403)) || lowerErr.contains("unauthorized") || lowerResp.contains("signature")) {
            return new AiAnalysisResponse(
                    deliveryId,
                    "AUTHENTICATION_FAILURE",
                    0.96,
                    "The recipient server rejected the webhook due to HMAC-SHA256 signature verification failure (`X-EventPulse-Signature`).",
                    List.of(
                            "Ensure the endpoint secret token in EventPulse matches the consumer secret.",
                            "Verify receiver verifies `timestamp + '.' + payload`.",
                            "Check for timestamp clock drift."
                    ),
                    false,
                    "UPDATE_ENDPOINT_SECRET"
            );
        }

        if ((status != null && status == 404) || lowerResp.contains("not found")) {
            return new AiAnalysisResponse(
                    deliveryId,
                    "ENDPOINT_NOT_FOUND",
                    0.94,
                    "The webhook endpoint URL '" + endpointUrl + "' returned HTTP 404 Not Found.",
                    List.of(
                            "Confirm the recipient API route path exists and accepts POST requests.",
                            "Check for route typos or missing URL path prefixes."
                    ),
                    false,
                    "CHECK_RECEIVER_URL"
            );
        }

        if (lowerErr.contains("timeout") || lowerErr.contains("timed out") || (status != null && status == 504)) {
            return new AiAnalysisResponse(
                    deliveryId,
                    "TIMEOUT",
                    0.95,
                    "The delivery timed out waiting for the receiving server to complete execution.",
                    List.of(
                            "Advise consumer to process webhooks asynchronously (enqueue and return 200/202).",
                            "EventPulse will automatically retry using exponential backoff."
                    ),
                    true,
                    "WAIT_AND_RETRY"
            );
        }

        return new AiAnalysisResponse(
                deliveryId,
                status != null && status >= 500 ? "RECEIVER_SERVER_ERROR" : "NETWORK_OR_SERVER_ERROR",
                0.90,
                "Delivery failed with " + (status != null ? "HTTP " + status : "error") + ": " + (err != null ? err : "Unknown error"),
                List.of(
                        "Review receiver error logs.",
                        "Inspect delivery attempt history."
                ),
                true,
                "WAIT_AND_RETRY"
        );
    }
}
