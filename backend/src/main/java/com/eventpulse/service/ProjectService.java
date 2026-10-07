package com.eventpulse.service;

import com.eventpulse.dto.ProjectRequest;
import com.eventpulse.dto.ProjectResponse;
import com.eventpulse.entity.Project;
import com.eventpulse.exception.DuplicateResourceException;
import com.eventpulse.exception.ResourceNotFoundException;
import com.eventpulse.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing multi-tenant projects.
 * Enforces organization-level tenant boundaries on all operations.
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional
    public ProjectResponse createProject(UUID organizationId, ProjectRequest request) {
        String name = request.getName().trim();
        if (projectRepository.existsByOrganizationIdAndName(organizationId, name)) {
            throw new DuplicateResourceException("Project with name '" + name + "' already exists in this organization");
        }
        Project project = new Project(organizationId, name);
        Project saved = projectRepository.save(project);
        return ProjectResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(UUID organizationId) {
        return projectRepository.findAllByOrganizationId(organizationId)
                .stream()
                .map(ProjectResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Project getProjectEntity(UUID organizationId, UUID projectId) {
        return projectRepository.findById(projectId)
                .filter(p -> p.getOrganizationId().equals(organizationId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID organizationId, UUID projectId) {
        return ProjectResponse.fromEntity(getProjectEntity(organizationId, projectId));
    }

    @Transactional
    public ProjectResponse updateProject(UUID organizationId, UUID projectId, ProjectRequest request) {
        Project project = getProjectEntity(organizationId, projectId);
        String newName = request.getName().trim();
        if (!project.getName().equals(newName) && projectRepository.existsByOrganizationIdAndName(organizationId, newName)) {
            throw new DuplicateResourceException("Project with name '" + newName + "' already exists in this organization");
        }
        project.setName(newName);
        Project saved = projectRepository.save(project);
        return ProjectResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteProject(UUID organizationId, UUID projectId) {
        Project project = getProjectEntity(organizationId, projectId);
        projectRepository.delete(project);
    }
}
