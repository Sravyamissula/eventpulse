"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Flame,
} from "lucide-react";
import { useDashboard } from "../layout";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function DeadLetterQueuePage() {
  const { activeProject } = useDashboard();
  const [dlqEvents, setDlqEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // AI Modal
  const [selectedDlq, setSelectedDlq] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchDlq = async () => {
    if (!activeProject) return;
    try {
      const list = await api.getDlqEvents(activeProject.id);
      setDlqEvents(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDlq();
  }, [activeProject]);

  const handleRetry = async (dlqId: string) => {
    if (!activeProject) return;
    try {
      await api.retryDlqEvent(activeProject.id, dlqId);
      setActionMessage("Event re-queued to active delivery workers with attempt count reset.");
      await fetchDlq();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Retry failed: " + err.message);
    }
  };

  const handleDiscard = async (dlqId: string) => {
    if (!activeProject) return;
    if (!confirm("Are you sure you want to discard this dead-letter item?")) return;
    try {
      await api.discardDlqEvent(activeProject.id, dlqId);
      setActionMessage("Dead-letter item marked as DISCARDED.");
      await fetchDlq();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Discard failed: " + err.message);
    }
  };

  const handleDiagnose = async (dlq: any) => {
    setSelectedDlq(dlq);
    setAiAnalysis(null);
    setLoadingAi(true);
    try {
      const res = await api.getAiAnalysis(activeProject!.id, dlq.deliveryId);
      setAiAnalysis(res);
    } catch (err: any) {
      alert("AI analysis error: " + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Dead Letter Queue (DLQ) Quarantine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quarantined webhooks whose retries were exhausted after exponential backoff
          </p>
        </div>

        <button
          onClick={fetchDlq}
          className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white transition self-start sm:self-auto"
          title="Refresh DLQ"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-in zoom-in-95 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* DLQ Summary Card */}
      <Card hoverable={false} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-950/20 via-surface-card to-surface-card border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Quarantine & Circuit Isolation Policy</h3>
            <p className="text-[11px] text-slate-400">
              When a receiver continuously fails across 5 attempts, webhooks are quarantined here to prevent downstream buffer bloat.
            </p>
          </div>
        </div>
      </Card>

      {/* DLQ Table */}
      <Card hoverable={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : dlqEvents.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
            title="Dead Letter Queue is clear"
            description="All outbound deliveries are currently fulfilling their SLAs without retry exhaustion."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">DLQ Item ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Exhaustion Reason</th>
                  <th className="px-6 py-3">Quarantined At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dlqEvents.map((dlq) => (
                  <tr key={dlq.id} className="hover:bg-surface-card/40 transition">
                    <td className="px-6 py-3.5 font-mono text-slate-300">
                      {dlq.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={dlq.status} />
                    </td>
                    <td className="px-6 py-3.5 text-rose-300 max-w-md truncate">
                      {dlq.reason}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(dlq.failedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3.5 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDiagnose(dlq)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition text-xs font-mono shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        <span>AI Root-Cause</span>
                      </button>

                      {dlq.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleRetry(dlq.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition text-xs font-mono"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                          </button>
                          <button
                            onClick={() => handleDiscard(dlq.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                            title="Discard DLQ item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* AI Root Cause Modal */}
      <Modal
        isOpen={!!selectedDlq}
        onClose={() => setSelectedDlq(null)}
        title="AI Failure Root-Cause Analysis"
        subtitle="Automated diagnosis powered by FastAPI intelligence engine"
        icon={<Sparkles className="w-5 h-5 text-purple-400" />}
        maxWidth="lg"
      >
        {loadingAi ? (
          <div className="py-12 text-center text-xs text-purple-300 font-mono space-y-3">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
            <p>Evaluating error patterns, HTTP logs, and destination server signatures...</p>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                CATEGORY: {aiAnalysis.rootCauseCategory}
              </span>
              <span className="text-slate-400 text-[11px]">
                Confidence: {Math.round(aiAnalysis.confidenceScore * 100)}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-slate-800 text-slate-300 leading-relaxed">
              {aiAnalysis.explanation}
            </div>

            {aiAnalysis.suggestedRemediation && (
              <div className="space-y-1.5">
                <span className="text-purple-300 text-[11px] uppercase font-bold">Actionable Remediation:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  {aiAnalysis.suggestedRemediation.map((rem: string, idx: number) => (
                    <li key={idx}>{rem}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">
                Action: <strong className="text-cyan-400">{aiAnalysis.recommendedAction}</strong>
              </span>
              <Button
                onClick={() => {
                  handleRetry(selectedDlq.id);
                  setSelectedDlq(null);
                }}
                variant="primary"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Apply & Retry Delivery
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

