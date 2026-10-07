package com.eventpulse.controller;

import com.eventpulse.dto.ApiKeyCreateRequest;
import com.eventpulse.dto.ApiKeyCreatedResponse;
import com.eventpulse.dto.ApiKeyResponse;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.ApiKeyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing project API keys.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/api-keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping
    public ResponseEntity<ApiKeyCreatedResponse> createApiKey(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @Valid @RequestBody ApiKeyCreateRequest request) {
        ApiKeyCreatedResponse response = apiKeyService.createApiKey(
                principal.getOrganizationId(), projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> getApiKeys(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId) {
        List<ApiKeyResponse> response = apiKeyService.getApiKeys(
                principal.getOrganizationId(), projectId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<Void> revokeApiKey(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("keyId") UUID keyId) {
        apiKeyService.revokeApiKey(principal.getOrganizationId(), projectId, keyId);
        return ResponseEntity.noContent().build();
    }
}
