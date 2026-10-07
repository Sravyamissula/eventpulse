package com.eventpulse.controller;

import com.eventpulse.dto.ApiKeyCreateRequest;
import com.eventpulse.dto.LoginRequest;
import com.eventpulse.dto.ProjectRequest;
import com.eventpulse.dto.RegisterRequest;
import com.eventpulse.dto.RegisterResponse;
import com.eventpulse.dto.WebhookEndpointRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProjectAndEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenOrgA;
    private UUID orgAId;
    private String tokenOrgB;
    private UUID orgBId;

    @BeforeEach
    void setUp() throws Exception {
        // Register Org A
        RegisterRequest regA = new RegisterRequest("Acme Corp", "admin@acme.com", "AcmePassword123!");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated())
                .andReturn();
        RegisterResponse parsedA = objectMapper.readValue(resA.getResponse().getContentAsString(), RegisterResponse.class);
        orgAId = parsedA.getOrganizationId();
        tokenOrgA = loginAndGetToken(orgAId, "admin@acme.com", "AcmePassword123!");

        // Register Org B
        RegisterRequest regB = new RegisterRequest("Beta LLC", "admin@beta.com", "BetaPassword123!");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated())
                .andReturn();
        RegisterResponse parsedB = objectMapper.readValue(resB.getResponse().getContentAsString(), RegisterResponse.class);
        orgBId = parsedB.getOrganizationId();
        tokenOrgB = loginAndGetToken(orgBId, "admin@beta.com", "BetaPassword123!");
    }

    private String loginAndGetToken(UUID orgId, String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(orgId, email, password);
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(res.getResponse().getContentAsString());
        return node.get("accessToken").asText();
    }

    @Test
    @DisplayName("Project CRUD lifecycle with multi-tenant isolation")
    void testProjectCrudAndIsolation() throws Exception {
        // 1. Create project in Org A
        ProjectRequest createReq = new ProjectRequest("Billing Gateway");
        MvcResult createRes = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Billing Gateway"))
                .andExpect(jsonPath("$.organizationId").value(orgAId.toString()))
                .andReturn();

        JsonNode createdNode = objectMapper.readTree(createRes.getResponse().getContentAsString());
        String projectId = createdNode.get("id").asText();

        // 2. List projects in Org A
        mockMvc.perform(get("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Billing Gateway"));

        // 3. Update project in Org A
        ProjectRequest updateReq = new ProjectRequest("Billing Gateway V2");
        mockMvc.perform(put("/api/projects/" + projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Billing Gateway V2"));

        // 4. Verify Org B cannot access Org A's project (Tenant Isolation)
        mockMvc.perform(get("/api/projects/" + projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgB))
                .andExpect(status().isNotFound());

        // 5. Delete project
        mockMvc.perform(delete("/api/projects/" + projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isNoContent());

        // 6. Verify deleted
        mockMvc.perform(get("/api/projects/" + projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("API Key creation, prefix exposure, and revocation")
    void testApiKeyLifecycle() throws Exception {
        // Create project
        ProjectRequest pReq = new ProjectRequest("Event Router");
        MvcResult pRes = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String projectId = objectMapper.readTree(pRes.getResponse().getContentAsString()).get("id").asText();

        // Create API key
        ApiKeyCreateRequest keyReq = new ApiKeyCreateRequest("Production Ingestion Key");
        MvcResult keyRes = mockMvc.perform(post("/api/projects/" + projectId + "/api-keys")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(keyReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Production Ingestion Key"))
                .andExpect(jsonPath("$.keyPrefix").value(org.hamcrest.Matchers.startsWith("ep_live_")))
                .andExpect(jsonPath("$.apiKey").value(org.hamcrest.Matchers.startsWith("ep_live_")))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        JsonNode keyNode = objectMapper.readTree(keyRes.getResponse().getContentAsString());
        String keyId = keyNode.get("id").asText();
        String rawKey = keyNode.get("apiKey").asText();
        assertThat(rawKey).startsWith("ep_live_");

        // List API keys -> verify raw apiKey is NOT returned, only keyPrefix
        mockMvc.perform(get("/api/projects/" + projectId + "/api-keys")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Production Ingestion Key"))
                .andExpect(jsonPath("$[0].apiKey").doesNotExist())
                .andExpect(jsonPath("$[0].keyPrefix").value(org.hamcrest.Matchers.startsWith("ep_live_")));

        // Revoke API key
        mockMvc.perform(delete("/api/projects/" + projectId + "/api-keys/" + keyId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isNoContent());

        // List keys again -> active is false
        mockMvc.perform(get("/api/projects/" + projectId + "/api-keys")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].active").value(false));
    }

    @Test
    @DisplayName("Webhook endpoint CRUD and Circuit Breaker reset")
    void testWebhookEndpointLifecycle() throws Exception {
        // Create project
        ProjectRequest pReq = new ProjectRequest("Delivery Hub");
        MvcResult pRes = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String projectId = objectMapper.readTree(pRes.getResponse().getContentAsString()).get("id").asText();

        // Create Webhook Endpoint
        WebhookEndpointRequest epReq = new WebhookEndpointRequest("Customer Webhook", "https://api.customer.com/webhooks");
        epReq.setRateLimitPerMinute(120);

        MvcResult epRes = mockMvc.perform(post("/api/projects/" + projectId + "/endpoints")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(epReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Customer Webhook"))
                .andExpect(jsonPath("$.url").value("https://api.customer.com/webhooks"))
                .andExpect(jsonPath("$.secretToken").value(org.hamcrest.Matchers.startsWith("whsec_")))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.circuitState").value("CLOSED"))
                .andExpect(jsonPath("$.failureCount").value(0))
                .andExpect(jsonPath("$.rateLimitPerMinute").value(120))
                .andReturn();

        String endpointId = objectMapper.readTree(epRes.getResponse().getContentAsString()).get("id").asText();

        // Reset Circuit Breaker
        mockMvc.perform(post("/api/projects/" + projectId + "/endpoints/" + endpointId + "/reset-circuit")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.circuitState").value("CLOSED"))
                .andExpect(jsonPath("$.failureCount").value(0));

        // Delete endpoint
        mockMvc.perform(delete("/api/projects/" + projectId + "/endpoints/" + endpointId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/api/projects/" + projectId + "/endpoints/" + endpointId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOrgA))
                .andExpect(status().isNotFound());
    }
}
