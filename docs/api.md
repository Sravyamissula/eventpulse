# EventPulse REST API Specification

All API requests accept and return JSON. Timestamps follow ISO-8601 UTC.

Base URL: `http://localhost:8081`

---

## 1. Authentication & Security

EventPulse supports two authentication modes:
1. **Bearer JWT Token:** Required for dashboard developer interactions. Pass in header:
   ```http
   Authorization: Bearer <jwt_token>
   ```
2. **Project API Key:** Required for high-throughput machine-to-machine event ingestion. Pass in header:
   ```http
   X-API-Key: ep_live_<alphanumeric_secret>
   ```

---

## 2. Authentication Endpoints

### Register New Tenant & Admin User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "organizationName": "Acme Corp",
    "name": "Alice Auditor",
    "email": "alice@acme.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "organizationId": "1a2b3c4d-...",
    "organizationName": "Acme Corp",
    "userId": "9f8e7d6c-...",
    "email": "alice@acme.com",
    "createdAt": "2026-10-07T12:00:00Z"
  }
  ```

### User Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "organizationId": "1a2b3c4d-...",
    "email": "alice@acme.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
  ```

### Current User Profile
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Auth:** Bearer JWT
- **Response (200 OK):**
  ```json
  {
    "userId": "9f8e7d6c-...",
    "organizationId": "1a2b3c4d-...",
    "email": "alice@acme.com"
  }
  ```

---

## 3. Projects API

### Create Project
- **Method:** `POST`
- **Path:** `/api/projects`
- **Auth:** Bearer JWT
- **Request Body:**
  ```json
  {
    "name": "Production Webhooks",
    "description": "Primary webhook routing pipeline"
  }
  ```
- **Response (201 Created):** Returns project object.

### List Projects
- **Method:** `GET`
- **Path:** `/api/projects`
- **Auth:** Bearer JWT
- **Response (200 OK):** Returns array of projects belonging to the authenticated organization.

### Get / Update / Delete Project
- **`GET /api/projects/{projectId}`**
- **`PUT /api/projects/{projectId}`**
- **`DELETE /api/projects/{projectId}`**

---

## 4. API Keys API

### Create Project API Key
- **Method:** `POST`
- **Path:** `/api/projects/{projectId}/api-keys`
- **Auth:** Bearer JWT
- **Request Body:**
  ```json
  {
    "name": "Ingestion Pipeline Key"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "3c4d5e6f-...",
    "name": "Ingestion Pipeline Key",
    "keyPrefix": "ep_live_9a8b",
    "apiKey": "ep_live_9a8b7c6d5e4f3a2b1...",
    "active": true,
    "createdAt": "2026-10-07T12:00:00Z"
  }
  ```
  *Note: The plaintext `apiKey` is returned only once upon creation. Only SHA-256 hash is persisted.*

### List API Keys
- **Method:** `GET`
- **Path:** `/api/projects/{projectId}/api-keys`
- **Auth:** Bearer JWT

### Revoke API Key
- **Method:** `DELETE`
- **Path:** `/api/projects/{projectId}/api-keys/{keyId}`
- **Auth:** Bearer JWT

---

## 5. Webhook Endpoints API

### Create Webhook Endpoint
- **Method:** `POST`
- **Path:** `/api/projects/{projectId}/endpoints`
- **Auth:** Bearer JWT
- **Request Body:**
  ```json
  {
    "name": "Billing Service Webhook",
    "url": "https://billing.example.com/webhooks",
    "secretToken": "whsec_custom_secret_key",
    "subscribedEvents": ["order.created", "invoice.paid"],
    "rateLimitPerMinute": 120
  }
  ```
- **Response (201 Created):** Returns endpoint object with `circuitState: "CLOSED"`.

### Reset Circuit Breaker
- **Method:** `POST`
- **Path:** `/api/projects/{projectId}/endpoints/{endpointId}/reset-circuit`
- **Auth:** Bearer JWT
- **Response (200 OK):** Returns endpoint with `circuitState: "CLOSED"`, resetting consecutive failure count.

