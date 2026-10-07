# EventPulse Testing Strategy & Test Suite Reference

EventPulse employs a multi-layered verification strategy combining automated unit tests, integration tests against real databases, and a black-box HTTP red-team audit harness.

---

## 1. Testing Layers

```
+-------------------------------------------------------------------+
|               Layer 3: Black-Box HTTP Red-Team Audit              |
|  - Real HTTP requests (Node.js test harness)                      |
|  - Real local webhook receiver server                             |
|  - Independent HMAC-SHA256 signature verification                 |
|  - Multi-tenant boundary traversal tests                          |
|  - Idempotency replay verification                                |
|  - 64 / 64 Assertions Passing (100%)                              |
+-------------------------------------------------------------------+
                                  |
+-------------------------------------------------------------------+
|              Layer 2: Spring Boot Integration Tests               |
|  - MockMvc controller endpoints                                   |
|  - Spring Data JPA repositories with PostgreSQL 17                |
|  - Flyway migration verification                                  |
|  - Ephemeral secure JWT test secrets via Initializer              |
|  - 49 / 49 Maven Tests Passing                                    |
+-------------------------------------------------------------------+
                                  |
+-------------------------------------------------------------------+
|              Layer 1: Unit & Component Tests                      |
|  - BCrypt password encoder tests                                  |
|  - Webhook HMAC signature computation tests                       |
|  - Circuit breaker state machine unit tests                       |
|  - Rate limiter token bucket tests                                |
+-------------------------------------------------------------------+
```

---

## 2. Backend Automated Test Suite (Maven)

### Test Classes & Coverage
- `EventPulseApplicationTests`: Validates Spring application context initialization.
- `SecurityConfigTest`: Verifies public vs protected routes, CSRF disabling, stateless session policies, and 401 response statuses.
- `AuthRegistrationTest`: Tests registration validation, duplicate email handling, and tenant creation.
- `AuthLoginTest`: Validates BCrypt authentication, invalid credential rejections, and JWT emission.
- `AuthServiceTransactionTest`: Verifies rollback atomicity if user creation fails after organization creation.
- `ProjectAndEndpointIntegrationTest`: Verifies project CRUD and endpoint configurations.
- `EventIngestionAndDeliveryTest`: Tests event ingestion, idempotency deduplication, and delivery dispatch.
- `RepositoryIntegrationTest`: Validates multi-tenant isolation at the JPA repository query level with UUID-scoped organizations.

### Ephemeral Secret Injection (`TestJwtEnvironmentInitializer`)
To avoid committing secrets or relying on hardcoded keys in `application.yml`, tests use `TestJwtEnvironmentInitializer`:
```java
public class TestJwtEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        String existingSecret = applicationContext.getEnvironment().getProperty("EVENTPULSE_JWT_SECRET");
        if (existingSecret == null || existingSecret.isBlank()) {
            byte[] keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
            String testSecret = Base64.getEncoder().encodeToString(keyBytes);
            TestPropertyValues.of(
                    "EVENTPULSE_JWT_SECRET=" + testSecret,
                    "eventpulse.jwt.secret=" + testSecret
            ).applyTo(applicationContext.getEnvironment());
        }
    }
}
```

### Running Maven Tests
```powershell
cd backend
.\mvnw.cmd test
```
**Current Result:** `Tests run: 49, Failures: 0, Errors: 0, Skipped: 0` (BUILD SUCCESS).

---

## 3. Real Runtime Red-Team Audit (`scripts/redteam-audit.js`)

The red-team script tests the running application over real HTTP sockets on port 8081 with a live receiver on port 9099.

### Execution Command
```bash
node scripts/redteam-audit.js
```

### Verified Assertions (64 Total):
1. **Actuator Health (3 tests):**
   - HTTP 200 response from `/actuator/health`.
   - Overall application status is `UP`.
   - PostgreSQL database component status is `UP`.
2. **Authentication & JWT Security (14 tests):**
   - Registration creates organization and admin user with HTTP 201.
   - Login validates BCrypt password and issues JWT with HTTP 200.
   - Validates JWT format (3 base64url segments) and cryptographic claims (`sub`, `organization_id`, `email`, `iat`, `exp`).
   - Profile verification via `GET /api/auth/me`.
   - Rejection of invalid credentials with HTTP 401.
   - Rejection of tampered JWT token with HTTP 401.
   - Rejection of unauthenticated access with HTTP 401.
3. **Multi-Tenant Isolation (8 tests):**
   - Organization B registered and authenticated.
   - Cross-tenant read attempts (`GET /api/projects/{projAId}`) return HTTP 404.
   - Cross-tenant update attempts (`PUT /api/projects/{projAId}`) return HTTP 404.
   - Cross-tenant delete attempts (`DELETE /api/projects/{projAId}`) return HTTP 404.
   - Tenant B project listing leaks 0 projects from Tenant A.
4. **API Key Management & Ingestion Security (7 tests):**
   - API key created with `ep_live_` prefix and returned only once.
   - Cross-tenant API key listing returns HTTP 404.
   - Webhook endpoint created with HTTP 201.
   - Machine event ingested with `X-API-Key` returns HTTP 202 Accepted.
   - Outbound delivery record created for matching subscriptions.
5. **Idempotency Key Verification (6 tests):**
   - Initial ingestion with `Idempotency-Key` returns `idempotent: false`.
   - Duplicate ingestion with identical key returns `idempotent: true`.
   - Duplicate ingestion returns original event ID and dispatches 0 new deliveries.
6. **Outbound Delivery & Cryptographic HMAC Verification (6 tests):**
   - Asynchronous worker successfully delivers webhook to local receiver.
   - Verification of `X-EventPulse-Signature`, `X-EventPulse-Event-Id`, `X-EventPulse-Event-Type`, `X-EventPulse-Timestamp` headers.
   - Independent HMAC-SHA256 computation over `${t}.${payload}` matches signature header exactly.
7. **Retries, Circuit Breaker & DLQ (11 tests):**
   - Failing endpoint created returning HTTP 503.
   - Ingestion creates delivery and records attempt with latency and HTTP 503 status code.
   - Delivery attempt record persisted.
   - Circuit breaker reset endpoint resets circuit state to `CLOSED`.
   - Dead-letter queue listing responds with HTTP 200.
8. **AI Diagnostics & Resilient Fallback (9 tests):**
   - Failure analysis returns HTTP 200 via embedded fallback engine without microservice dependency.
   - Root cause accurately classified as `RECEIVER_SERVER_ERROR` with confidence 0.90.
   - Structured remediation suggestions and retry recommendations returned.
   - Project AI incident summary calculates aggregate severity and impacted endpoints.
