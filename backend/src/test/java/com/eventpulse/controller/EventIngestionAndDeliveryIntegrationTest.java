package com.eventpulse.controller;

import com.eventpulse.dto.ApiKeyCreateRequest;
import com.eventpulse.dto.EventIngestRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EventIngestionAndDeliveryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID orgId;
    private UUID projectId;
    private String rawApiKey;

    @BeforeEach
    void setUp() throws Exception {
        // Register & login
        RegisterRequest reg = new RegisterRequest("Nexus Payments", "tech@nexuspay.com", "PasswordSecure123!");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();
        RegisterResponse parsedReg = objectMapper.readValue(regRes.getResponse().getContentAsString(), RegisterResponse.class);
        orgId = parsedReg.getOrganizationId();

        LoginRequest loginReq = new LoginRequest(orgId, "tech@nexuspay.com", "PasswordSecure123!");
        MvcResult logRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();
        token = objectMapper.readTree(logRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Create Project
        ProjectRequest pReq = new ProjectRequest("Checkout Engine");
        MvcResult pRes = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pReq)))
                .andExpect(status().isCreated())
                .andReturn();
        projectId = UUID.fromString(objectMapper.readTree(pRes.getResponse().getContentAsString()).get("id").asText());

        // Create API Key
        ApiKeyCreateRequest keyReq = new ApiKeyCreateRequest("Primary Key");
        MvcResult keyRes = mockMvc.perform(post("/api/projects/" + projectId + "/api-keys")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(keyReq)))
                .andExpect(status().isCreated())
                .andReturn();
        rawApiKey = objectMapper.readTree(keyRes.getResponse().getContentAsString()).get("apiKey").asText();

        // Create Webhook Endpoint
        WebhookEndpointRequest epReq = new WebhookEndpointRequest("Webhook Sink", "https://httpbin.org/post");
        mockMvc.perform(post("/api/projects/" + projectId + "/endpoints")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(epReq)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Event Ingestion with valid X-API-Key and fan-out to endpoints")
    void testEventIngestionWithApiKey() throws Exception {
        JsonNode payloadNode = objectMapper.readTree("{\"orderId\": \"ord_999\", \"amount\": 4999}");
        EventIngestRequest request = new EventIngestRequest("order.created", payloadNode, "idem_order_999");

        mockMvc.perform(post("/api/v1/events")
                        .header("X-API-Key", rawApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.eventId").isNotEmpty())
                .andExpect(jsonPath("$.projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.eventType").value("order.created"))
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.deliveriesCreated").value(1))
                .andExpect(jsonPath("$.idempotent").value(false));
    }

    @Test
    @DisplayName("Idempotency guarantee returns existing event when idempotencyKey repeated")
    void testIdempotentEventIngestion() throws Exception {
        JsonNode payloadNode = objectMapper.readTree("{\"chargeId\": \"ch_1001\"}");
        EventIngestRequest request = new EventIngestRequest("charge.completed", payloadNode, "idem_charge_1001");

        // First call
        MvcResult firstRes = mockMvc.perform(post("/api/v1/events")
                        .header("X-API-Key", rawApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.idempotent").value(false))
                .andReturn();

        String firstEventId = objectMapper.readTree(firstRes.getResponse().getContentAsString()).get("eventId").asText();

        // Duplicate call with same idempotency key
        MvcResult secondRes = mockMvc.perform(post("/api/v1/events")
                        .header("X-API-Key", rawApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.idempotent").value(true))
                .andReturn();

        String secondEventId = objectMapper.readTree(secondRes.getResponse().getContentAsString()).get("eventId").asText();
        assertThat(firstEventId).isEqualTo(secondEventId);
    }

    @Test
    @DisplayName("Event Ingestion without API Key or token returns HTTP 401")
    void testEventIngestionUnauthenticated() throws Exception {
        JsonNode payloadNode = objectMapper.readTree("{\"test\": true}");
        EventIngestRequest request = new EventIngestRequest("test.event", payloadNode, null);

        mockMvc.perform(post("/api/v1/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Event Ingestion with invalid API Key returns HTTP 401")
    void testEventIngestionInvalidApiKey() throws Exception {
        JsonNode payloadNode = objectMapper.readTree("{\"test\": true}");
        EventIngestRequest request = new EventIngestRequest("test.event", payloadNode, null);

        mockMvc.perform(post("/api/v1/events")
                        .header("X-API-Key", "ep_live_invalid_bad_key_12345678")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Analytics endpoint returns correct structure and metrics")
    void testAnalyticsEndpoint() throws Exception {
        // Ingest an event to have some data
        JsonNode payloadNode = objectMapper.readTree("{\"metric\": \"active\"}");
        EventIngestRequest request = new EventIngestRequest("system.ping", payloadNode, "ping_1");
        mockMvc.perform(post("/api/v1/events")
                        .header("X-API-Key", rawApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());

        // Call analytics API
        mockMvc.perform(get("/api/analytics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalDeliveries").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.successRatePercent").isNumber())
                .andExpect(jsonPath("$.statusBreakdown").isMap());
    }
}
