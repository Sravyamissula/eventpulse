package com.eventpulse.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class EventIngestRequest {

    @NotBlank(message = "Event type is required")
    @Size(max = 255, message = "Event type cannot exceed 255 characters")
    private String eventType;

    @NotNull(message = "Payload is required")
    private JsonNode payload;

    @Size(max = 255, message = "Idempotency key cannot exceed 255 characters")
    private String idempotencyKey;

    public EventIngestRequest() {
    }

    public EventIngestRequest(String eventType, JsonNode payload, String idempotencyKey) {
        this.eventType = eventType;
        this.payload = payload;
        this.idempotencyKey = idempotencyKey;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public JsonNode getPayload() {
        return payload;
    }

    public void setPayload(JsonNode payload) {
        this.payload = payload;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
