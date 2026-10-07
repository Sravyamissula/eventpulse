package com.eventpulse.controller;

import com.eventpulse.dto.AnalyticsResponse;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.AnalyticsService;
import com.eventpulse.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Controller exposing real-time delivery metrics, throughput, and latency percentiles.
 */
@RestController
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ProjectService projectService;

    public AnalyticsController(AnalyticsService analyticsService, ProjectService projectService) {
        this.analyticsService = analyticsService;
        this.projectService = projectService;
    }

    @GetMapping("/api/analytics")
    public ResponseEntity<AnalyticsResponse> getOrganizationAnalytics(
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsResponse response = analyticsService.getAnalytics(principal.getOrganizationId(), null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/projects/{projectId}/analytics")
    public ResponseEntity<AnalyticsResponse> getProjectAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("projectId") UUID projectId) {
        projectService.getProjectEntity(principal.getOrganizationId(), projectId);
        AnalyticsResponse response = analyticsService.getAnalytics(principal.getOrganizationId(), projectId);
        return ResponseEntity.ok(response);
    }
}
