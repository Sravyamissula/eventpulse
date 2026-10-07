package com.eventpulse.controller;

import com.eventpulse.dto.AiAnalysisResponse;
import com.eventpulse.dto.AiIncidentSummaryResponse;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.AiClientService;
import com.eventpulse.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Controller exposing AI failure root-cause analysis and incident summaries.
 */
@RestController
public class AiController {

    private final AiClientService aiClientService;
    private final ProjectService projectService;

    public AiController(AiClientService aiClientService, ProjectService projectService) {
        this.aiClientService = aiClientService;
        this.projectService = projectService;
    }

    @GetMapping("/api/projects/{projectId}/deliveries/{deliveryId}/ai-analysis")
    public ResponseEntity<AiAnalysisResponse> getDeliveryAiAnalysis(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId,
            @PathVariable("deliveryId") UUID deliveryId) {
        projectService.getProjectEntity(principal.getOrganizationId(), projectId);
        AiAnalysisResponse response = aiClientService.analyzeDeliveryFailure(deliveryId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/projects/{projectId}/ai-incident-summary")
    public ResponseEntity<AiIncidentSummaryResponse> getProjectAiIncidentSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId) {
        projectService.getProjectEntity(principal.getOrganizationId(), projectId);
        AiIncidentSummaryResponse response = aiClientService.summarizeProjectIncidents(projectId);
        return ResponseEntity.ok(response);
    }
}
