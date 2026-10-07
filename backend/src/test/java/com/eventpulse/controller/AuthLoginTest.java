package com.eventpulse.controller;

import com.eventpulse.dto.LoginRequest;
import com.eventpulse.dto.RegisterRequest;
import com.eventpulse.dto.RegisterResponse;
import com.eventpulse.entity.Organization;
import com.eventpulse.entity.User;
import com.eventpulse.repository.OrganizationRepository;
import com.eventpulse.repository.UserRepository;
import com.eventpulse.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthLoginTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private UUID testOrgId;
    private UUID testUserId;
    private final String testEmail = "operator@eventpulse.io";
    private final String testPassword = "SuperSecretPassword123!";

    @BeforeEach
    void setUp() throws Exception {
        // Register a test organization and user
        RegisterRequest registerRequest = new RegisterRequest("Cyberdyne Systems", testEmail, testPassword);
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        RegisterResponse regResponse = objectMapper.readValue(
                regResult.getResponse().getContentAsString(),
                RegisterResponse.class
        );
        this.testOrgId = regResponse.getOrganizationId();
        this.testUserId = regResponse.getUserId();
    }

    @Test
    @DisplayName("1. Successful login returns HTTP 200 with Bearer token metadata")
    void testSuccessfulLogin() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, testEmail, testPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("2. Correct BCrypt password verification succeeds")
    void testBCryptPasswordVerification() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, testEmail, testPassword);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(jsonNode.get("accessToken").asText()).isNotBlank();
    }

    @Test
    @DisplayName("3. Invalid password returns HTTP 401 Unauthorized")
    void testInvalidPasswordReturns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, testEmail, "WrongPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("4. Unknown user returns HTTP 401 Unauthorized")
    void testUnknownUserReturns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, "nonexistent@eventpulse.io", testPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("5. Wrong organizationId returns HTTP 401 Unauthorized")
    void testWrongOrganizationIdReturns401() throws Exception {
        UUID wrongOrgId = UUID.randomUUID();
        LoginRequest loginRequest = new LoginRequest(wrongOrgId, testEmail, testPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("6. JWT is returned on successful login with valid 3-part format")
    void testJwtReturnedOnSuccessfulLogin() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, testEmail, testPassword);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = jsonNode.get("accessToken").asText();

        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("7. JWT contains expected subject / user identity")
    void testJwtContainsExpectedSubject() throws Exception {
        String token = loginAndGetToken();
        Claims claims = jwtService.validateAndExtractClaims(token);

        assertThat(claims.getSubject()).isEqualTo(testUserId.toString());
    }

    @Test
    @DisplayName("8. JWT contains organization_id claim")
    void testJwtContainsOrganizationId() throws Exception {
        String token = loginAndGetToken();
        Claims claims = jwtService.validateAndExtractClaims(token);

        assertThat(claims.get("organization_id", String.class)).isEqualTo(testOrgId.toString());
    }

    @Test
    @DisplayName("9. JWT contains email claim")
    void testJwtContainsEmail() throws Exception {
        String token = loginAndGetToken();
        Claims claims = jwtService.validateAndExtractClaims(token);

        assertThat(claims.get("email", String.class)).isEqualTo(testEmail);
    }

    @Test
    @DisplayName("10. JWT has valid future expiration")
    void testJwtHasExpiration() throws Exception {
        String token = loginAndGetToken();
        Claims claims = jwtService.validateAndExtractClaims(token);

        assertThat(claims.getExpiration()).isAfter(new Date());
    }

    @Test
    @DisplayName("11. JWT signature can be verified using the configured secret")
    void testJwtSignatureCanBeVerified() throws Exception {
        String token = loginAndGetToken();
        Claims claims = jwtService.validateAndExtractClaims(token);

        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo(testUserId.toString());
    }

    @Test
    @DisplayName("12. Expired JWT is rejected with HTTP 401 Unauthorized")
    void testExpiredJwtIsRejected() throws Exception {
        // Generate a token expired 10 seconds ago
        String expiredToken = jwtService.generateTokenWithExpiry(testUserId, testOrgId, testEmail, -10000L);

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("13. Tampered JWT is rejected with HTTP 401 Unauthorized")
    void testTamperedJwtIsRejected() throws Exception {
        String validToken = loginAndGetToken();
        // Tamper with the token string
        String tamperedToken = validToken.substring(0, validToken.length() - 6) + "XXXXXX";

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("14. Missing Authorization header on protected endpoint returns HTTP 401 Unauthorized")
    void testMissingAuthorizationHeaderReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("15. Malformed Authorization header returns HTTP 401 Unauthorized")
    void testMalformedAuthorizationHeaderReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not.a.valid.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("16. Valid JWT allows access to protected endpoint")
    void testValidJwtAllowsAccessToProtectedEndpoint() throws Exception {
        String token = loginAndGetToken();

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(testUserId.toString()))
                .andExpect(jsonPath("$.organizationId").value(testOrgId.toString()))
                .andExpect(jsonPath("$.email").value(testEmail));
    }

    @Test
    @DisplayName("17. Registration remains publicly accessible without token")
    void testRegistrationRemainsPublic() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Public Org", "newuser@public.org", "Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("18. Login remains publicly accessible without token")
    void testLoginRemainsPublic() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, testEmail, testPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("19. Actuator health remains publicly accessible without token")
    void testActuatorHealthRemainsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("20. Sensitive actuator endpoints remain protected without token and accessible with valid token")
    void testSensitiveActuatorEndpointsProtected() throws Exception {
        // Unauthenticated request to /actuator/info receives 401
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isUnauthorized());

        // Authenticated request with valid JWT to /actuator/info succeeds
        String token = loginAndGetToken();
        mockMvc.perform(get("/actuator/info")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    private String loginAndGetToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testOrgId, testEmail, testPassword);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        return jsonNode.get("accessToken").asText();
    }
}
