import os
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="EventPulse AI Intelligence Service",
    description="Microservice providing webhook delivery failure analysis, incident diagnosis, and remediation advice.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class FailureAnalysisRequest(BaseModel):
    delivery_id: Optional[str] = None
    http_status: Optional[int] = None
    error_message: Optional[str] = None
    request_body: Optional[str] = None
    response_body: Optional[str] = None
    endpoint_url: Optional[str] = None
    attempt_count: Optional[int] = 1

class FailureAnalysisResponse(BaseModel):
    delivery_id: Optional[str] = None
    root_cause_category: str
    confidence_score: float
    explanation: str
    suggested_remediation: List[str]
    is_retryable: bool
    recommended_action: str

class IncidentItem(BaseModel):
    delivery_id: Optional[str] = None
    endpoint_url: Optional[str] = None
    http_status: Optional[int] = None
    error_message: Optional[str] = None
    failed_at: Optional[str] = None

class IncidentSummaryRequest(BaseModel):
    project_id: Optional[str] = None
    failures: List[IncidentItem] = Field(default_factory=list)

class IncidentSummaryResponse(BaseModel):
    incident_title: str
    severity: str
    impact_summary: str
    affected_endpoints: List[str]
    common_pattern: str
    recommendations: List[str]
    circuit_breaker_advice: str

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "eventpulse-ai-service",
        "ai_enabled": bool(GEMINI_API_KEY)
    }

def analyze_heuristic(req: FailureAnalysisRequest) -> FailureAnalysisResponse:
    err = (req.error_message or "").lower()
    resp = (req.response_body or "").lower()
    status = req.http_status

    if status == 401 or status == 403 or "unauthorized" in err or "signature" in resp or "forbidden" in err:
        return FailureAnalysisResponse(
            delivery_id=req.delivery_id,
            root_cause_category="AUTHENTICATION_FAILURE",
            confidence_score=0.96,
            explanation="The recipient server rejected the webhook due to an authentication or signature verification failure. The HMAC-SHA256 signature in `X-EventPulse-Signature` did not match the secret key configured on the destination endpoint.",
            suggested_remediation=[
                "Verify that the endpoint secret token in EventPulse matches the recipient's webhook secret.",
                "Ensure the recipient server is computing HMAC-SHA256 across `timestamp + '.' + payload`.",
                "Check whether clock drift between systems exceeds the recipient's tolerance."
            ],
            is_retryable=False,
            recommended_action="UPDATE_ENDPOINT_SECRET"
        )

    if status == 404 or "not found" in resp:
        return FailureAnalysisResponse(
            delivery_id=req.delivery_id,
            root_cause_category="ENDPOINT_NOT_FOUND",
            confidence_score=0.94,
            explanation=f"The endpoint URL '{req.endpoint_url or 'unknown'}' returned HTTP 404 Not Found. The receiving path does not exist or has been moved/deprecated.",
            suggested_remediation=[
                "Confirm the recipient API route path exists and accepts POST requests.",
                "Check for routing typos or missing URL path prefixes (e.g. `/api/v1/webhook`).",
                "Verify whether the customer server recently deployed a breaking route update."
            ],
            is_retryable=False,
            recommended_action="CHECK_RECEIVER_URL"
        )

    if status == 400 or status == 422 or "bad request" in resp or "validation" in resp or "schema" in resp:
        return FailureAnalysisResponse(
            delivery_id=req.delivery_id,
            root_cause_category="SCHEMA_VALIDATION_ERROR",
            confidence_score=0.91,
            explanation="The receiving server rejected the event payload due to a payload validation error (HTTP 400/422). The schema or required fields in the JSON body do not meet the consumer's expectations.",
            suggested_remediation=[
                "Inspect the event JSON payload structure against the recipient's API schema requirements.",
                "Check the recipient response body for specific missing or invalid JSON properties.",
                "Ensure date/time formats and numeric types align with consumer models."
            ],
            is_retryable=False,
            recommended_action="DISCARD"
        )

    if "timeout" in err or "timed out" in err or status == 504:
        return FailureAnalysisResponse(
            delivery_id=req.delivery_id,
            root_cause_category="TIMEOUT",
            confidence_score=0.95,
            explanation="The webhook delivery timed out before receiving a response from the recipient server. The target system may be under heavy load, performing long-running synchronous processing, or experiencing network latency.",
            suggested_remediation=[
                "Advise customer to process webhook delivery asynchronously (e.g. enqueue and respond with 200/202 immediately).",
                "Verify recipient server CPU and thread pool saturation.",
                "EventPulse will automatically retry this delivery using exponential backoff."
            ],
            is_retryable=True,
            recommended_action="WAIT_AND_RETRY"
        )

    if "connectexception" in err or "connection refused" in err or "unknownhostexception" in err:
        return FailureAnalysisResponse(
            delivery_id=req.delivery_id,
            root_cause_category="ENDPOINT_UNAVAILABLE",
            confidence_score=0.97,
            explanation="Could not establish a TCP connection to the destination host. The target server is either down, DNS resolution failed, or a firewall is blocking incoming traffic.",
            suggested_remediation=[
                "Check if the host is reachable and DNS resolves correctly.",
                "Verify that port 443 / 80 is open to inbound webhook traffic.",
                "Inspect status pages or infrastructure health of the destination server."
            ],
            is_retryable=True,
            recommended_action="WAIT_AND_RETRY"
        )

    if status in [500, 502, 503]:
        return FailureAnalysisResponse(
            delivery_id=req.delivery_id,
            root_cause_category="RECEIVER_SERVER_ERROR",
            confidence_score=0.93,
            explanation=f"The destination server encountered an internal server error (HTTP {status}). This indicates an unhandled exception or upstream reverse-proxy failure on the customer server.",
            suggested_remediation=[
                "Check the recipient server's application logs around the failure timestamp.",
                "Verify reverse proxy / gateway error logs (e.g. Nginx, Cloudflare).",
                "EventPulse exponential backoff will automatically retry to allow transient service recovery."
            ],
            is_retryable=True,
            recommended_action="WAIT_AND_RETRY"
        )

    return FailureAnalysisResponse(
        delivery_id=req.delivery_id,
        root_cause_category="UNCLASSIFIED_ERROR",
        confidence_score=0.75,
        explanation=f"Webhook delivery failed with error: {req.error_message or 'HTTP ' + str(req.http_status)}.",
        suggested_remediation=[
            "Review recipient server access logs and delivery attempt audit history.",
            "Verify network stability and request headers."
        ],
        is_retryable=True,
        recommended_action="WAIT_AND_RETRY"
    )

