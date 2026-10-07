"use client";

import React, { useEffect, useState } from "react";
import {
  Radio,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertOctagon,
  Trash2,
  Shield,
  Gauge,
  Activity,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { useDashboard } from "../layout";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const ENDPOINT_PRESETS = [
  { name: "Httpbin Testing Receiver", url: "https://httpbin.org/post", rateLimit: 60 },
  { name: "Webhook.site Endpoint", url: "https://webhook.site/demo", rateLimit: 120 },
  { name: "Local Dev Microservice", url: "http://localhost:9000/api/webhooks", rateLimit: 300 },
];

export default function EndpointsPage() {
  const { activeProject } = useDashboard();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://httpbin.org/post");
  const [rateLimit, setRateLimit] = useState(60);
  const [creating, setCreating] = useState(false);

  // Secret token visibility toggle map
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    if (!activeProject) return;
    try {
      const list = await api.getEndpoints(activeProject.id);
      setEndpoints(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, [activeProject]);

  const handleApplyPreset = (preset: typeof ENDPOINT_PRESETS[0]) => {
    setName(preset.name);
    setUrl(preset.url);
    setRateLimit(preset.rateLimit);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setCreating(true);

    try {
      await api.createEndpoint(activeProject.id, {
        name,
        url,
        rateLimitPerMinute: rateLimit,
      });
      setName("");
      setUrl("https://httpbin.org/post");
      setShowModal(false);
      await fetchEndpoints();
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to create endpoint"));
    } finally {
      setCreating(false);
    }
  };

  const handleResetCircuit = async (endpointId: string) => {
    if (!activeProject) return;
    try {
      await api.resetCircuit(activeProject.id, endpointId);
      await fetchEndpoints();
    } catch (err: any) {
      alert("Error resetting circuit: " + err.message);
    }
  };

  const handleDelete = async (endpointId: string) => {
    if (!activeProject) return;
    if (!confirm("Are you sure you want to delete this endpoint receiver?")) return;
    try {
      await api.deleteEndpoint(activeProject.id, endpointId);
      await fetchEndpoints();
    } catch (err: any) {
      alert("Error deleting endpoint: " + err.message);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Webhook Endpoints & Circuit Breakers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consumer destination URLs, HMAC-SHA256 signing keys, sliding window token buckets, and circuit isolation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Endpoint
          </Button>
          <button
            onClick={fetchEndpoints}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white transition"
            title="Refresh endpoints"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : endpoints.length === 0 ? (
          <EmptyState
            icon={<Radio className="w-6 h-6 text-cyan-400" />}
            title="No webhook endpoints configured"
            description="Add your first receiving webhook URL to begin receiving signed event dispatches."
            actionLabel="Register Receiver"
            onAction={() => setShowModal(true)}
          />
        ) : (
          endpoints.map((ep) => {
            const isVisible = visibleTokens[ep.id];
            const isCopied = copiedToken === ep.id;
            const isCircuitOpen = ep.circuitState === "OPEN";
            const isCircuitHalfOpen = ep.circuitState === "HALF_OPEN";

            return (
              <Card
                key={ep.id}
                glow={isCircuitOpen ? "rose" : isCircuitHalfOpen ? "purple" : "cyan"}
                className="p-6 space-y-5"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-semibold text-white tracking-tight">{ep.name}</h3>
                      <StatusBadge status={ep.status} />

                      {/* Circuit Status Pill */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                          ep.circuitState === "CLOSED"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                            : isCircuitHalfOpen
                            ? "bg-amber-950/40 text-amber-400 border-amber-500/30 animate-pulse"
                            : "bg-rose-950/40 text-rose-400 border-rose-500/30 shadow-glow-rose"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ep.circuitState === "CLOSED"
                              ? "bg-emerald-400"
                              : isCircuitHalfOpen
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }`}
                        />
                        CIRCUIT: {ep.circuitState}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-cyan-400 break-all">{ep.url}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {ep.circuitState !== "CLOSED" && (
                      <Button
                        onClick={() => handleResetCircuit(ep.id)}
                        variant="secondary"
                        size="sm"
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Reset Circuit
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Delete endpoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subsystem Details & Security Tokens */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
                  {/* HMAC Secret */}
                  <div className="lg:col-span-2 space-y-1.5">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-cyan-400" />
                      HMAC SHA-256 Signing Secret
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type={isVisible ? "text" : "password"}
                        readOnly
                        value={ep.secretToken}
                        className="w-full max-w-md px-3.5 py-1.5 rounded-xl bg-surface-card border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => toggleVisibility(ep.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
                        title={isVisible ? "Hide secret" : "Show secret"}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToken(ep.id, ep.secretToken)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
                        title="Copy secret"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Rate Limiting & Consecutive Failures */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 text-slate-400 pt-2 lg:pt-0">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-indigo-400" />
                        Token Bucket
                      </span>
                      <span className="text-white font-medium text-xs block">
                        {ep.rateLimitPerMinute} req/min
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" />
                        Circuit Fails
                      </span>
                      <span
                        className={`text-xs font-bold block ${
                          ep.failureCount > 0 ? "text-rose-400" : "text-white"
                        }`}
                      >
                        {ep.failureCount} / 5 threshold
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Endpoint Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Webhook Endpoint"
        subtitle="Configure target destination URL, HMAC secrets, and rate limit rules"
        icon={<Radio className="w-5 h-5 text-cyan-400" />}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase">
              Quick Receiver Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {ENDPOINT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-surface-card hover:bg-surface-card/80 text-xs font-mono text-slate-300 hover:text-white transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Endpoint Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Stripe Webhook Receiver"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Destination URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Rate Limit (Requests per Minute)
              </label>
              <input
                type="number"
                required
                min={1}
                max={10000}
                value={rateLimit}
                onChange={(e) => setRateLimit(parseInt(e.target.value) || 60)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Protects receiving downstream servers against catastrophic stampedes using in-memory token bucket.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={creating}>
                Save & Activate Endpoint
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

