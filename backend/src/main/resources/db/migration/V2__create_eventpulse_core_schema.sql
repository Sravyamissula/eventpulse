-- V2__create_eventpulse_core_schema.sql
-- EventPulse Core Schema: API Keys, Webhook Endpoints, Events, Deliveries, Attempts, DLQ

-- 1. API Keys table for project-level event ingestion authentication
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_project ON api_keys(project_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- 2. Webhook Endpoints table
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    secret_token VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    circuit_state VARCHAR(32) NOT NULL DEFAULT 'CLOSED',
    failure_count INT NOT NULL DEFAULT 0,
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    circuit_opened_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX idx_endpoints_project ON webhook_endpoints(project_id);
CREATE INDEX idx_endpoints_status ON webhook_endpoints(status);

-- 3. Events table (immutable event log with tenant and project scoping)
CREATE TABLE events (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    idempotency_key VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_events_project_idempotency UNIQUE (project_id, idempotency_key)
);

CREATE INDEX idx_events_org_created ON events(organization_id, created_at DESC);
CREATE INDEX idx_events_project_created ON events(project_id, created_at DESC);
CREATE INDEX idx_events_status ON events(status);

-- 4. Event Deliveries table (tracks delivery per event & endpoint pair)
CREATE TABLE event_deliveries (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_http_status INT,
    last_error TEXT,
    last_latency_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_deliveries_org ON event_deliveries(organization_id);
CREATE INDEX idx_deliveries_event ON event_deliveries(event_id);
CREATE INDEX idx_deliveries_endpoint ON event_deliveries(endpoint_id);
CREATE INDEX idx_deliveries_status_retry ON event_deliveries(status, next_retry_at);

-- 5. Delivery Attempts audit table (immutable attempt history)
CREATE TABLE delivery_attempts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    delivery_id UUID NOT NULL REFERENCES event_deliveries(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    http_status INT,
    latency_ms BIGINT,
    request_headers TEXT,
    request_body TEXT,
    response_headers TEXT,
    response_body TEXT,
    error_message TEXT,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_attempts_delivery ON delivery_attempts(delivery_id, attempt_number);
CREATE INDEX idx_attempts_org ON delivery_attempts(organization_id);

-- 6. Dead Letter Events table (quarantined events after exhausted retries)
CREATE TABLE dead_letter_events (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    delivery_id UUID NOT NULL REFERENCES event_deliveries(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    failed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_dlq_org ON dead_letter_events(organization_id);
CREATE INDEX idx_dlq_project ON dead_letter_events(project_id);
CREATE INDEX idx_dlq_status ON dead_letter_events(status);
