package com.eventpulse.controller;

import com.eventpulse.dto.WebhookEndpointRequest;
import com.eventpulse.dto.WebhookEndpointResponse;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.WebhookEndpointService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing webhook endpoints and circuit breaker controls.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/endpoints")
public class WebhookEndpointController {

    private final WebhookEndpointService endpointService;

    public WebhookEndpointController(WebhookEndpointService endpointService) {
        this.endpointService = endpointService;
    }

    @PostMapping
    public ResponseEntity<WebhookEndpointResponse> createEndpoint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @Valid @RequestBody WebhookEndpointRequest request) {
        WebhookEndpointResponse response = endpointService.createEndpoint(
                principal.getOrganizationId(), projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<WebhookEndpointResponse>> getEndpoints(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId) {
        List<WebhookEndpointResponse> response = endpointService.getEndpoints(
                principal.getOrganizationId(), projectId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{endpointId}")
    public ResponseEntity<WebhookEndpointResponse> getEndpoint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("endpointId") UUID endpointId) {
        WebhookEndpointResponse response = endpointService.getEndpoint(
                principal.getOrganizationId(), projectId, endpointId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{endpointId}")
    public ResponseEntity<WebhookEndpointResponse> updateEndpoint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("endpointId") UUID endpointId,
            @Valid @RequestBody WebhookEndpointRequest request) {
        WebhookEndpointResponse response = endpointService.updateEndpoint(
                principal.getOrganizationId(), projectId, endpointId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{endpointId}")
    public ResponseEntity<Void> deleteEndpoint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("endpointId") UUID endpointId) {
        endpointService.deleteEndpoint(principal.getOrganizationId(), projectId, endpointId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{endpointId}/reset-circuit")
    public ResponseEntity<WebhookEndpointResponse> resetCircuitBreaker(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("endpointId") UUID endpointId) {
        WebhookEndpointResponse response = endpointService.resetCircuitBreaker(
                principal.getOrganizationId(), projectId, endpointId);
        return ResponseEntity.ok(response);
    }
}
