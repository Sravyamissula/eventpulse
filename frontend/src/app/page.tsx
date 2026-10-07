"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertOctagon,
  Cpu,
  CheckCircle2,
  Server,
  Sparkles,
  Lock,
  Layers,
  Terminal,
  Play,
  RotateCcw,
  Check,
  Github,
  ChevronRight,
  Database,
  Radio,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import CinematicIntro from "@/components/CinematicIntro";
import CommandPalette from "@/components/ui/CommandPalette";

// Subtle 3D particle and light trail depth canvas
const HeroCanvas3D = dynamic(() => import("@/components/HeroCanvas3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#03060c]" />,
});

export default function LandingPage() {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Scroll section states
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [idempotencyStep, setIdempotencyStep] = useState<number>(0);
  const [retryStep, setRetryStep] = useState<number>(0);
  const [circuitState, setCircuitState] = useState<"CLOSED" | "OPEN" | "HALF_OPEN">("CLOSED");
  const [circuitFailCount, setCircuitFailCount] = useState<number>(0);
  const [aiAnalysisActive, setAiAnalysisActive] = useState<boolean>(false);
  const [architectureLayer, setArchitectureLayer] = useState<string>("backend");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Automatic gentle progression for the event pipeline demo
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % 5);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Circuit breaker simulation toggle
  const triggerCircuitFailure = () => {
    const nextFails = circuitFailCount + 1;
    setCircuitFailCount(nextFails);
    if (nextFails >= 5) {
      setCircuitState("OPEN");
    }
  };

  const resetCircuit = () => {
    setCircuitFailCount(0);
    setCircuitState("CLOSED");
  };

  const advanceCircuitToHalfOpen = () => {
    setCircuitState("HALF_OPEN");
  };

  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 overflow-x-hidden">
      {/* 1. Cinematic Wordmark Construction Intro */}
      <CinematicIntro onComplete={() => setIntroCompleted(true)} />

      {/* 2. Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSimulateEvent={() => setPipelineStep(0)}
      />

      {/* 3. Sticky Glass Header */}
      <header
        className={`h-20 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#03060c]/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-glow group-hover:scale-105 transition">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              Event<span className="text-cyan-400">Pulse</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SaaS
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
            <a href="#event-flow" className="hover:text-cyan-400 transition">Event Flow</a>
            <a href="#idempotency" className="hover:text-cyan-400 transition">Idempotency</a>
            <a href="#retries" className="hover:text-cyan-400 transition">Retries</a>
            <a href="#circuit-breaker" className="hover:text-cyan-400 transition">Circuit Breaker</a>
            <a href="#ai-intelligence" className="hover:text-cyan-400 transition">AI Diagnosis</a>
            <a href="#architecture" className="hover:text-cyan-400 transition">Architecture</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-card border border-slate-800 text-xs font-mono text-slate-400 hover:border-cyan-500/40 hover:text-white transition"
          >
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-slate-700 text-[10px]">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-glow transition active:scale-95"
          >
            Launch Dashboard
          </Link>
        </div>
      </header>

      {/* 4. Main Story Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-16 space-y-36">
        {/* HERO SECTION */}
        <section className="relative min-h-[580px] flex flex-col justify-center items-center text-center space-y-8 pt-8">
          {/* Subtle 3D Particle & Trail Canvas Layer */}
          <HeroCanvas3D />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-400 shadow-glow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>POSTGRESQL 17.4 MULTI-TENANT ENGINE &middot; WORKER POOL ONLINE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] select-none">
              EVENT INFRASTRUCTURE<br />
              THAT DOESN&apos;T DISAPPEAR<br />
              <span className="gradient-text-primary">INTO THE VOID.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              An AI-powered distributed webhook delivery and observability platform built for
              reliable event delivery, intelligent retries, and real-time failure analysis.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold transition shadow-glow active:scale-95"
              >
                <span>OPEN DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#architecture"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-surface-card hover:bg-slate-800 text-slate-300 hover:text-white font-medium border border-slate-700/80 transition"
              >
                <span>EXPLORE ARCHITECTURE</span>
              </a>
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 1: EVENT FLOW JOURNEY */}
        <section id="event-flow" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
              Scroll Story &bull; Stage 1
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Watch every event move.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              From ingestion through database idempotency, cryptographic signing, worker execution, and confirmed delivery.
            </p>
          </div>

          <div className="glass-panel p-6 lg:p-10 rounded-3xl border border-slate-800 space-y-8 relative overflow-hidden">
            {/* Visual Rail with Moving Event Pulse */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs relative">
              {[
                { title: "1. INGEST", subtitle: "POST /api/v1/events", desc: "API key verified" },
                { title: "2. QUEUE & IDEM", subtitle: "PostgreSQL Strict", desc: "Compound unique check" },
                { title: "3. HMAC SIGN", subtitle: "HMAC-SHA256", desc: "Header: X-EventPulse-Signature" },
                { title: "4. WORKER DISPATCH", subtitle: "Thread Pool", desc: "Token-bucket rate check" },
                { title: "5. DELIVERED", subtitle: "200 OK Response", desc: "Latency 32ms recorded" },
              ].map((stage, idx) => {
                const isCurrent = pipelineStep === idx;
                const isPassed = pipelineStep >= idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setPipelineStep(idx)}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      isCurrent
                        ? "bg-cyan-500/15 border-cyan-400 text-white shadow-glow"
                        : isPassed
                        ? "bg-surface-card/60 border-slate-700 text-slate-200"
                        : "bg-surface-card/20 border-slate-800/80 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{stage.title}</span>
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-cyan-400 animate-ping" : isPassed ? "bg-emerald-400" : "bg-slate-700"}`} />
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-200">{stage.subtitle}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{stage.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Current Event Packet Telemetry Box */}
            <div className="p-5 rounded-2xl bg-[#010409] border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 border-b border-slate-800">
                <span className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  EVENT TELEMETRY STREAM
                </span>
                <span>STEP {pipelineStep + 1} OF 5</span>
              </div>
              <div className="text-slate-300 space-y-1">
                {pipelineStep === 0 && (
                  <p className="text-cyan-300">
                    &gt; Client invoked <code className="text-white">POST /api/v1/events</code> with <code className="text-white">X-API-Key: ep_live_...</code>. Body validated against JSON schema.
                  </p>
                )}
                {pipelineStep === 1 && (
                  <p className="text-indigo-300">
                    &gt; Idempotency query checked constraint <code className="text-white">UNIQUE (project_id, idempotency_key)</code>. Record persisted cleanly to PostgreSQL.
                  </p>
                )}
                {pipelineStep === 2 && (
                  <p className="text-purple-300">
                    &gt; Timestamp generated: <code className="text-white">t=1791380000</code>. Computed <code className="text-white">HmacSHA256(timestamp + &quot;.&quot; + payload, secret)</code>.
                  </p>
                )}
                {pipelineStep === 3 && (
                  <p className="text-amber-300">
                    &gt; Rate-limiter checked (60 req/min limit). Worker thread pool dispatched HTTP POST to receiver endpoint.
                  </p>
                )}
                {pipelineStep === 4 && (
                  <p className="text-emerald-300">
                    &gt; Target receiver replied <code className="text-white">200 OK</code> in 32ms. Attempt recorded in <code className="text-white">delivery_attempts</code>. Status set to <code className="text-emerald-400 font-bold">SUCCESS</code>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 2: EXACTLY-ONCE IDEMPOTENCY CONVERGENCE */}
        <section id="idempotency" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
              Scroll Story &bull; Stage 2
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Database idempotency.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              When network retries duplicate client submissions, EventPulse converges them into exactly one event.
            </p>
          </div>

          <div className="glass-panel p-6 lg:p-10 rounded-3xl border border-slate-800 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Request 1 Box */}
              <div className="p-6 rounded-2xl bg-surface-card border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">REQUEST #1 (INITIAL)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    201 CREATED
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1 bg-surface p-3 rounded-xl border border-slate-800">
                  <p><span className="text-slate-500">Idempotency-Key:</span> <span className="text-emerald-300 font-bold">pay_capture_98a7</span></p>
                  <p><span className="text-slate-500">Event Type:</span> payment.captured</p>
                  <p><span className="text-slate-500">Payload:</span> &#123; amount: 4999, currency: &quot;INR&quot; &#125;</p>
                  <p><span className="text-slate-500">Response:</span> <code className="text-emerald-400">&quot;idempotent&quot;: false</code></p>
                </div>
                <p className="text-xs text-slate-400">
                  Persisted to database partition. 1 outbound webhook delivery scheduled.
                </p>
              </div>

              {/* Request 2 Box */}
              <div className="p-6 rounded-2xl bg-surface-card border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold">REQUEST #2 (NETWORK RETRY)</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                    DUPLICATE DETECTED
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1 bg-surface p-3 rounded-xl border border-slate-800">
                  <p><span className="text-slate-500">Idempotency-Key:</span> <span className="text-cyan-300 font-bold">pay_capture_98a7</span></p>
                  <p><span className="text-slate-500">Event Type:</span> payment.captured</p>
                  <p><span className="text-slate-500">Payload:</span> &#123; amount: 4999, currency: &quot;INR&quot; &#125;</p>
                  <p><span className="text-slate-500">Response:</span> <code className="text-cyan-400 font-bold">&quot;idempotent&quot;: true</code></p>
                </div>
                <p className="text-xs text-slate-400">
                  Uniqueness constraint caught duplicate. Zero duplicate deliveries triggered.
                </p>
              </div>
            </div>

            {/* Convergence Output Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-slate-800 flex items-center justify-center gap-3 text-xs font-mono text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Result: Both client requests safely converge into <strong>1 single logical event</strong> and <strong>1 webhook delivery</strong>.</span>
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 3: PHYSICAL BACK-AND-FORTH RETRIES */}
        <section id="retries" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-amber-400 tracking-wider">
              Scroll Story &bull; Stage 3
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Adaptive exponential backoff.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              When receivers experience transient 503 errors, EventPulse bounces requests back into scheduled queues until recovery.
            </p>
          </div>

          <div className="glass-panel p-6 lg:p-10 rounded-3xl border border-slate-800 space-y-6">
            <div className="space-y-4">
              {[
                { attempt: 1, status: 503, text: "HTTP 503: Service Unavailable", delay: "Initial attempt fails. Backoff delay: 10s scheduled.", color: "text-rose-400", border: "border-rose-500/40" },
                { attempt: 2, status: 503, text: "HTTP 503: Upstream Pod Restarting", delay: "Retry #2 fails. Exponential delay: 20s scheduled.", color: "text-rose-400", border: "border-rose-500/40" },
                { attempt: 3, status: 200, text: "HTTP 200 OK: Delivered", delay: "Destination server restored! Delivery finalized as SUCCESS.", color: "text-emerald-400", border: "border-emerald-500/40" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl bg-surface-card border ${item.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-surface border border-slate-800 flex items-center justify-center font-bold text-slate-300">
                      #{item.attempt}
                    </span>
                    <div>
                      <div className={`font-bold ${item.color}`}>{item.text}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{item.delay}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Formula: min(3600, 2^n * 5s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 4: CIRCUIT BREAKER STATE MACHINE */}
        <section id="circuit-breaker" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-rose-400 tracking-wider">
              Scroll Story &bull; Stage 4
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Circuit breaker isolation.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Downstream crash cascades are isolated before they choke the core worker queue.
            </p>
          </div>

          <div className="glass-panel p-6 lg:p-10 rounded-3xl border border-slate-800 space-y-8">
            {/* Visual State Machine Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center">
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  circuitState === "CLOSED"
                    ? "bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-glow"
                    : "bg-surface-card border-slate-800 text-slate-500 opacity-60"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-white">CLOSED</h3>
                <p className="text-[11px] text-slate-400 mt-2">Normal operations. Deliveries dispatched immediately.</p>
              </div>

              <div
                className={`p-6 rounded-2xl border transition-all ${
                  circuitState === "OPEN"
                    ? "bg-rose-950/40 border-rose-400 text-rose-300 shadow-glow"
                    : "bg-surface-card border-slate-800 text-slate-500 opacity-60"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-rose-400 mx-auto mb-2 animate-ping" />
                <h3 className="font-bold text-sm text-white">OPEN</h3>
                <p className="text-[11px] text-slate-400 mt-2">Threshold (5) reached. Endpoint isolated to protect worker queue.</p>
              </div>

              <div
                className={`p-6 rounded-2xl border transition-all ${
                  circuitState === "HALF_OPEN"
                    ? "bg-amber-950/40 border-amber-400 text-amber-300 shadow-glow"
                    : "bg-surface-card border-slate-800 text-slate-500 opacity-60"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-amber-400 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-white">HALF_OPEN</h3>
                <p className="text-[11px] text-slate-400 mt-2">Cooldown (60s) elapsed. Single probe delivery sent to test recovery.</p>
              </div>
            </div>

            {/* Interactive State Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                onClick={triggerCircuitFailure}
                className="px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50 transition flex items-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Simulate Failure ({circuitFailCount}/5)</span>
              </button>

              <button
                onClick={advanceCircuitToHalfOpen}
                className="px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 transition flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Advance to HALF_OPEN Probe</span>
              </button>

              <button
                onClick={resetCircuit}
                className="px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Reset to CLOSED</span>
              </button>
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 5: AI INCIDENT INTELLIGENCE */}
        <section id="ai-intelligence" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-purple-400 tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scroll Story &bull; Stage 5</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Failures become explanations.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              When an endpoint fails, EventPulse doesn&apos;t just log error codes. The AI intelligence engine analyzes HTTP status, response body snippets, and network traces to categorize root causes instantly.
            </p>
          </div>

          <div className="glass-panel p-6 lg:p-10 rounded-3xl border border-purple-500/30 shadow-glow-purple space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              {/* Left: Raw Error Code */}
              <div className="p-6 rounded-2xl bg-surface-card border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase">
                  <span>Raw Delivery Attempt Log</span>
                  <span className="text-rose-400 font-bold">503 ERROR</span>
                </div>
                <div className="p-4 rounded-xl bg-surface border border-slate-800 text-rose-300 text-xs overflow-x-auto">
                  &lt;html&gt;&lt;body&gt;upstream connect error or disconnect/reset before headers. reset reason: connection failure&lt;/body&gt;&lt;/html&gt;
                </div>
                <p className="text-[11px] text-slate-400">
                  HTTP 503 &bull; Latency: 1,420ms &bull; Attempt 3 of 5
                </p>
              </div>

              {/* Right: AI Synthesis */}
              <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI INCIDENT ANALYSIS
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    94% Confidence
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Root Cause:</span>
                    <p className="text-slate-200 font-semibold">Receiver server unavailable (Pod restarting or deployment in progress)</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Recommendation:</span>
                    <p className="text-purple-300">Verify receiver health and continue safe exponential retry policy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 6: OBSERVABILITY METRICS EMERGING FROM DEPTH */}
        <section id="observability" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
              Real-Time Telemetry &bull; Demo Simulation
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Metrics with depth.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Live observability of throughput, latency percentiles, and circuit health across tenant partitions.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-8 rounded-3xl text-center space-y-2 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono">99.97%</div>
              <div className="text-xs font-mono text-slate-300 font-bold uppercase">Delivery Success</div>
              <div className="text-[10px] text-slate-500 font-mono">(Simulation cluster)</div>
            </div>

            <div className="glass-card p-8 rounded-3xl text-center space-y-2 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-extrabold text-cyan-400 font-mono">14ms</div>
              <div className="text-xs font-mono text-slate-300 font-bold uppercase">P95 Latency</div>
              <div className="text-[10px] text-slate-500 font-mono">(Simulation cluster)</div>
            </div>

            <div className="glass-card p-8 rounded-3xl text-center space-y-2 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-extrabold text-purple-400 font-mono">1,284</div>
              <div className="text-xs font-mono text-slate-300 font-bold uppercase">Events / Min</div>
              <div className="text-[10px] text-slate-500 font-mono">(Simulation cluster)</div>
            </div>

            <div className="glass-card p-8 rounded-3xl text-center space-y-2 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono">23</div>
              <div className="text-xs font-mono text-slate-300 font-bold uppercase">Active Endpoints</div>
              <div className="text-[10px] text-slate-500 font-mono">(Simulation cluster)</div>
            </div>
          </div>
        </section>

        {/* SCROLL SECTION 7: INTERACTIVE ARCHITECTURE MATRIX */}
        <section id="architecture" className="space-y-10 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
              System Design &bull; Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built like infrastructure.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A distributed multi-tenant platform architected with strict transaction isolation and horizontal scalability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {[
              { id: "frontend", title: "Next.js 14 Console", tech: "React 18 & Three.js", desc: "Dark-themed developer console with 3D canvas and command palette." },
              { id: "backend", title: "Spring Boot 3.4", tech: "Java 21 Virtual Threads", desc: "Stateless security, JJWT bearer auth, and thread-pool execution." },
              { id: "database", title: "PostgreSQL 17.4", tech: "Flyway V1 & V2", desc: "Compound uniqueness guarantees and Hibernate schema validation." },
              { id: "ai", title: "AI Microservice", tech: "FastAPI & Gemini", desc: "Microservice with heuristic fallback for zero-downtime webhook delivery." },
            ].map((layer) => (
              <div
                key={layer.id}
                onClick={() => setArchitectureLayer(layer.id)}
                className={`p-6 rounded-2xl glass-card space-y-2 border cursor-pointer transition ${
                  architectureLayer === layer.id ? "border-cyan-400 bg-cyan-950/20 shadow-glow" : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="text-cyan-400 text-[10px] uppercase font-bold">{layer.title}</div>
                <h3 className="text-sm font-bold text-white">{layer.tech}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{layer.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="text-center py-12 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Build your event infrastructure.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Experience reliable webhook delivery, real-time observability, and AI root-cause diagnosis today.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold font-mono text-xs shadow-glow transition active:scale-95"
            >
              <span>Create Organization Space</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#020408] py-10 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} EventPulse Platform.</span>
          <span>Enterprise Distributed Systems Architecture.</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
          <Link href="/dashboard" className="hover:text-cyan-400">Dashboard</Link>
          <a href="#architecture" className="hover:text-cyan-400">Architecture</a>
          <a href="#event-flow" className="hover:text-cyan-400">Pipeline</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 flex items-center gap-1">
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
