package com.eventpulse.repository;

import com.eventpulse.entity.Organization;
import com.eventpulse.entity.Project;
import com.eventpulse.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class RepositoryIntegrationTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    @DisplayName("Should persist and find Organization with generated UUID and timestamps")
    void testOrganizationPersistence() {
        String orgName = "Acme Corp " + UUID.randomUUID();
        Organization org = new Organization(orgName);
        Organization saved = organizationRepository.saveAndFlush(org);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo(orgName);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();

        Optional<Organization> found = organizationRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo(orgName);

        Optional<Organization> foundByName = organizationRepository.findByName(orgName);
        assertThat(foundByName).isPresent();
        assertThat(foundByName.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    @DisplayName("Should persist and find User scoped by Organization")
    void testUserPersistenceAndTenantScoping() {
        Organization org = organizationRepository.saveAndFlush(new Organization("Tenant A"));

        User user = new User(org.getId(), "alice@example.com", "hash_secret_123");
        User savedUser = userRepository.saveAndFlush(user);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getOrganizationId()).isEqualTo(org.getId());
        assertThat(savedUser.getEmail()).isEqualTo("alice@example.com");
        assertThat(savedUser.getPasswordHash()).isEqualTo("hash_secret_123");
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();

        // Find by organizationId and email
        Optional<User> found = userRepository.findByOrganizationIdAndEmail(org.getId(), "alice@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(savedUser.getId());

        // Should NOT find under a different organization ID
        UUID otherOrgId = UUID.randomUUID();
        Optional<User> notFound = userRepository.findByOrganizationIdAndEmail(otherOrgId, "alice@example.com");
        assertThat(notFound).isEmpty();

        // List by organizationId
        List<User> orgUsers = userRepository.findAllByOrganizationId(org.getId());
        assertThat(orgUsers).hasSize(1);

        // Exists check
        assertThat(userRepository.existsByOrganizationIdAndEmail(org.getId(), "alice@example.com")).isTrue();
        assertThat(userRepository.existsByOrganizationIdAndEmail(otherOrgId, "alice@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should persist and find Project scoped by Organization")
    void testProjectPersistenceAndTenantScoping() {
        Organization org = organizationRepository.saveAndFlush(new Organization("Tenant B"));

        Project project = new Project(org.getId(), "Analytics Dashboard");
        Project savedProject = projectRepository.saveAndFlush(project);

        assertThat(savedProject.getId()).isNotNull();
        assertThat(savedProject.getOrganizationId()).isEqualTo(org.getId());
        assertThat(savedProject.getName()).isEqualTo("Analytics Dashboard");
        assertThat(savedProject.getCreatedAt()).isNotNull();
        assertThat(savedProject.getUpdatedAt()).isNotNull();

        // Find by organizationId and name
        Optional<Project> found = projectRepository.findByOrganizationIdAndName(org.getId(), "Analytics Dashboard");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(savedProject.getId());

        // Should NOT find under a different organization ID
        UUID otherOrgId = UUID.randomUUID();
        Optional<Project> notFound = projectRepository.findByOrganizationIdAndName(otherOrgId, "Analytics Dashboard");
        assertThat(notFound).isEmpty();

        // List by organizationId
        List<Project> orgProjects = projectRepository.findAllByOrganizationId(org.getId());
        assertThat(orgProjects).hasSize(1);

        // Exists check
        assertThat(projectRepository.existsByOrganizationIdAndName(org.getId(), "Analytics Dashboard")).isTrue();
        assertThat(projectRepository.existsByOrganizationIdAndName(otherOrgId, "Analytics Dashboard")).isFalse();
    }
}
