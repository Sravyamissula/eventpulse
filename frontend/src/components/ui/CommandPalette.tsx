"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Zap,
  Send,
  Radio,
  Key,
  AlertTriangle,
  Sparkles,
  Cpu,
  Play,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateEvent?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSimulateEvent,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      label: "Go to Overview",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G O",
      run: () => router.push("/dashboard"),
    },
    {
      label: "Go to Event Stream & Idempotency",
      category: "Navigation",
      icon: Zap,
      shortcut: "G E",
      run: () => router.push("/dashboard/events"),
    },
    {
      label: "Go to Deliveries & Attempt Waterfalls",
      category: "Navigation",
      icon: Send,
      shortcut: "G D",
      run: () => router.push("/dashboard/deliveries"),
    },
    {
      label: "Go to Endpoints & Circuit Breakers",
      category: "Navigation",
      icon: Radio,
      shortcut: "G C",
      run: () => router.push("/dashboard/endpoints"),
    },
    {
      label: "Go to API Ingestion Keys",
      category: "Navigation",
      icon: Key,
      shortcut: "G K",
      run: () => router.push("/dashboard/api-keys"),
    },
    {
      label: "Go to Dead Letter Queue (DLQ)",
      category: "Navigation",
      icon: AlertTriangle,
      shortcut: "G Q",
      run: () => router.push("/dashboard/dlq"),
    },
    {
      label: "Go to AI Incident Intelligence",
      category: "Navigation",
      icon: Sparkles,
      shortcut: "G A",
      run: () => router.push("/dashboard/ai-insights"),
    },
    {
      label: "Inspect System Architecture",
      category: "Architecture",
      icon: Cpu,
      shortcut: "G S",
      run: () => router.push("/dashboard/architecture"),
    },
    {
      label: "Simulate Webhook Delivery Event",
      category: "Actions",
      icon: Play,
      shortcut: "⌘ S",
      run: () => {
        if (onSimulateEvent) onSimulateEvent();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event or parent prop
        }
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/30 overflow-hidden shadow-glow animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-surface/90">
          <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search sections... (↑↓ to navigate, ↵ to select)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-xs font-mono focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-card border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-xs font-mono ${
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-300 hover:bg-surface-card/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-card border border-slate-800 text-slate-400">
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "opacity-0"}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 bg-surface-card/40 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>EventPulse Command Dispatcher</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
