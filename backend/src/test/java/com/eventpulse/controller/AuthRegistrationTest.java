package com.eventpulse.controller;

import com.eventpulse.dto.RegisterRequest;
import com.eventpulse.entity.Organization;
import com.eventpulse.entity.User;
import com.eventpulse.exception.DuplicateResourceException;
import com.eventpulse.repository.OrganizationRepository;
import com.eventpulse.repository.UserRepository;
import com.eventpulse.service.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthRegistrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Should successfully register organization and user with BCrypt hashed password")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest("Acme Corp", "owner@acme.com", "StrongP@ssw0rd");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.organizationId").isNotEmpty())
                .andExpect(jsonPath("$.organizationName").value("Acme Corp"))
                .andExpect(jsonPath("$.userId").isNotEmpty())
                .andExpect(jsonPath("$.email").value("owner@acme.com"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                // Ensure neither password nor passwordHash are returned
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        JsonNode rootNode = objectMapper.readTree(result.getResponse().getContentAsString());
        UUID orgId = UUID.fromString(rootNode.get("organizationId").asText());
        UUID userId = UUID.fromString(rootNode.get("userId").asText());

        // Verify database persistence
        Optional<Organization> orgOpt = organizationRepository.findById(orgId);
        assertThat(orgOpt).isPresent();
        assertThat(orgOpt.get().getName()).isEqualTo("Acme Corp");

        Optional<User> userOpt = userRepository.findById(userId);
        assertThat(userOpt).isPresent();
        User savedUser = userOpt.get();
        assertThat(savedUser.getOrganizationId()).isEqualTo(orgId);
        assertThat(savedUser.getEmail()).isEqualTo("owner@acme.com");

        // Verify password is stored as BCrypt hash, not plaintext
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("StrongP@ssw0rd");
        assertThat(savedUser.getPasswordHash()).matches("^\\$2[ab]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
        assertThat(passwordEncoder.matches("StrongP@ssw0rd", savedUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Should normalize email to lowercase upon registration")
    void testEmailNormalization() throws Exception {
        RegisterRequest request = new RegisterRequest("Beta Tech", "  John.DOE@BetaTech.COM  ", "SecretKey123!");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("john.doe@betatech.com"))
                .andReturn();

        JsonNode rootNode = objectMapper.readTree(result.getResponse().getContentAsString());
        UUID userId = UUID.fromString(rootNode.get("userId").asText());

        Optional<User> userOpt = userRepository.findById(userId);
        assertThat(userOpt).isPresent();
        assertThat(userOpt.get().getEmail()).isEqualTo("john.doe@betatech.com");
    }

    @Test
    @DisplayName("Should reject duplicate user email within the same organization")
    void testDuplicateEmailWithinSameOrganizationRejected() {
        Organization org = organizationRepository.saveAndFlush(new Organization("Gamma Holdings"));
        authService.registerUserInOrganization(org.getId(), "member@gamma.com", "PasswordOne123!");

        assertThatThrownBy(() -> authService.registerUserInOrganization(org.getId(), "member@gamma.com", "PasswordTwo123!"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists in this organization");
    }

    @Test
    @DisplayName("Should allow same email address across different organizations (multi-tenant isolation)")
    void testSameEmailAcrossDifferentOrganizationsAllowed() throws Exception {
        RegisterRequest org1Request = new RegisterRequest("Org Alpha", "shared@domain.com", "PasswordAlpha123!");
        RegisterRequest org2Request = new RegisterRequest("Org Beta", "shared@domain.com", "PasswordBeta123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(org1Request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(org2Request)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should reject registration when email format is invalid")
    void testInvalidEmailRejected() throws Exception {
        RegisterRequest request = new RegisterRequest("Acme Corp", "not-an-email", "ValidPassword123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    @DisplayName("Should reject registration when password is shorter than 8 characters")
    void testTooShortPasswordRejected() throws Exception {
        RegisterRequest request = new RegisterRequest("Acme Corp", "user@acme.com", "short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    @DisplayName("Should reject registration when organization name is blank")
    void testBlankOrganizationNameRejected() throws Exception {
        RegisterRequest request = new RegisterRequest("   ", "user@acme.com", "ValidPassword123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.organizationName").exists());
    }

    @Test
    @DisplayName("Registration endpoint should be publicly accessible without authentication")
    void testRegistrationEndpointIsPublic() throws Exception {
        RegisterRequest request = new RegisterRequest("Public Access Corp", "public@access.com", "ValidPassword123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Non-POST requests or protected endpoints should require authentication")
    void testOtherEndpointsRequireAuthentication() throws Exception {
        // GET /api/auth/register is not permitted and should return 401 Unauthorized
        mockMvc.perform(get("/api/auth/register"))
                .andExpect(status().isUnauthorized());

        // GET /actuator/info requires authentication
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isUnauthorized());
    }
}
