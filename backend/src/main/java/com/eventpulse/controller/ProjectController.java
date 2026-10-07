package com.eventpulse.controller;

import com.eventpulse.dto.ProjectRequest;
import com.eventpulse.dto.ProjectResponse;
import com.eventpulse.security.UserPrincipal;
import com.eventpulse.service.ProjectService;
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
 * Controller for tenant-scoped project operations.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.createProject(principal.getOrganizationId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ProjectResponse> response = projectService.getProjects(principal.getOrganizationId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID projectId) {
        ProjectResponse response = projectService.getProject(principal.getOrganizationId(), projectId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID projectId,
            @Valid @RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.updateProject(principal.getOrganizationId(), projectId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID projectId) {
        projectService.deleteProject(principal.getOrganizationId(), projectId);
        return ResponseEntity.noContent().build();
    }
}
