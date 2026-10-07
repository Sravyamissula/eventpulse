"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";
import { useDashboard } from "../layout";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function AiInsightsPage() {
  const { activeProject } = useDashboard();
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await api.getAiIncidentSummary(activeProject.id);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [activeProject]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Incident Intelligence & Anomaly Synthesis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated root-cause clustering, HTTP error signature classification, and circuit guidance
          </p>
        </div>

        <button
          onClick={fetchSummary}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white text-xs font-mono transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synthesize Incidents</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Main Incident Card */}
          <Card
            glow={
              summary.severity === "CRITICAL"
                ? "rose"
                : summary.severity === "HIGH"
                ? "purple"
                : "emerald"
            }
            className="p-6 lg:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit ${
                    summary.severity === "CRITICAL"
                      ? "bg-rose-950/40 text-rose-400 border-rose-500/30 shadow-glow-rose"
                      : summary.severity === "HIGH"
                      ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                      : "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      summary.severity === "CRITICAL"
                        ? "bg-rose-400 animate-ping"
                        : summary.severity === "HIGH"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  SEVERITY: {summary.severity}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-2.5">
                  {summary.incidentTitle}
                </h2>
              </div>

              <div className="text-xs font-mono text-purple-300 flex items-center gap-2 self-start sm:self-auto bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/30">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>AI SYNTHESIS AGENT ACTIVE</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-surface-card/60 p-4 rounded-xl border border-slate-800">
              {summary.impactSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Pattern */}
              <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 font-mono">
                  <Activity className="w-4 h-4" />
                  DETECTED FAILURE CLUSTER
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {summary.commonPattern}
                </p>
              </div>

              {/* Circuit Breaker Advice */}
              <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  CIRCUIT BREAKER ISOLATION ADVICE
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {summary.circuitBreakerAdvice}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {summary.recommendations && summary.recommendations.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 font-mono">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  ACTIONABLE REMEDIATION ROADMAP
                </h3>
                <div className="space-y-2 font-mono">
                  {summary.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-card border border-slate-800 text-xs text-slate-300 hover:border-purple-500/30 transition"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          title="No Anomaly Clusters Detected"
          description="The AI synthesis agent scanned recent webhook delivery logs and found zero recurring failure patterns. All endpoints are currently within nominal error thresholds."
        />
      )}
    </div>
  );
}

