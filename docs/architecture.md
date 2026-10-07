# EventPulse System Architecture

## 1. High-Level System Architecture

EventPulse is an enterprise-grade, multi-tenant webhook delivery and observability platform built for high reliability, fault tolerance, and developer clarity. It captures incoming application events, applies strict idempotency guarantees, dispatches outbound HTTP webhooks to subscribed subscriber endpoints with cryptographic signatures, manages automatic retries with circuit breaking, and provides automated AI root-cause diagnostics for failing deliveries.

```
                      +-----------------------------+
                      |   Event Producers (Apps)    |
                      +--------------+--------------+
                                     |
                         HTTP POST /api/v1/events
                      (X-API-Key / Bearer JWT Auth)
                                     v
                      +-----------------------------+
                      |   Spring Boot Backend       |
                      |   (Port 8081 / Java 21)     |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
+---------------------------+                 +---------------------------+
| PostgreSQL 17.4 Database  |                 | Delivery Dispatcher Engine|
| (10 Flyway-Managed Tables)|                 | (Bounded Worker Pool, 10) |
+---------------------------+                 +-------------+-------------+
                                                            |
                                                            v
                                              +---------------------------+
                                              | Outbound Webhook Delivery |
                                              | (HMAC-SHA256, Retries, CB)|
                                              +-------------+-------------+
                                                            |
                                             +--------------+--------------+
                                             |                             |
                                             v                             v
                              +----------------------------+ +----------------------------+
                              | Remote Webhook Receiver    | | Python AI Service / Fallback |
                              | (Stripe-style Verification)| | (Root-Cause Failure Analysis)|
                              +----------------------------+ +----------------------------+
```

---

## 2. Component Breakdown

### 2.1 Backend Core (Spring Boot 3.4.0 / Java 21)
- **Web Layer:** Spring Web MVC with Jakarta Validation (`@Valid`) and REST controllers.
- **Security & Multi-Tenancy:**
  - Stateless Spring Security 6 filter chain with BCrypt password hashing.
  - Dual-mode authentication:
    - **Bearer JWT:** Authenticates dashboard developers using 256-bit HMAC-SHA256 tokens containing `sub` (userId), `organization_id`, and `email`.
    - **X-API-Key:** Authenticates automated machines and ingestion microservices. Raw keys (prefixed `ep_live_...`) are returned once upon creation and stored in PostgreSQL as SHA-256 hashes.
  - Complete tenant isolation enforced in repositories through tenant-scoped queries (`WHERE organization_id = :orgId`).
- **Data Persistence:** Spring Data JPA over PostgreSQL 17.4 managed exclusively with Flyway migrations (`V1` and `V2`). `spring.jpa.hibernate.ddl-auto` is strictly set to `validate`.

### 2.2 Asynchronous Delivery Engine
- **Dispatcher:** `DeliveryDispatcherService` dispatches pending deliveries onto a managed worker pool (`Executors.newFixedThreadPool(10)`).
- **Post-Commit Execution:** Ingestion persists the event and delivery records before dispatching to prevent delivery of uncommitted database transactions (`TransactionSynchronizationManager.registerSynchronization`).
- **Worker Execution:** `WebhookDeliveryWorker` performs the outbound HTTP POST using Java's high-performance `HttpClient` with a 5-second socket connection timeout and 10-second request timeout.
- **Retry Scheduler:** `RetrySchedulerService` polls scheduled retries with jitter and exponential backoff (`next_retry_at <= NOW()`).

### 2.3 Reliability & Resilience Patterns
- **Idempotency:** Driven by unique `(project_id, idempotency_key)` constraints. Replays return the original event ID with `idempotent: true` and create 0 duplicate outbound deliveries.
- **Rate Limiting:** In-memory token bucket rate limiter (`RateLimiterService`) enforces per-endpoint throughput limits (e.g., 60 req/min).
- **Circuit Breaker:** Endpoint-level circuit state machine:
  - `CLOSED`: Normal operation.
  - `OPEN`: Trips after 5 consecutive failures. Pauses traffic to prevent hammering degraded downstreams.
  - `HALF_OPEN`: Automatically probes with a test delivery after 60 seconds of quiescence.
- **Dead-Letter Queue (DLQ):** Deliveries that exceed maximum retry attempts (5 attempts) are automatically quarantined into `dead_letter_events` with error payloads, status codes, and manual replay or discard capabilities.

### 2.4 Cryptographic Webhook Signing
Each outbound webhook includes Stripe-compatible timestamped HMAC-SHA256 signature headers:
```http
X-EventPulse-Signature: t=1741512345,v1=5b28e4693a12...
X-EventPulse-Event-Id: 7b1c4e72-23c8-472d-8b01-52a129d81d22
X-EventPulse-Event-Type: order.created
X-EventPulse-Timestamp: 1741512345
```
The signature is computed over `${timestamp}.${raw_payload}` using the endpoint's configured secret token, defending receivers against man-in-the-middle tampering and replay attacks.

### 2.5 Hybrid AI Failure Diagnosis
- **Microservice Layer:** Python FastAPI service on port 8000 integrated with Google Gemini (`gemini-2.5-flash`) for deep semantic log analysis.
- **Resilient Embedded Engine:** If the Python microservice is offline or unreachable, the Spring Boot backend automatically triggers an internal diagnostic engine (`AiClientService.fallbackAnalyze`) that inspects HTTP response codes, socket exceptions, and error strings to categorize root causes (e.g. `RECEIVER_SERVER_ERROR`, `CLIENT_AUTH_ERROR`, `NETWORK_TIMEOUT`) and generates actionable remediation playbooks.

### 2.6 Frontend Experience (Next.js 14 / React 18)
- Next.js App Router with 15 server and client routes (`/`, `/dashboard`, `/projects`, `/events`, `/endpoints`, `/analytics`, `/dlq`, `/settings`, `/login`, `/register`).
- Dark futuristic theme with custom Tailwind styling.
- Interactive WebGL 3D particle canvas and a flowing letter-by-letter 3D cinematic hero introduction with accessibility skip controls (`Escape` key / `Skip Intro` button).

---

## 3. Database Schema Entity Relationship

```
+-------------------+       +-------------------+       +-------------------+
|   organizations   |<----->|       users       |       |     projects      |
+-------------------+       +-------------------+       +-------------------+
          |                                                       |
          +-------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|     api_keys      |     | webhook_endpoints |     |      events       |
+-------------------+     +-------------------+     +-------------------+
                                    |                         |
                                    +------------+------------+
                                                 |
                                                 v
                                      +--------------------+
                                      |  event_deliveries  |
                                      +--------------------+
                                                 |
                               +-----------------+-----------------+
                               |                                   |
                               v                                   v
                    +--------------------+              +--------------------+
                    | delivery_attempts  |              | dead_letter_events |
                    +--------------------+              +--------------------+
```
