package com.eventpulse.service;

import com.eventpulse.dto.ApiKeyCreateRequest;
import com.eventpulse.dto.ApiKeyCreatedResponse;
import com.eventpulse.dto.ApiKeyResponse;
import com.eventpulse.entity.ApiKey;
import com.eventpulse.exception.ResourceNotFoundException;
import com.eventpulse.repository.ApiKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing secure API key lifecycle and validation.
 * Uses SHA-256 hashing for storage; plaintext keys are never persisted.
 */
@Service
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final ProjectService projectService;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyService(ApiKeyRepository apiKeyRepository, ProjectService projectService) {
        this.apiKeyRepository = apiKeyRepository;
        this.projectService = projectService;
    }

    @Transactional
    public ApiKeyCreatedResponse createApiKey(UUID organizationId, UUID projectId, ApiKeyCreateRequest request) {
        // Verify project belongs to organization
        projectService.getProjectEntity(organizationId, projectId);

        // Generate raw random key: ep_live_<prefix>_<random-token>
        byte[] prefixBytes = new byte[4];
        byte[] tokenBytes = new byte[24];
        secureRandom.nextBytes(prefixBytes);
        secureRandom.nextBytes(tokenBytes);

        String prefixSuffix = HexFormat.of().formatHex(prefixBytes);
        String token = HexFormat.of().formatHex(tokenBytes);
        String keyPrefix = "ep_live_" + prefixSuffix;
        String rawKey = keyPrefix + "_" + token;

        String keyHash = hashKey(rawKey);

        ApiKey apiKey = new ApiKey(organizationId, projectId, request.getName().trim(), keyPrefix, keyHash);
        if (request.getExpiresAt() != null) {
            apiKey.setExpiresAt(request.getExpiresAt());
        }

        ApiKey saved = apiKeyRepository.save(apiKey);
        return ApiKeyCreatedResponse.fromEntity(saved, rawKey);
    }

    @Transactional(readOnly = true)
    public List<ApiKeyResponse> getApiKeys(UUID organizationId, UUID projectId) {
        projectService.getProjectEntity(organizationId, projectId);
        return apiKeyRepository.findAllByProjectId(projectId)
                .stream()
                .map(ApiKeyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeApiKey(UUID organizationId, UUID projectId, UUID keyId) {
        projectService.getProjectEntity(organizationId, projectId);
        ApiKey apiKey = apiKeyRepository.findByIdAndProjectId(keyId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("API Key not found with ID: " + keyId));
        apiKey.setActive(false);
        apiKeyRepository.save(apiKey);
    }

    @Transactional
    public Optional<ApiKey> authenticateApiKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            return Optional.empty();
        }
        String keyHash = hashKey(rawKey.trim());
        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByKeyHashAndActiveTrue(keyHash);
        if (apiKeyOpt.isEmpty()) {
            return Optional.empty();
        }

        ApiKey apiKey = apiKeyOpt.get();
        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return Optional.empty();
        }

        apiKey.setLastUsedAt(OffsetDateTime.now());
        apiKeyRepository.save(apiKey);
        return Optional.of(apiKey);
    }

    public static String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
