"use client";

import React, { useEffect, useState } from "react";
import {
  Key,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Code2,
  Lock,
} from "lucide-react";
import { useDashboard } from "../layout";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function ApiKeysPage() {
  const { activeProject } = useDashboard();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  // New key secret revelation modal state
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchKeys = async () => {
    if (!activeProject) return;
    try {
      const list = await api.getApiKeys(activeProject.id);
      setKeys(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [activeProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setCreating(true);

    try {
      const res = await api.createApiKey(activeProject.id, { name: keyName });
      setKeyName("");
      setShowCreateModal(false);
      setCreatedKeySecret(res.apiKey);
      await fetchKeys();
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to create API key"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!activeProject) return;
    if (
      !confirm(
        "Are you sure you want to revoke this API key? Ingestion requests using this key will immediately be rejected with 401 Unauthorized."
      )
    )
      return;
    try {
      await api.revokeApiKey(activeProject.id, keyId);
      await fetchKeys();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const copySecret = () => {
    if (!createdKeySecret) return;
    navigator.clipboard.writeText(createdKeySecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X POST http://localhost:8081/api/events \\
  -H "X-API-Key: ${createdKeySecret || "ep_live_••••••••••••••••"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventType": "payment.captured",
    "payload": { "id": "pay_9921", "amount": 4500 }
  }'`;

  const copyCurlSnippet = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            Project API Ingestion Keys
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate external microservices dispatching events directly into EventPulse (<code className="text-cyan-400">X-API-Key: ep_live_...</code>)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Generate Key
          </Button>
          <button
            onClick={fetchKeys}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white transition"
            title="Refresh keys"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Architecture Guarantee Card */}
      <Card hoverable={false} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/20 via-surface-card to-surface-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Cryptographic Zero-Knowledge Storage</h3>
            <p className="text-[11px] text-slate-400">
              Raw API keys are hashed using SHA-256 before committing to PostgreSQL. Only the 16-character prefix is persisted in plaintext.
            </p>
          </div>
        </div>
      </Card>

      {/* Keys Table */}
      <Card hoverable={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={<Key className="w-6 h-6 text-cyan-400" />}
            title="No API ingestion keys found"
            description="Create your first project API key to authenticate machine-to-machine event publishing."
            actionLabel="Generate Ingestion Key"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Label</th>
                  <th className="px-6 py-3">Key Prefix</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-surface-card/40 transition">
                    <td className="px-6 py-3.5 font-semibold text-white">
                      {k.name}
                    </td>
                    <td className="px-6 py-3.5 text-cyan-400">
                      {k.keyPrefix}••••••••••••••••
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${
                          k.active
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            k.active ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        {k.active ? "ACTIVE" : "REVOKED"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {k.active && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition text-[11px]"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate Project API Key"
        subtitle="Authenticate machine-to-machine event ingestion via HTTP headers"
        icon={<Key className="w-5 h-5 text-cyan-400" />}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 mb-1">Key Label / Service Identifier</label>
            <input
              type="text"
              required
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Production Billing Microservice"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Security Guarantee:</p>
            <p>
              Once created, the unhashed secret key will only be shown to you once. It cannot be recovered later.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={creating}>
              Generate API Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secret Revelation Modal */}
      <Modal
        isOpen={!!createdKeySecret}
        onClose={() => setCreatedKeySecret(null)}
        title="API Key Generated Successfully"
        subtitle="Store this plaintext key securely now"
        icon={<ShieldCheck className="w-5 h-5 text-cyan-400" />}
        maxWidth="lg"
      >
        {createdKeySecret && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Please copy your API key now. For security purposes, this secret key will <strong>never</strong> be displayed again.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 text-[10px] uppercase">Plaintext API Secret Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdKeySecret}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-cyan-500/30 text-cyan-300 select-all focus:outline-none"
                />
                <Button
                  onClick={copySecret}
                  size="sm"
                  variant="primary"
                  icon={copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Quick Curl Code Snippet */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Ingestion cURL Command
                </span>
                <button
                  onClick={copyCurlSnippet}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? "Copied" : "Copy Snippet"}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
                {curlExample}
              </pre>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setCreatedKeySecret(null)} variant="secondary" size="sm">
                I have securely stored my key
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

