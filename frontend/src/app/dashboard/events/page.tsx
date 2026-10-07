"use client";

import React, { useEffect, useState } from "react";
import {
  Zap,
  Plus,
  CheckCircle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Code2,
  Sparkles,
  Repeat,
  ArrowRight,
} from "lucide-react";
import { useDashboard } from "../layout";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Drawer from "@/components/ui/Drawer";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const PRESET_TEMPLATES = [
  {
    name: "Stripe Checkout",
    type: "checkout.session.completed",
    payload: {
      id: "cs_test_a1b2c3d4e5",
      object: "checkout.session",
      amount_total: 12450,
      currency: "usd",
      customer: {
        id: "cus_N9s8d7f6g5",
        email: "alex.developer@example.com",
      },
      payment_status: "paid",
    },
  },
  {
    name: "GitHub Push",
    type: "push",
    payload: {
      ref: "refs/heads/main",
      repository: "eventpulse/core-gateway",
      pusher: { name: "lead-dev" },
      commits: [
        { id: "7a8b9c0", message: "feat: add sliding window token bucket rate limiter" },
      ],
    },
  },
  {
    name: "Shopify Order",
    type: "orders/create",
    payload: {
      order_id: 884729103,
      line_items: [{ sku: "DEV-HOODIE-M", quantity: 1, price: 65.0 }],
      financial_status: "authorized",
    },
  },
];

