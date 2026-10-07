"use client";

import React, { useEffect, useState } from "react";
import {
  Send,
  RefreshCw,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  FileCode,
  Layers,
} from "lucide-react";
import { useDashboard } from "../layout";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function DeliveriesPage() {
  const { activeProject } = useDashboard();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Selected delivery & attempt waterfall
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchDeliveries = async () => {
    if (!activeProject) return;
    try {
      const list = await api.getProjectDeliveries(activeProject.id);
      setDeliveries(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [activeProject]);

  const handleSelectDelivery = async (delivery: any) => {
    setSelectedDelivery(delivery);
    setIsDrawerOpen(true);
    setAiAnalysis(null);
    setLoadingAttempts(true);
    try {
      const atts = await api.getDeliveryAttempts(activeProject!.id, delivery.id);
      setAttempts(atts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleRunAiAnalysis = async (deliveryId: string) => {
    if (!activeProject) return;
    setLoadingAi(true);
    try {
      const res = await api.getAiAnalysis(activeProject.id, deliveryId);
      setAiAnalysis(res);
    } catch (err: any) {
      alert("AI analysis error: " + (err.message || "Failed to analyze"));
    } finally {
      setLoadingAi(false);
    }
  };

  const filtered = deliveries.filter((d) => {
    if (filter === "ALL") return true;
    return d.status === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            Outbound Deliveries & Retries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of HTTP webhook dispatches, exponential backoff, and circuit states
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {["ALL", "SUCCESS", "RETRYING", "FAILED"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === f
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDeliveries}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white transition"
            title="Refresh deliveries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <Card hoverable={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Send className="w-6 h-6 text-cyan-400" />}
            title="No deliveries found"
            description={
              filter === "ALL"
                ? "No webhook deliveries have been triggered yet for this project."
                : `No deliveries with status "${filter}". Try selecting a different filter.`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Delivery ID</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Attempt</th>
                  <th className="px-5 py-3">HTTP Code</th>
                  <th className="px-5 py-3">Latency</th>
                  <th className="px-5 py-3">Dispatched At</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => handleSelectDelivery(d)}
                    className="cursor-pointer hover:bg-surface-card/60 transition group"
                  >
                    <td className="px-5 py-3.5 text-slate-300 font-mono group-hover:text-cyan-400 transition">
                      {d.id.substring(0, 8)}...
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {d.attemptCount} / {d.maxAttempts}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          d.lastHttpStatus && d.lastHttpStatus >= 200 && d.lastHttpStatus < 300
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                            : d.lastHttpStatus && d.lastHttpStatus >= 500
                            ? "bg-rose-950/40 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {d.lastHttpStatus || "---"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {d.lastLatencyMs != null ? `${d.lastLatencyMs}ms` : "---"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(d.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition flex items-center justify-end gap-1 font-mono text-[11px]">
                        Inspect Waterfall <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Attempt Waterfall & AI Diagnosis Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Delivery Waterfall & Security Headers"
        subtitle={`Delivery ID: ${selectedDelivery?.id || ""}`}
        icon={<Layers className="w-5 h-5 text-cyan-400" />}
      >
        {selectedDelivery && (
          <div className="space-y-6 text-xs font-mono">
            {/* Meta Summary Card */}
            <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Delivery State:</span>
                <StatusBadge status={selectedDelivery.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Execution Progress:</span>
                <span className="text-white font-semibold">
                  {selectedDelivery.attemptCount} of {selectedDelivery.maxAttempts} attempts used
                </span>
              </div>
              {selectedDelivery.lastError && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase block">Last Recorded Error</span>
                  <p className="text-rose-400 text-[11px] break-words mt-1 leading-relaxed">
                    {selectedDelivery.lastError}
                  </p>
                </div>
              )}
            </div>

            {/* Outbound Security Headers */}
            <div className="p-4 rounded-xl bg-surface-card border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Dispatched Request Headers</span>
              </div>
              <div className="text-[11px] space-y-1 text-slate-300 pt-1 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500">Content-Type:</span> application/json
                </div>
                <div>
                  <span className="text-slate-500">X-EventPulse-Delivery-ID:</span> {selectedDelivery.id}
                </div>
                <div>
                  <span className="text-slate-500">X-EventPulse-Signature:</span>{" "}
                  <span className="text-cyan-400">sha256=••••••••••••••••••••••••••••••••</span>
                </div>
                <div>
                  <span className="text-slate-500">User-Agent:</span> EventPulse-Engine/1.0
                </div>
              </div>
            </div>

            {/* AI Diagnostics CTA */}
            {(selectedDelivery.status === "FAILED" || selectedDelivery.status === "RETRYING") && (
              <div className="space-y-3">
                <button
                  onClick={() => handleRunAiAnalysis(selectedDelivery.id)}
                  disabled={loadingAi}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-purple transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{loadingAi ? "Analyzing Logs with AI Engine..." : "Run AI Root-Cause Analysis"}</span>
                </button>

                {/* AI Analysis Result Card */}
                {aiAnalysis && (
                  <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs space-y-3 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-purple-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        {aiAnalysis.rootCauseCategory}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {Math.round(aiAnalysis.confidenceScore * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysis.explanation}</p>
                    {aiAnalysis.suggestedRemediation && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono text-purple-300 uppercase font-semibold">
                          Recommended Remediation:
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                          {aiAnalysis.suggestedRemediation.map((rem: string, idx: number) => (
                            <li key={idx}>{rem}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Attempts Waterfall Timeline */}
            <div className="space-y-3">
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block">
                Attempts Timeline & Latency
              </span>

              {loadingAttempts ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading audit attempts...</div>
              ) : attempts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No attempts logged yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {attempts.map((att, idx) => {
                    const isSuccess = att.status === "SUCCESS";
                    return (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-xl bg-surface-card border border-slate-800/80 text-xs font-mono space-y-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">
                            {isSuccess ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            Attempt #{att.attemptNumber}
                          </span>
                          <StatusBadge status={att.status} />
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
                          <span>
                            HTTP Status:{" "}
                            <strong className={isSuccess ? "text-emerald-400" : "text-rose-400"}>
                              {att.httpStatus || "Timeout/Connection Refused"}
                            </strong>
                          </span>
                          <span>{att.latencyMs != null ? `${att.latencyMs}ms` : ""}</span>
                        </div>

                        {att.errorMessage && (
                          <div className="p-2 rounded bg-rose-950/30 border border-rose-500/20 text-rose-300 text-[11px] break-words">
                            {att.errorMessage}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500">
                          {new Date(att.attemptedAt || att.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

