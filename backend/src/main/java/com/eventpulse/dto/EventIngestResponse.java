package com.eventpulse.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class EventIngestResponse {

    private UUID eventId;
    private UUID projectId;
    private String eventType;
    private String status;
    private int deliveriesCreated;
    private boolean idempotent;
    private OffsetDateTime createdAt;

    public EventIngestResponse() {
    }

    public EventIngestResponse(UUID eventId, UUID projectId, String eventType, String status,
                               int deliveriesCreated, boolean idempotent, OffsetDateTime createdAt) {
        this.eventId = eventId;
        this.projectId = projectId;
        this.eventType = eventType;
        this.status = status;
        this.deliveriesCreated = deliveriesCreated;
        this.idempotent = idempotent;
        this.createdAt = createdAt;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getDeliveriesCreated() {
        return deliveriesCreated;
    }

    public void setDeliveriesCreated(int deliveriesCreated) {
        this.deliveriesCreated = deliveriesCreated;
    }

    public boolean isIdempotent() {
        return idempotent;
    }

    public void setIdempotent(boolean idempotent) {
        this.idempotent = idempotent;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
