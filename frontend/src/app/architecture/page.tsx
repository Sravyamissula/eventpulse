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
  ExternalLink,
  Activity,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const InfrastructureScene3D = dynamic(
  () => import("@/components/InfrastructureScene3D"),
  { ssr: false }
);

const ARCHITECTURE_SUBSYSTEMS = [
  {
    step: "01",
    title: "Client & Ingestion Gate",
    tech: "Spring Security 6 / SHA-256",
    summary:
      "Clients dispatch JSON payloads with an idempotency key and X-API-Key. The security layer authenticates with zero plaintext key exposure and scopes requests to multi-tenant projects.",
    badge: "GATEWAY",
    color: "cyan",
  },
  {
    step: "02",
    title: "Idempotent Event Ledger",
    tech: "PostgreSQL 17.4 / Flyway V2",
    summary:
      "Events are stored with compound database constraint (project_id, idempotency_key). Duplicate dispatches return the existing record immediately without re-triggering deliveries.",
    badge: "POSTGRES",
    color: "indigo",
  },
  {
    step: "03",
    title: "Transactional Synchronization Dispatch",
    tech: "TransactionSynchronizationManager",
    summary:
      "Outbound delivery records are committed with the event, and worker dispatch tasks are registered via afterCommit() hooks. Eliminates race conditions where workers query uncommitted rows.",
    badge: "CONCURRENCY",
    color: "purple",
  },
  {
    step: "04",
    title: "Token Bucket Rate Limiter",
    tech: "Sliding-Window Limiter",
    summary:
      "Protects consumer endpoint capacity using an in-memory token bucket. Requests exceeding rate limits are deferred rather than dropped.",
    badge: "PROTECTION",
    color: "amber",
  },
  {
    step: "05",
    title: "HMAC-SHA256 Signing Engine",
    tech: "HmacSHA256 Signer",
    summary:
      "Every outbound HTTP request is cryptographically signed with X-EventPulse-Signature so receivers can authenticate payloads and prevent replay attacks.",
    badge: "SECURITY",
    color: "emerald",
  },
  {
    step: "06",
    title: "Circuit Breaker Fault Isolation",
    tech: "State Machine (Closed / Open / Half-Open)",
    summary:
      "If a consumer registers 5 consecutive errors or timeouts, the circuit trips to OPEN. Requests fail fast, protecting system thread pools and isolating bad downstreams.",
    badge: "RESILIENCE",
    color: "rose",
  },
  {
    step: "07",
    title: "Dead Letter Queue (DLQ) Redrive",
    tech: "Exponential Backoff Quarantine",
    summary:
      "After max retry attempts are exhausted across exponential backoff delays, webhooks are quarantined into the DLQ with full diagnostic history for redrive.",
    badge: "QUARANTINE",
    color: "rose",
  },
  {
    step: "08",
    title: "AI Failure Analysis Engine",
    tech: "FastAPI + Gemini / Heuristic Fallback",
    summary:
      "Autonomous AI root cause analysis clusters error patterns, classifies destination response codes, and provides actionable remediation guidance.",
    badge: "AI ENGINE",
    color: "purple",
  },
];

export default function PublicArchitecturePage() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            Event<span className="text-cyan-400">Pulse</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Architecture
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono">
          <Link href="/dashboard" className="text-slate-300 hover:text-white transition">
            Dashboard
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="primary">
              Launch App &rarr;
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 space-y-10 w-full">
        {/* Title Header */}
        <div className="space-y-2 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>WebGL 3D Distributed Systems Topology</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white">
            Distributed Systems <span className="gradient-text">Architecture</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-mono">
            Interactive spatial visualization of the EventPulse high-reliability webhook delivery engine. Hover over nodes to inspect component telemetry.
          </p>
        </div>

        {/* 3D Scene */}
        <InfrastructureScene3D />

        {/* Subsystems Matrix */}
        <div className="space-y-6 pt-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Subsystem Pipeline Specifications
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Designed for extreme reliability, multi-tenancy, and automated failure recovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ARCHITECTURE_SUBSYSTEMS.map((sub) => (
              <Card
                key={sub.step}
                glow={sub.color as any}
                className="p-5 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-slate-700/80">
                    {sub.step}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface border border-slate-800 text-slate-300">
                    {sub.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{sub.title}</h3>
                  <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                    {sub.tech}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {sub.summary}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Formal Invariants */}
        <Card hoverable={false} className="p-8 space-y-4">
          <h3 className="text-base font-semibold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ENGINEERING RIGOR & DISTRIBUTED INVARIANTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold">1. Zero-Race Condition Guarantee</span>
              <p className="text-slate-400 text-xs leading-relaxed">
                Transactional dispatch synchronization prevents worker threads from executing delivery attempts before database commit boundaries are sealed.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-2">
              <span className="text-purple-400 font-bold">2. Strict Idempotency Invariant</span>
              <p className="text-slate-400 text-xs leading-relaxed">
                Compound database constraints enforce that duplicate idempotency keys return the original event without spawning phantom deliveries.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-rose-400 font-bold">3. Cascading Failure Defense</span>
              <p className="text-slate-400 text-xs leading-relaxed">
                Circuit breaker pattern isolates failing consumer endpoints with fast failure after 5 errors, preventing thread exhaustion.
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 text-center text-xs font-mono text-slate-500">
        <p>EventPulse Architecture &middot; Distributed Systems &amp; Webhook Reliability Platform</p>
      </footer>
    </div>
  );
}
