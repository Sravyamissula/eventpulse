# EventPulse: Technical Interview & System Design Guide

This document prepares engineers to discuss EventPulse in technical and system design interviews, highlighting architectural trade-offs, distributed systems invariants, and production engineering practices.

---

## 1. Executive Summary & Elevator Pitch

> *"EventPulse is a multi-tenant, fault-tolerant webhook delivery and observability platform built with Spring Boot 3.4 (Java 21), PostgreSQL 17, and Next.js 14. It addresses the core challenges of distributed asynchronous event notification: preventing lost deliveries, guaranteeing idempotency, securing payloads with cryptographic HMAC signatures, protecting degraded subscribers with circuit breakers, and leveraging AI diagnostics to identify downstream failure patterns."*

---

## 2. Core System Design Invariants & Trade-offs

### 2.1 Multi-Tenancy & Data Isolation
- **Approach:** Shared database, discriminator column (`organization_id`) enforced across all entity tables.
- **Why not separate databases or schemas per tenant?**
  - Database-per-tenant adds operational complexity, connection pool bloat, and slow schema migrations at scale.
  - Schema-per-tenant requires complex dynamic data source routing.
  - Discriminator column with composite indexing `(organization_id, id)` provides sub-millisecond query performance while keeping infrastructure simple.
- **Enforcement:** Enforced at the JPA repository query level. All queries in `ProjectRepository`, `WebhookEndpointRepository`, `ApiKeyRepository`, etc., require `organization_id` as part of their search parameters. Cross-tenant access returns HTTP 404 (not 403), preventing enumeration of valid resource IDs across tenants.

### 2.2 Ingestion Idempotency & De-duplication
- **The Problem:** In an unreliable network, event producers retry requests, risking duplicate webhook deliveries to downstream endpoints.
- **The Solution:**
  - Clients provide an `Idempotency-Key` (header or JSON body).
  - A unique database constraint on `(project_id, idempotency_key)` guarantees atomicity.
  - When a duplicate key is detected within the project scope, the backend short-circuits: it does not insert a new event, does not create new delivery records, and returns HTTP 202 with `idempotent: true` and the original `eventId`.

### 2.3 Post-Commit Transactional Dispatching
- **The Race Condition:** If an event is ingested and immediately dispatched to an asynchronous worker thread *inside* the database transaction, the worker might query PostgreSQL before the transaction commits, resulting in an entity not found error.
- **The Fix:** EventPulse leverages Spring's `TransactionSynchronizationManager.registerSynchronization(afterCommit)`:
  ```java
  TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
      @Override
      public void afterCommit() {
          dispatcherService.dispatch(deliveryId);
      }
  });
  ```
  This guarantees that workers only process deliveries that are durably committed to disk.

### 2.4 Worker Pool vs. Message Broker (Architecture Reality Check)
- **Current Implementation:** Bounded concurrent worker pool (`Executors.newFixedThreadPool(10)`) managed by `DeliveryDispatcherService`, backed by PostgreSQL row persistence.
- **Why this choice?**
  - Zero external broker dependencies for local development and self-contained deployments.
  - PostgreSQL serves as the durable write-ahead log and state store.
- **Enterprise Scale Path:**
  - In a hyper-scale deployment (>10,000 deliveries/sec), the in-memory pool can be replaced by **Redis Streams** with consumer groups or **Apache Kafka** partitioned by `endpoint_id`. The application's `DeliveryDispatcherService` and `WebhookDeliveryWorker` are cleanly decoupled to support swapping the underlying transport without altering business logic.

### 2.5 Downstream Protection: Rate Limiting & Circuit Breaker
- **Token Bucket Rate Limiting:** Prevents flooding subscriber endpoints that have strict ingestion limits.
- **Circuit Breaker State Machine:**
  - **CLOSED:** Normal delivery traffic.
  - **OPEN:** After 5 consecutive delivery failures (e.g., 500, 503, timeouts), the circuit opens. Deliveries are paused for 60 seconds.
  - **HALF_OPEN:** After the timeout, exactly one probe delivery is allowed through. If it succeeds, the circuit closes; if it fails, the circuit re-opens for another window.
  - Prevents the *thundering herd problem* against already-failing downstream services.

### 2.6 Cryptographic Signing (HMAC-SHA256)
- **Format:** `X-EventPulse-Signature: t={timestamp},v1={hex_signature}`
- **Security Features:**
  - **Payload Tampering Defense:** Computes HMAC over `${timestamp}.${raw_payload}`.
  - **Replay Attack Defense:** The subscriber verifies that `${timestamp}` is within a reasonable window (e.g., 5 minutes) before verifying the cryptographic hash.
  - Compatible with standard webhook verification libraries (e.g., Stripe, GitHub).

### 2.7 Resilient AI Failure Diagnostics
- **Hybrid Architecture:**
  - When the Python AI microservice (Google Gemini) is available, deep semantic diagnostics are performed.
  - If the AI microservice is offline or experiencing network partitions, the Spring Boot backend falls back to an internal rule-based inference engine (`AiClientService.fallbackAnalyze`), ensuring 100% API availability with zero downtime.

---

## 3. High-Frequency Interview Questions

### Q1: How do you guarantee at-least-once delivery?
> *"Every delivery is tracked in the `event_deliveries` table with an explicit status (`PENDING`, `SUCCESS`, `RETRYING`, `FAILED`). If an outbound HTTP request fails or times out, the worker increments `attempt_count`, records a `delivery_attempts` log row, and computes an exponential backoff timestamp. A background `RetrySchedulerService` continuously queries for overdue retries (`next_retry_at <= NOW()`), ensuring no delivery is permanently lost if an individual worker thread crashes."*

### Q2: How do you prevent webhook delivery stampedes?
> *"We use a two-tier defense: First, each endpoint has an independent token bucket rate limiter to throttle request bursts. Second, our circuit breaker trips to `OPEN` after 5 consecutive failures, immediately pausing deliveries to that endpoint and rescheduling them rather than continuously hammering the failing server."*

### Q3: Why do cross-tenant unauthorized queries return 404 instead of 403?
> *"Returning HTTP 403 Forbidden confirms to an attacker that a resource ID exists in the system, enabling resource enumeration attacks. Returning HTTP 404 Not Found completely isolates the tenant's view of the database—if a resource does not belong to your organization, it does not exist."*

### Q4: How is secret safety maintained in production?
> *"The backend enforces fail-fast startup if `EVENTPULSE_JWT_SECRET` is unset. In configuration files, no default secret keys are hardcoded. In tests, `TestJwtEnvironmentInitializer` dynamically generates ephemeral 256-bit cryptographically secure keys in memory for each run."*
