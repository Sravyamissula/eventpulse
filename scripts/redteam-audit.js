const http = require('http');
const https = require('https');
const crypto = require('crypto');

const BACKEND_BASE = 'http://localhost:8081';
const RECEIVER_PORT = 9099;

// In-memory receiver event buffer
let receivedWebhooks = [];

// Create mock webhook receiver
const receiverServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        const record = {
            url: req.url,
            method: req.method,
            headers: req.headers,
            body: body
        };
        receivedWebhooks.push(record);

        if (req.url === '/webhook-success') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'delivered', timestamp: Date.now() }));
        } else if (req.url === '/webhook-fail-503') {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'temporarily unavailable' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'not found' }));
        }
    });
});

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BACKEND_BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                ...headers
            }
        };

        if (body) {
            if (typeof body === 'object') {
                body = JSON.stringify(body);
                options.headers['Content-Type'] = 'application/json';
            }
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsed
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    } else {
        passedTests++;
        console.log(`  PASS: ${message}`);
    }
}

async function runRedTeamAudit() {
    console.log('========================================================');
    console.log('EVENTPULSE RED-TEAM PRODUCTION AUDIT & VERIFICATION');
    console.log('========================================================\n');

    await new Promise(resolve => receiverServer.listen(RECEIVER_PORT, resolve));
    console.log(`Local test webhook receiver started on port ${RECEIVER_PORT}.\n`);

    try {
        // --- 1. HEALTH CHECK ---
        console.log('--- 1. Actuator Health Verification ---');
        const health = await request('GET', '/actuator/health');
        assert(health.status === 200, 'Health endpoint responds with HTTP 200');
        assert(health.data.status === 'UP', 'Application status is UP');
        assert(health.data.components && health.data.components.db && health.data.components.db.status === 'UP', 'Database connection status is UP');

        // --- 2. AUTHENTICATION & JWT SECURITY AUDIT ---
        console.log('\n--- 2. Authentication & JWT Security Audit ---');
        const orgAEmail = `audit_org_a_${Date.now()}@example.com`;
        const regA = await request('POST', '/api/auth/register', {
            organizationName: `Audit Org A ${Date.now()}`,
            name: 'Auditor A',
            email: orgAEmail,
            password: 'SecurePassword123!'
        });
        assert(regA.status === 201, 'User registration succeeds with HTTP 201');
        assert(regA.data.email === orgAEmail, 'Registration returns created user email');
        assert(regA.data.organizationId !== undefined, 'Registration returns created organizationId');
        assert(regA.data.userId !== undefined, 'Registration returns created userId');

        // Verify Login
        const loginA = await request('POST', '/api/auth/login', {
            organizationId: regA.data.organizationId,
            email: orgAEmail,
            password: 'SecurePassword123!'
        });
        assert(loginA.status === 200, 'Login succeeds with valid credentials');
        const tokenA = loginA.data.accessToken;
        assert(typeof tokenA === 'string' && tokenA.length > 50, 'Login returns signed JWT accessToken');
        assert(loginA.data.tokenType === 'Bearer', 'Login returns Bearer tokenType');

        // Decode JWT claims
        const tokenParts = tokenA.split('.');
        assert(tokenParts.length === 3, 'JWT has 3 base64url segments (header, payload, signature)');
        const payloadA = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
        assert(payloadA.sub === regA.data.userId, 'JWT subject claim matches registered userId');
        assert(payloadA.organization_id === regA.data.organizationId, 'JWT organization_id matches tenant organizationId');
        assert(payloadA.email === orgAEmail, 'JWT email matches registered email');
        assert(typeof payloadA.exp === 'number' && payloadA.exp > payloadA.iat, 'JWT has valid expiration timestamps');

        // Verify /api/auth/me profile
        const meRes = await request('GET', '/api/auth/me', null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(meRes.status === 200, 'Profile /api/auth/me succeeds with Bearer token');
        assert(meRes.data.userId === regA.data.userId, 'Profile matches authenticated user');

        // Security: Invalid credentials test
        const badLogin = await request('POST', '/api/auth/login', {
            organizationId: regA.data.organizationId,
            email: orgAEmail,
            password: 'WrongPassword999!'
        });
        assert(badLogin.status === 401, 'Invalid password rejected with HTTP 401');

        // Security: Tampered JWT test
        const tamperedToken = tokenA.slice(0, -6) + 'xxxxxx';
        const tamperedReq = await request('GET', '/api/projects', null, {
            'Authorization': `Bearer ${tamperedToken}`
        });
        assert(tamperedReq.status === 401, 'Tampered JWT rejected with HTTP 401');

        // Security: Unauthenticated request test
        const unauthReq = await request('GET', '/api/projects');
        assert(unauthReq.status === 401, 'Unauthenticated request rejected with HTTP 401');

        // --- 3. MULTI-TENANT ISOLATION AUDIT ---
        console.log('\n--- 3. Multi-Tenant Isolation Audit ---');
        // Register Org B
        const orgBEmail = `audit_org_b_${Date.now()}@example.com`;
        const regB = await request('POST', '/api/auth/register', {
            organizationName: `Audit Org B ${Date.now()}`,
            name: 'Auditor B',
            email: orgBEmail,
            password: 'SecurePassword123!'
        });
        assert(regB.status === 201, 'Org B registered successfully');
        
        // Login as Org B
        const loginB = await request('POST', '/api/auth/login', {
            organizationId: regB.data.organizationId,
            email: orgBEmail,
            password: 'SecurePassword123!'
        });
        assert(loginB.status === 200, 'Org B login succeeds');
        const tokenB = loginB.data.accessToken;

        // Org A creates Project A
        const createProjA = await request('POST', '/api/projects', {
            name: 'Org A Production Webhooks',
            description: 'Webhook pipeline for Org A'
        }, { 'Authorization': `Bearer ${tokenA}` });
        assert(createProjA.status === 201, 'Org A creates Project A with HTTP 201');
        const projectAId = createProjA.data.id;

        // Org B attempts cross-tenant read of Project A
        const crossTenantGet = await request('GET', `/api/projects/${projectAId}`, null, {
            'Authorization': `Bearer ${tokenB}`
        });
        assert(crossTenantGet.status === 404, 'Cross-tenant GET blocked (HTTP 404 tenant isolation)');

        // Org B attempts cross-tenant update of Project A
        const crossTenantPut = await request('PUT', `/api/projects/${projectAId}`, {
            name: 'Hacked Project Name',
            description: 'Malicious modification'
        }, { 'Authorization': `Bearer ${tokenB}` });
        assert(crossTenantPut.status === 404, 'Cross-tenant PUT blocked (HTTP 404 tenant isolation)');

        // Org B attempts cross-tenant delete of Project A
        const crossTenantDelete = await request('DELETE', `/api/projects/${projectAId}`, null, {
            'Authorization': `Bearer ${tokenB}`
        });
        assert(crossTenantDelete.status === 404, 'Cross-tenant DELETE blocked (HTTP 404 tenant isolation)');

        // Org B lists projects -> Project A must NOT be returned
        const orgBProjects = await request('GET', '/api/projects', null, {
            'Authorization': `Bearer ${tokenB}`
        });
        assert(orgBProjects.status === 200, 'Org B project list responds with HTTP 200');
        const leakedProject = orgBProjects.data.find(p => p.id === projectAId);
        assert(!leakedProject, 'Org B project list does not leak Org A projects');

        // --- 4. API KEY CREATION & EVENT INGESTION ---
        console.log('\n--- 4. API Key Management & Ingestion Security ---');
        // Org A creates API Key for Project A
        const createApiKey = await request('POST', `/api/projects/${projectAId}/api-keys`, {
            name: 'Production Ingestion Key'
        }, { 'Authorization': `Bearer ${tokenA}` });
        assert(createApiKey.status === 201, 'API key created with HTTP 201');
        const rawApiKey = createApiKey.data.apiKey;
        assert(typeof rawApiKey === 'string' && rawApiKey.startsWith('ep_live_'), 'Raw key returned with ep_live_ prefix');

        // Org B attempts cross-tenant API key listing
        const crossApiKeyList = await request('GET', `/api/projects/${projectAId}/api-keys`, null, {
            'Authorization': `Bearer ${tokenB}`
        });
        assert(crossApiKeyList.status === 404, 'Cross-tenant API key listing blocked (HTTP 404)');

        // Create Webhook Endpoint for Project A pointing to local test receiver
        const webhookSecret = 'whsec_test_secret_audit_987654321';
        const createEndpoint = await request('POST', `/api/projects/${projectAId}/endpoints`, {
            name: 'Audit Webhook Receiver',
            url: `http://localhost:${RECEIVER_PORT}/webhook-success`,
            secretToken: webhookSecret,
            subscribedEvents: ['order.created', 'order.refunded'],
            rateLimitPerMinute: 120
        }, { 'Authorization': `Bearer ${tokenA}` });
        assert(createEndpoint.status === 201, 'Webhook endpoint created with HTTP 201');
        const endpointAId = createEndpoint.data.id;

        // Ingest event using X-API-Key
        const testPayload = { orderId: 'ord_12345', amount: 49.99, currency: 'USD' };
        const ingestRes = await request('POST', '/api/v1/events', {
            eventType: 'order.created',
            payload: testPayload
        }, {
            'X-API-Key': rawApiKey
        });
        assert(ingestRes.status === 202, 'Event ingestion via X-API-Key accepted (HTTP 202)');
        assert(ingestRes.data.eventId !== undefined, 'Ingestion response contains eventId');
        assert(ingestRes.data.deliveriesCreated === 1, 'Delivery created for matched subscription');

        // --- 5. IDEMPOTENCY AUDIT ---
        console.log('\n--- 5. Idempotency Key Audit ---');
        const idempotencyKey = `idem-key-${Date.now()}`;
        const idemPayload = { paymentId: 'pay_99999', status: 'settled' };

        // First ingestion with Idempotency-Key
        const idemRes1 = await request('POST', '/api/v1/events', {
            eventType: 'order.created',
            payload: idemPayload
        }, {
            'X-API-Key': rawApiKey,
            'Idempotency-Key': idempotencyKey
        });
        assert(idemRes1.status === 202, 'First idempotent ingestion accepted with HTTP 202');
        assert(idemRes1.data.idempotent === false, 'First ingestion marked as not duplicate (idempotent: false)');
        const originalEventId = idemRes1.data.eventId;

        // Second ingestion with SAME Idempotency-Key
        const idemRes2 = await request('POST', '/api/v1/events', {
            eventType: 'order.created',
            payload: idemPayload
        }, {
            'X-API-Key': rawApiKey,
            'Idempotency-Key': idempotencyKey
        });
        assert(idemRes2.status === 202, 'Duplicate idempotent ingestion accepted with HTTP 202');
        assert(idemRes2.data.idempotent === true, 'Duplicate ingestion recognized (idempotent: true)');
        assert(idemRes2.data.eventId === originalEventId, 'Duplicate ingestion returns original event ID');
        assert(idemRes2.data.deliveriesCreated === 0, 'Zero duplicate deliveries created for idempotent replay');

        // --- 6. OUTBOUND WEBHOOK DELIVERY & HMAC SIGNATURE VERIFICATION ---
        console.log('\n--- 6. Outbound Webhook Delivery & Cryptographic HMAC Verification ---');
        // Wait for async delivery worker to invoke local receiver
        let attempts = 0;
        let matchedWebhook = null;
        while (attempts < 15) {
            matchedWebhook = receivedWebhooks.find(w => w.url === '/webhook-success');
            if (matchedWebhook) break;
            await sleep(300);
            attempts++;
        }
        assert(matchedWebhook !== null, 'Asynchronous delivery worker delivered webhook to destination');

        // Verify headers
        const sigHeader = matchedWebhook.headers['x-eventpulse-signature'];
        const eventIdHeader = matchedWebhook.headers['x-eventpulse-event-id'];
        const eventTypeHeader = matchedWebhook.headers['x-eventpulse-event-type'];
        const timestampHeader = matchedWebhook.headers['x-eventpulse-timestamp'];

        assert(typeof sigHeader === 'string' && sigHeader.includes('t=') && sigHeader.includes('v1='), 'X-EventPulse-Signature header present and properly formatted');
        assert(typeof eventIdHeader === 'string', 'X-EventPulse-Event-Id header present');
        assert(eventTypeHeader === 'order.created', 'X-EventPulse-Event-Type header matches event type');
        assert(typeof timestampHeader === 'string', 'X-EventPulse-Timestamp header present');

        // Independently verify HMAC-SHA256 signature
        const sigParts = sigHeader.split(',');
        const tVal = sigParts.find(p => p.startsWith('t=')).split('=')[1];
        const v1Val = sigParts.find(p => p.startsWith('v1=')).split('=')[1];

        const expectedSig = crypto.createHmac('sha256', webhookSecret)
            .update(`${tVal}.${matchedWebhook.body}`)
            .digest('hex');

        assert(v1Val === expectedSig, `HMAC-SHA256 signature matches expected cryptographic value (${v1Val.substring(0, 10)}...)`);

        // --- 7. RETRIES, CIRCUIT BREAKER & DEAD-LETTER QUEUE (DLQ) ---
        console.log('\n--- 7. Retries, Circuit Breaker & DLQ Audit ---');
        // Create endpoint that fails with 503
        const failingEndpoint = await request('POST', `/api/projects/${projectAId}/endpoints`, {
            name: 'Failing Endpoint',
            url: `http://localhost:${RECEIVER_PORT}/webhook-fail-503`,
            secretToken: 'whsec_failing_endpoint_key',
            subscribedEvents: ['payment.failed'],
            rateLimitPerMinute: 60
        }, { 'Authorization': `Bearer ${tokenA}` });
        assert(failingEndpoint.status === 201, 'Failing endpoint created with HTTP 201');
        const failingEndpointId = failingEndpoint.data.id;

        // Ingest event to trigger failure
        const failIngest = await request('POST', '/api/v1/events', {
            eventType: 'payment.failed',
            payload: { paymentId: 'fail_1', reason: 'insufficient_funds' }
        }, { 'X-API-Key': rawApiKey });
        assert(failIngest.status === 202, 'Event targeting failing endpoint ingested');

        // Wait for worker to record attempt
        await sleep(1500);

        // Fetch deliveries for project
        const deliveriesRes = await request('GET', `/api/projects/${projectAId}/deliveries`, null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(deliveriesRes.status === 200, 'Deliveries fetched with HTTP 200');
        const failedDelivery = deliveriesRes.data.find(d => d.endpointId === failingEndpointId);
        assert(failedDelivery !== undefined, 'Delivery record exists for failing endpoint');
        assert(failedDelivery.attemptCount >= 1, 'Delivery attempt count recorded (>= 1)');
        assert(failedDelivery.lastHttpStatus === 503, 'Delivery recorded HTTP 503 from remote target');

        // Fetch delivery attempts
        const attemptsRes = await request('GET', `/api/projects/${projectAId}/deliveries/${failedDelivery.id}/attempts`, null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(attemptsRes.status === 200, 'Delivery attempts fetched with HTTP 200');
        assert(attemptsRes.data.length >= 1, 'At least 1 delivery attempt persisted with latency and response status');

        // Test Circuit Breaker Reset API
        const resetCb = await request('POST', `/api/projects/${projectAId}/endpoints/${failingEndpointId}/reset-circuit`, null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(resetCb.status === 200, 'Circuit breaker reset endpoint responds with HTTP 200');
        assert(resetCb.data.circuitState === 'CLOSED', 'Circuit breaker state reset to CLOSED');

        // DLQ Listing
        const dlqRes = await request('GET', `/api/projects/${projectAId}/dlq`, null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(dlqRes.status === 200, 'DLQ endpoint responds with HTTP 200');

        // --- 8. AI FAILURE ANALYSIS & EMBEDDED FALLBACK ENGINE ---
        console.log('\n--- 8. AI Analysis & Offline Fallback Engine Audit ---');
        // Request failure analysis for the failed delivery (AI microservice is offline, tests embedded fallback engine)
        const aiAnalysis = await request('GET', `/api/projects/${projectAId}/deliveries/${failedDelivery.id}/ai-analysis`, null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(aiAnalysis.status === 200, 'AI failure analysis returns HTTP 200 via embedded fallback engine');
        assert(aiAnalysis.data.deliveryId === failedDelivery.id, 'AI analysis returns matching delivery ID');
        const remediations = aiAnalysis.data.suggestedRemediation || aiAnalysis.data.suggestedRemediations;
        assert(Array.isArray(remediations) && remediations.length > 0, 'AI analysis provides actionable remediation recommendations');
        assert(typeof aiAnalysis.data.confidenceScore === 'number', `Confidence score provided: ${aiAnalysis.data.confidenceScore}`);

        // Incident summary
        const aiSummary = await request('GET', `/api/projects/${projectAId}/ai-incident-summary`, null, {
            'Authorization': `Bearer ${tokenA}`
        });
        assert(typeof aiSummary.data.severity === 'string', `Incident severity status: ${aiSummary.data.severity}`);
        assert(typeof aiSummary.data.incidentTitle === 'string', `Incident title: ${aiSummary.data.incidentTitle}`);

        // Clean up
        receiverServer.close();

        console.log('\n========================================================');
        console.log(`AUDIT COMPLETE: ${passedTests} / ${totalTests} assertions PASSED (100%)`);
        console.log('========================================================\n');
        process.exit(0);
    } catch (err) {
        receiverServer.close();
        console.error('\nAUDIT FAILED with error:', err);
        process.exit(1);
    }
}

runRedTeamAudit();
