"use client";

import React, { useState } from "react";
import { ArrowRight, ShieldCheck, Zap, RefreshCw, AlertOctagon, CheckCircle2, Cpu } from "lucide-react";

export default function EventPipelineVisualizer() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: "1. Ingest & Idempotency",
      icon: Zap,
      color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
      description: "Events ingested via X-API-Key with DB-level idempotency key deduplication.",
      detail: "POST /api/v1/events checks uq_events_project_idempotency. Returns existing event immediately if key repeated without duplicating deliveries.",
    },
    {
      title: "2. Cryptographic Signing",
      icon: ShieldCheck,
      color: "text-indigo-400 border-indigo-500/40 bg-indigo-950/30",
      description: "HMAC-SHA256 signature generated with timestamp anti-replay verification.",
      detail: "Computes X-EventPulse-Signature: t={timestamp},v1={hmac_sha256} over (timestamp + '.' + payload) using endpoint's whsec_ secret.",
    },
    {
      title: "3. Queue & Rate Limiter",
      icon: Cpu,
      color: "text-purple-400 border-purple-500/40 bg-purple-950/30",
      description: "Distributed concurrency pool with per-endpoint token bucket rate limiting.",
      detail: "Protects recipient infrastructure. If endpoint capacity exceeded, reschedules delivery for the next available minute window.",
    },
    {
      title: "4. Outbound Delivery",
      icon: RefreshCw,
      color: "text-amber-400 border-amber-500/40 bg-amber-950/30",
      description: "Async HTTP dispatch with exponential backoff retries: min(3600, pow(2, n)*5).",
      detail: "Dispatches HTTP POST to consumer URL with 10s timeout. Audits every attempt with exact status, latency ms, request, and response bodies.",
    },
    {
      title: "5. Circuit Breaker & DLQ",
      icon: AlertOctagon,
      color: "text-rose-400 border-rose-500/40 bg-rose-950/30",
      description: "Auto trips to OPEN after 5 failures. Exhausted retries quarantined to DLQ.",
      detail: "Failed endpoints isolated to preserve queue throughput. Quarantined DLQ events can be diagnosed via AI and manually retried or discarded.",
    },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl p-6 lg:p-8 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Distributed Delivery Pipeline Architecture
          </h3>
          <p className="text-sm text-slate-400">Click any stage to inspect the technical flow</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          ENTERPRISE-GRADE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isSelected = activeStep === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 relative ${
                isSelected
                  ? `${s.color} ring-2 ring-cyan-400 shadow-glow`
                  : "border-slate-800 bg-surface/60 hover:border-slate-700 hover:bg-surface"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span className="text-xs font-mono text-slate-500">0{idx + 1}</span>
              </div>
              <h4 className="text-sm font-medium text-white mb-1">{s.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2">{s.description}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Step Deep Dive */}
      <div className="p-5 rounded-xl bg-surface-card border border-slate-700/60 font-mono text-xs text-slate-300">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
          <CheckCircle2 className="w-4 h-4" />
          {steps[activeStep].title.toUpperCase()} SPECIFICATION
        </div>
        <p className="leading-relaxed text-slate-300">{steps[activeStep].detail}</p>
      </div>
    </div>
  );
}
