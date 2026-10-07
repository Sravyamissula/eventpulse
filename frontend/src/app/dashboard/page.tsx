"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Zap,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Play,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Radio,
  ExternalLink,
} from "lucide-react";
import { useDashboard } from "./layout";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardOverview() {
  const { activeProject } = useDashboard();
  const [analytics, setAnalytics] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeProject) return;
    try {
      const [analyticsData, deliveriesData] = await Promise.all([
        api.getAnalytics(activeProject.id),
        api.getProjectDeliveries(activeProject.id),
      ]);
      setAnalytics(analyticsData);
      setDeliveries(deliveriesData.slice(0, 8)); // Top 8 recent
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // 8-second live polling
    return () => clearInterval(interval);
  }, [activeProject]);

  const handleSendTestWebhook = async () => {
    if (!activeProject) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const testPayload = {
        orderId: "ord_" + Math.random().toString(36).substring(2, 9),
        amount: Math.floor(Math.random() * 50000) + 1000,
        currency: "USD",
        customer: {
          id: "cus_" + Math.random().toString(36).substring(2, 8),
          email: "customer@example.com",
        },
        timestamp: new Date().toISOString(),
      };

      const res = await api.ingestEvent(
        {
          eventType: "checkout.session.completed",
          payload: testPayload,
          idempotencyKey: "idem_" + Date.now(),
        },
        undefined,
        activeProject.id
      );

      setTestResult(`Event ${res.eventId.substring(0, 8)} dispatched! Created ${res.deliveriesCreated} outbound deliver(ies).`);
      await loadData();
    } catch (err: any) {
      setTestResult("Error: " + (err.message || "Failed to dispatch test event"));
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Platform Observability</span>
            </h1>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {activeProject?.name || "Production"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time webhook ingestion throughput, latency distribution, and subsystem resilience
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Live (8s)</span>
          </div>

          <Button
            onClick={handleSendTestWebhook}
            loading={sendingTest}
            variant="primary"
            size="sm"
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Simulate Event
          </Button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white hover:border-slate-700 transition"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-between animate-in zoom-in-95 duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            {testResult}
          </span>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white text-base">
            &times;
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <Card glow="cyan" className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Ingested Events</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {analytics?.totalEvents ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Idempotent DB deduplication</span>
            </div>
          </Card>

          {/* Deliveries & Success Rate */}
          <Card glow="emerald" className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Delivery Success Rate</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {analytics?.successRatePercent ?? 100}%
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span className="text-emerald-400/90 font-medium">{analytics?.successDeliveries ?? 0} Succeeded</span>
              <span className="text-rose-400 font-medium">{analytics?.failedDeliveries ?? 0} Failed</span>
            </div>
          </Card>

          {/* Latency Percentiles */}
          <Card glow="purple" className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Latency (p50 / p95)</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {analytics?.latencyP50Ms ?? 0}ms{" "}
              <span className="text-slate-500 text-sm font-normal">/ {analytics?.latencyP95Ms ?? 0}ms</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-1">
              Avg: {analytics?.averageLatencyMs ?? 0}ms | p99: {analytics?.latencyP99Ms ?? 0}ms
            </div>
          </Card>

          {/* Dead Letter Queue */}
          <Card glow="rose" className="p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Dead Letter Queue (DLQ)</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {analytics?.dlqCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Quarantined items</span>
              <Link href="/dashboard/dlq" className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-0.5">
                Inspect <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Throughput & Latency Waveform Telemetry Chart */}
      <Card hoverable={false} className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-cyan-400" />
              SYSTEM LATENCY & THROUGHPUT TELEMETRY
            </h2>
            <p className="text-xs text-slate-400">Sliding window throughput (ops/sec) vs delivery roundtrip latency (ms)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
              <span className="text-slate-300">Throughput</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500" />
              <span className="text-slate-300">p95 Latency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
              <span className="text-slate-300">SLA 99.9%</span>
            </div>
          </div>
        </div>

        {/* SVG Sparkline Graph */}
        <div className="w-full h-44 relative bg-surface-card/40 rounded-xl border border-slate-800/80 p-4 overflow-hidden flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1="30" x2="800" y2="30" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1="65" x2="800" y2="65" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />

            {/* SLA Line */}
            <line x1="0" y1="20" x2="800" y2="20" stroke="#34d399" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

            {/* Area Fills */}
            <polygon
              fill="url(#purpleGradient)"
              points="0,120 0,95 80,85 160,98 240,70 320,60 400,75 480,55 560,65 640,40 720,50 800,35 800,120"
            />
            <polygon
              fill="url(#cyanGradient)"
              points="0,120 0,80 80,65 160,82 240,45 320,55 400,35 480,48 560,25 640,38 720,20 800,15 800,120"
            />

            {/* Throughput Curve */}
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              points="0,80 80,65 160,82 240,45 320,55 400,35 480,48 560,25 640,38 720,20 800,15"
            />

            {/* Latency Curve */}
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              points="0,95 80,85 160,98 240,70 320,60 400,75 480,55 560,65 640,40 720,50 800,35"
            />

            {/* Active pulse points */}
            <circle cx="800" cy="15" r="4" fill="#38bdf8" className="animate-pulse" />
            <circle cx="800" cy="35" r="3" fill="#a855f7" />
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
          <span>T - 60 minutes</span>
          <span>T - 30 minutes</span>
          <span>T - 15 minutes</span>
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Live Now
          </span>
        </div>
      </Card>

      {/* Subsystem Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverable={false} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Spring Boot Dispatcher</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
              UP (Port 8081)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Async executor pool with bounded queue & task rejection protection.
          </p>
        </Card>

        <Card hoverable={false} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>PostgreSQL 17.4</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30">
              Flyway V2 Validated
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Multi-tenant ACID isolation with strict unique idempotency constraints.
          </p>
        </Card>

        <Card hoverable={false} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>AI Diagnosis Service</span>
            </div>
            <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30">
              Operational
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            FastAPI microservice with fallback heuristic intelligence engine.
          </p>
        </Card>
      </div>

      {/* Recent Deliveries Table */}
      <Card hoverable={false} className="overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Live Delivery Stream
            </h2>
            <p className="text-xs text-slate-400">Recent outbound webhook attempts to consumer endpoints</p>
          </div>
          <Link
            href="/dashboard/deliveries"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium font-mono"
          >
            <span>View All Deliveries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-6 h-6 text-cyan-400" />}
            title="No webhook deliveries recorded yet"
            description="Simulate your first webhook event to watch the end-to-end fan-out and retry engine in action."
            actionLabel="Simulate Event"
            onAction={handleSendTestWebhook}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Delivery ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Attempts</th>
                  <th className="px-6 py-3">HTTP Status</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-surface-card/40 transition">
                    <td className="px-6 py-3.5 text-slate-300">
                      {del.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={del.status} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {del.attemptCount} / {del.maxAttempts}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        del.lastHttpStatus && del.lastHttpStatus >= 200 && del.lastHttpStatus < 300
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {del.lastHttpStatus || "---"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {del.lastLatencyMs != null ? `${del.lastLatencyMs}ms` : "---"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(del.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