---

## 6. Event Ingestion API

### Ingest Event
- **Method:** `POST`
- **Path:** `/api/v1/events`
- **Auth:** `X-API-Key: ep_live_...` OR Bearer JWT with `?projectId={projectId}`
- **Headers:**
  - `Content-Type: application/json`
  - `Idempotency-Key: <unique_client_key>` (Optional, prevents duplicate processing)
- **Request Body:**
  ```json
  {
    "eventType": "order.created",
    "payload": {
      "orderId": "ord_1001",
      "amount": 149.50,
      "currency": "USD"
    },
    "idempotencyKey": "order_1001_created"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "eventId": "e1f2a3b4-...",
    "projectId": "p1a2b3c4-...",
    "eventType": "order.created",
    "status": "PROCESSING",
    "deliveriesCreated": 2,
    "idempotent": false,
    "createdAt": "2026-10-07T12:00:00Z"
  }
  ```

---

## 7. Deliveries & Delivery Attempts API

### List Project Deliveries
- **Method:** `GET`
- **Path:** `/api/projects/{projectId}/deliveries`
- **Auth:** Bearer JWT

### List Attempts for a Delivery
- **Method:** `GET`
- **Path:** `/api/projects/{projectId}/deliveries/{deliveryId}/attempts`
- **Auth:** Bearer JWT
- **Response (200 OK):**
  ```json
  [
    {
      "id": "a1b2c3d4-...",
      "attemptNumber": 1,
      "httpStatus": 503,
      "latencyMs": 142,
      "errorMessage": "HTTP 503: Service Unavailable",
      "createdAt": "2026-10-07T12:01:00Z"
    }
  ]
  ```

---

## 8. Dead-Letter Queue (DLQ) API

### List DLQ Events
- **Method:** `GET`
- **Path:** `/api/projects/{projectId}/dlq`
- **Auth:** Bearer JWT

### Retry DLQ Delivery
- **Method:** `POST`
- **Path:** `/api/projects/{projectId}/dlq/{dlqId}/retry`
- **Auth:** Bearer JWT
- **Description:** Marks DLQ event as `RESOLVED`, resets delivery attempt counter, and re-dispatches delivery.

### Discard DLQ Delivery
- **Method:** `DELETE`
- **Path:** `/api/projects/{projectId}/dlq/{dlqId}`
- **Auth:** Bearer JWT
- **Description:** Marks DLQ event as `DISCARDED`.

---

## 9. AI Diagnostics API

### Analyze Delivery Failure
- **Method:** `GET`
- **Path:** `/api/projects/{projectId}/deliveries/{deliveryId}/ai-analysis`
- **Auth:** Bearer JWT
- **Response (200 OK):**
  ```json
  {
    "deliveryId": "d1e2f3a4-...",
    "rootCauseCategory": "RECEIVER_SERVER_ERROR",
    "confidenceScore": 0.90,
    "explanation": "Downstream endpoint returned HTTP 503 (Service Unavailable).",
    "suggestedRemediation": [
      "Inspect recipient server logs for application crashes.",
      "Check recipient reverse proxy or load balancer capacity."
    ],
    "retryable": true,
    "recommendedAction": "WAIT_AND_RETRY"
  }
  ```

### Summarize Project Incidents
- **Method:** `GET`
- **Path:** `/api/projects/{projectId}/ai-incident-summary`
- **Auth:** Bearer JWT
- **Response (200 OK):**
  ```json
  {
    "incidentTitle": "Incident Report: 1 Webhook Deliveries Impacted",
    "severity": "LOW",
    "impactSummary": "1 delivery failed across affected endpoints.",
    "affectedEndpoints": ["http://localhost:9099/webhook-fail-503"],
    "commonPattern": "HTTP 503 errors indicate downstream server issues.",
    "recommendations": [
      "Verify target server capacity and availability.",
      "Review rate limits and concurrent request handling."
    ],
    "circuitBreakerAdvice": "Monitor endpoint failure rates to prevent downstream overload."
  }
  ```
