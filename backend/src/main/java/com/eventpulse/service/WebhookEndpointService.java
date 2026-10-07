package com.eventpulse.service;

import com.eventpulse.dto.WebhookEndpointRequest;
import com.eventpulse.dto.WebhookEndpointResponse;
import com.eventpulse.entity.WebhookEndpoint;
import com.eventpulse.exception.ResourceNotFoundException;
import com.eventpulse.repository.WebhookEndpointRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing webhook endpoints, signing secrets, and circuit breaker states.
 */
@Service
public class WebhookEndpointService {

    private final WebhookEndpointRepository endpointRepository;
    private final ProjectService projectService;
    private final SecureRandom secureRandom = new SecureRandom();

    public WebhookEndpointService(WebhookEndpointRepository endpointRepository, ProjectService projectService) {
        this.endpointRepository = endpointRepository;
        this.projectService = projectService;
    }

    @Transactional
    public WebhookEndpointResponse createEndpoint(UUID organizationId, UUID projectId, WebhookEndpointRequest request) {
        projectService.getProjectEntity(organizationId, projectId);

        String secretToken = request.getSecretToken();
        if (secretToken == null || secretToken.isBlank()) {
            byte[] secretBytes = new byte[24];
            secureRandom.nextBytes(secretBytes);
            secretToken = "whsec_" + HexFormat.of().formatHex(secretBytes);
        }

        WebhookEndpoint endpoint = new WebhookEndpoint(
                organizationId,
                projectId,
                request.getName().trim(),
                request.getUrl().trim(),
                secretToken
        );
        if (request.getRateLimitPerMinute() > 0) {
            endpoint.setRateLimitPerMinute(request.getRateLimitPerMinute());
        }

        WebhookEndpoint saved = endpointRepository.save(endpoint);
        return WebhookEndpointResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<WebhookEndpointResponse> getEndpoints(UUID organizationId, UUID projectId) {
        projectService.getProjectEntity(organizationId, projectId);
        return endpointRepository.findAllByProjectId(projectId)
                .stream()
                .map(WebhookEndpointResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WebhookEndpoint getEndpointEntity(UUID organizationId, UUID projectId, UUID endpointId) {
        projectService.getProjectEntity(organizationId, projectId);
        return endpointRepository.findByIdAndProjectId(endpointId, projectId)
                .filter(ep -> ep.getOrganizationId().equals(organizationId))
                .orElseThrow(() -> new ResourceNotFoundException("Webhook endpoint not found with ID: " + endpointId));
    }

    @Transactional(readOnly = true)
    public WebhookEndpointResponse getEndpoint(UUID organizationId, UUID projectId, UUID endpointId) {
        return WebhookEndpointResponse.fromEntity(getEndpointEntity(organizationId, projectId, endpointId));
    }

    @Transactional
    public WebhookEndpointResponse updateEndpoint(UUID organizationId, UUID projectId, UUID endpointId, WebhookEndpointRequest request) {
        WebhookEndpoint endpoint = getEndpointEntity(organizationId, projectId, endpointId);
        endpoint.setName(request.getName().trim());
        endpoint.setUrl(request.getUrl().trim());
        if (request.getRateLimitPerMinute() > 0) {
            endpoint.setRateLimitPerMinute(request.getRateLimitPerMinute());
        }
        if (request.getSecretToken() != null && !request.getSecretToken().isBlank()) {
            endpoint.setSecretToken(request.getSecretToken().trim());
        }

        WebhookEndpoint saved = endpointRepository.save(endpoint);
        return WebhookEndpointResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteEndpoint(UUID organizationId, UUID projectId, UUID endpointId) {
        WebhookEndpoint endpoint = getEndpointEntity(organizationId, projectId, endpointId);
        endpointRepository.delete(endpoint);
    }

    @Transactional
    public WebhookEndpointResponse resetCircuitBreaker(UUID organizationId, UUID projectId, UUID endpointId) {
        WebhookEndpoint endpoint = getEndpointEntity(organizationId, projectId, endpointId);
        endpoint.setCircuitState("CLOSED");
        endpoint.setFailureCount(0);
        endpoint.setCircuitOpenedAt(null);
        WebhookEndpoint saved = endpointRepository.save(endpoint);
        return WebhookEndpointResponse.fromEntity(saved);
    }

    @Transactional
    public WebhookEndpointResponse toggleStatus(UUID organizationId, UUID projectId, UUID endpointId, String status) {
        WebhookEndpoint endpoint = getEndpointEntity(organizationId, projectId, endpointId);
        endpoint.setStatus(status.toUpperCase());
        WebhookEndpoint saved = endpointRepository.save(endpoint);
        return WebhookEndpointResponse.fromEntity(saved);
    }
}