@app.post("/api/ai/analyze-failure", response_model=FailureAnalysisResponse)
async def analyze_failure(request: FailureAnalysisRequest):
    return analyze_heuristic(request)

@app.post("/api/ai/summarize-incident", response_model=IncidentSummaryResponse)
async def summarize_incident(request: IncidentSummaryRequest):
    total = len(request.failures)
    if total == 0:
        return IncidentSummaryResponse(
            incident_title="No Active Delivery Incidents",
            severity="LOW",
            impact_summary="Zero delivery failures recorded. All endpoints are delivering normally.",
            affected_endpoints=[],
            common_pattern="All systems healthy.",
            recommendations=["Continue routine monitoring."],
            circuit_breaker_advice="Keep all circuit breakers in CLOSED state."
        )

    endpoints = list({f.endpoint_url for f in request.failures if f.endpoint_url})
    statuses = [f.http_status for f in request.failures if f.http_status is not None]

    severity = "MEDIUM"
    if total >= 20 or len(endpoints) >= 3:
        severity = "HIGH"
    if total >= 50:
        severity = "CRITICAL"

    pattern = f"{total} delivery failures detected across {len(endpoints)} endpoint(s)."
    if 500 in statuses or 503 in statuses or 502 in statuses:
        pattern += " Predominant error pattern: Upstream server outages and 5xx errors."
    elif 401 in statuses or 403 in statuses:
        pattern += " Predominant error pattern: HMAC signature or authentication rejections."
    elif 404 in statuses:
        pattern += " Predominant error pattern: Endpoint routes not found."

    recommendations = [
        "Audit affected endpoints for recent code deployments or secret rotations.",
        "Check Dead Letter Queue (DLQ) for quarantined events needing manual retry.",
        "Verify receiving server resource utilization (memory, CPU, connection pools)."
    ]

    cb_advice = "Circuit breakers have isolated failing endpoints to protect system throughput. Once downstream health is verified, use the dashboard or reset endpoint to return circuits to CLOSED."

    return IncidentSummaryResponse(
        incident_title=f"Webhook Delivery Incident: {total} Failures Detected",
        severity=severity,
        impact_summary=f"{total} webhooks impacted across {len(endpoints)} endpoint destination(s).",
        affected_endpoints=endpoints,
        common_pattern=pattern,
        recommendations=recommendations,
        circuit_breaker_advice=cb_advice
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