export default function EventsPage() {
  const { activeProject } = useDashboard();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Ingestion form modal state
  const [showModal, setShowModal] = useState(false);
  const [eventType, setEventType] = useState("checkout.session.completed");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(PRESET_TEMPLATES[0].payload, null, 2)
  );
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingIdem, setResendingIdem] = useState(false);
  const [idemResult, setIdemResult] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!activeProject) return;
    try {
      const list = await api.getEvents(activeProject.id);
      setEvents(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeProject]);

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setEventType(preset.type);
    setPayloadText(JSON.stringify(preset.payload, null, 2));
    setIdempotencyKey("idem_" + Date.now().toString(36));
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setIngesting(true);
    setIngestSuccess(null);

    try {
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch {
        alert("Payload must be valid JSON");
        setIngesting(false);
        return;
      }

      const res = await api.ingestEvent(
        {
          eventType,
          payload: parsedPayload,
          idempotencyKey: idempotencyKey.trim() || undefined,
        },
        undefined,
        activeProject.id
      );

      setIngestSuccess(
        `Event accepted (ID: ${res.eventId.substring(0, 8)}...). Dispatched to ${
          res.deliveriesCreated
        } endpoint(s).`
      );
      await fetchEvents();
      setTimeout(() => {
        setShowModal(false);
        setIngestSuccess(null);
      }, 1400);
    } catch (err: any) {
      alert("Failed to ingest event: " + (err.message || "Unknown error"));
    } finally {
      setIngesting(false);
    }
  };

  const handleOpenDrawer = (ev: any) => {
    setSelectedEvent(ev);
    setIsDrawerOpen(true);
    setIdemResult(null);
  };

  const handleTestIdempotencyResend = async () => {
    if (!activeProject || !selectedEvent || !selectedEvent.idempotencyKey) return;
    setResendingIdem(true);
    setIdemResult(null);

    try {
      const parsed = JSON.parse(selectedEvent.payload);
      const res = await api.ingestEvent(
        {
          eventType: selectedEvent.eventType,
          payload: parsed,
          idempotencyKey: selectedEvent.idempotencyKey,
        },
        undefined,
        activeProject.id
      );

      if (res.eventId === selectedEvent.id) {
        setIdemResult(
          `Idempotency verified! Returned existing event ${res.eventId.substring(
            0,
            8
          )}... (0 duplicate deliveries generated).`
        );
      } else {
        setIdemResult(`Received event ${res.eventId.substring(0, 8)}`);
      }
    } catch (err: any) {
      setIdemResult("Resend response: " + (err.message || "Request completed"));
    } finally {
      setResendingIdem(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Event Stream & Idempotency Store
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of ingested webhook events guaranteed by PostgreSQL multi-tenant constraints
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Ingest Event
          </Button>
          <button
            onClick={fetchEvents}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white transition"
            title="Refresh stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <Card hoverable={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Zap className="w-6 h-6 text-cyan-400" />}
            title="No events ingested yet"
            description="Trigger your first webhook event using one of our production templates (Stripe, GitHub, Shopify)."
            actionLabel="Ingest First Event"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Event Type</th>
                  <th className="px-5 py-3">Idempotency Key</th>
                  <th className="px-5 py-3">Event ID</th>
                  <th className="px-5 py-3">Payload Size</th>
                  <th className="px-5 py-3">Ingested At</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => handleOpenDrawer(ev)}
                    className="cursor-pointer hover:bg-surface-card/60 transition group"
                  >
                    <td className="px-5 py-3.5 font-semibold text-white group-hover:text-cyan-400 transition">
                      {ev.eventType}
                    </td>
                    <td className="px-5 py-3.5">
                      {ev.idempotencyKey ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 text-[11px]">
                          {ev.idempotencyKey}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">none</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {ev.id.substring(0, 8)}...
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {Math.round(ev.payload.length)} bytes
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(ev.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition flex items-center justify-end gap-1 font-mono text-[11px]">
                        Inspect <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Selected Event Payload Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Event Payload & Idempotency Inspector"
        subtitle={selectedEvent?.eventType || "Event Details"}
        icon={<Code2 className="w-5 h-5 text-cyan-400" />}
      >
        {selectedEvent && (
          <div className="space-y-5 text-xs font-mono">
            {/* Meta details */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-card border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Event ID</span>
                <span className="text-white font-semibold">{selectedEvent.id}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Created At</span>
                <span className="text-slate-300">{new Date(selectedEvent.createdAt).toLocaleString()}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Idempotency Key</span>
                <span className="text-cyan-400">{selectedEvent.idempotencyKey || "N/A (No idempotency key specified)"}</span>
              </div>
            </div>

            {/* Test Idempotency Resend Action */}
            {selectedEvent.idempotencyKey && (
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>PostgreSQL Idempotency Verification</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Dispatch another event using this exact idempotency key to test deduplication.
                </p>
                <Button
                  onClick={handleTestIdempotencyResend}
                  loading={resendingIdem}
                  size="sm"
                  variant="secondary"
                  icon={<Repeat className="w-3.5 h-3.5" />}
                >
                  Resend With Same Idempotency Key
                </Button>

                {idemResult && (
                  <div className="p-2.5 rounded-lg bg-surface-card border border-cyan-500/40 text-[11px] text-cyan-300">
                    {idemResult}
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase text-[10px]">Formatted Payload</span>
                <button
                  onClick={() => copyToClipboard(selectedEvent.payload)}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-surface-card border border-slate-800 text-slate-200 text-xs overflow-x-auto max-h-80 leading-relaxed font-mono">
                {JSON.stringify(JSON.parse(selectedEvent.payload), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>

      {/* Ingestion Modal with Presets */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ingest New Webhook Event"
        subtitle="Trigger fan-out delivery across active project endpoints"
        icon={<Zap className="w-5 h-5 text-cyan-400" />}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase">
              Select Preset Template:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleApplyPreset(tpl)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
                    eventType === tpl.type
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow"
                      : "bg-surface-card border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {ingestSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{ingestSuccess}</span>
            </div>
          )}

          <form onSubmit={handleIngest} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Event Type</label>
              <input
                type="text"
                required
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="e.g. checkout.session.completed"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300">Idempotency Key (Optional)</label>
                <button
                  type="button"
                  onClick={() => setIdempotencyKey("idem_" + Date.now().toString(36))}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Generate Random
                </button>
              </div>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                placeholder="e.g. idem_req_99238"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Subsequent requests with the same key will return the cached event without re-dispatching.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">JSON Payload</label>
              <textarea
                rows={6}
                required
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={ingesting}>
                Ingest & Fan-Out
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

