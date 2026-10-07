"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Cpu,
  ShieldCheck,
  Zap,
  Server,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Clock,
  RotateCcw,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const InfrastructureScene3D = dynamic(
  () => import("@/components/InfrastructureScene3D"),
  { ssr: false }
);

const ARCHITECTURE_STEPS = [
  {
    step: "01",
    title: "Ingestion & Security Gate",
    tech: "Spring Security 6 + SHA-256",
    summary:
      "Clients dispatch JSON payloads with an idempotency key and X-API-Key. The security filter validates the SHA-256 hash against PostgreSQL in zero-knowledge mode and verifies tenant ownership.",
    badge: "GATEWAY",
    color: "cyan",
  },
  {
    step: "02",
    title: "Idempotency Lock & Persistence",
    tech: "Spring Data JPA / DB Unique Constraint",
    summary:
      "Events are written to PostgreSQL within a transactional boundary. Compound constraint uq_events_project_idempotency halts duplicate requests before any worker dispatch can occur.",
    badge: "POSTGRES",
    color: "indigo",
  },
  {
    step: "03",
    title: "Transactional Synchronization Dispatch",
    tech: "TransactionSynchronizationManager",
    summary:
      "Deliveries are generated during transaction commit, but dispatch tasks are deferred to afterCommit() hooks. This guarantees async worker threads never query uncommitted deliveries.",
    badge: "CONCURRENCY",
    color: "purple",
  },
  {
    step: "04",
    title: "Sliding-Window Token Bucket Limiter",
    tech: "In-Memory Rate Limiter",
    summary:
      "Before dispatching an HTTP POST to an endpoint, the token bucket checks available capacity. If exceeded, attempts are queued or delayed without exhausting thread pools.",
    badge: "PROTECTION",
    color: "amber",
  },
  {
    step: "05",
    title: "HMAC-SHA256 Signing & HTTP Dispatch",
    tech: "HmacSHA256 + RestTemplate",
    summary:
      "Deliveries compute X-EventPulse-Signature over the payload using the endpoint's secret token. Sub-millisecond latency timers measure TLS handshake and response roundtrips.",
    badge: "DELIVERY",
    color: "emerald",
  },
  {
    step: "06",
    title: "Circuit Breaker State Machine",
    tech: "Closed -> Open -> Half-Open",
    summary:
      "If a consumer endpoint registers 5 consecutive 5xx/timeout failures, the circuit breaker trips to OPEN. Further requests fail fast to prevent cascading resource starvation.",
    badge: "RESILIENCE",
    color: "rose",
  },
  {
    step: "07",
    title: "Dead Letter Queue (DLQ) Quarantine",
    tech: "Exponential Backoff Exhaustion",
    summary:
      "After max retry attempts are exhausted across exponential backoff delays (1s, 2s, 4s...), webhooks are quarantined into the DLQ for manual redrive or automated remediation.",
    badge: "QUARANTINE",
    color: "rose",
  },
  {
    step: "08",
    title: "FastAPI AI Root Cause Intelligence",
    tech: "Python 3.11 / FastAPI + Gemini",
    summary:
      "Delivery failure logs and HTTP error codes are streamed to the AI microservice. When unavailable, an embedded Spring Boot heuristic engine provides seamless zero-downtime fallback.",
    badge: "AI ENGINE",
    color: "purple",
  },
];

export default function ArchitectureDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>Interactive Distributed Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time WebGL spatial topology of the EventPulse high-throughput webhook delivery engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              &larr; Back to Overview
            </Button>
          </Link>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="space-y-3">
        <InfrastructureScene3D />
      </div>

      {/* Architecture Pipeline Step Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              END-TO-END PIPELINE LIFECYCLE
            </h2>
            <p className="text-xs text-slate-400">
              Trace how a single webhook traverses security, deduplication, worker concurrency, and circuit isolation
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">8 Subsystems Verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARCHITECTURE_STEPS.map((s) => (
            <Card
              key={s.step}
              glow={s.color as any}
              className="p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-slate-700/80">
                  {s.step}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-slate-800 text-slate-300">
                  {s.badge}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{s.title}</h3>
                <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                  {s.tech}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {s.summary}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Distributed Systems Guarantees */}
      <Card hoverable={false} className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          SYSTEM DESIGN GUARANTEES & FORMAL INVARIANTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">At-Least-Once Delivery</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Every dispatched webhook is tracked across retries until either a 2xx HTTP response is acknowledged or the DLQ threshold is reached.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">Strict Zero-Race Dispatch</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              TransactionSynchronizationManager ensures workers only query deliveries once the PostgreSQL commit is finalized.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white">Cascading Failure Protection</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Circuit breakers isolate failing consumer servers within 5 consecutive errors, preventing worker pool starvation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
