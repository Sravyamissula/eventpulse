"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Send,
  Radio,
  Key,
  AlertTriangle,
  Sparkles,
  Cpu,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/events", label: "Event Stream", icon: Zap },
    { href: "/dashboard/deliveries", label: "Deliveries", icon: Send },
    { href: "/dashboard/endpoints", label: "Endpoints & Circuits", icon: Radio },
    { href: "/dashboard/api-keys", label: "API Ingestion Keys", icon: Key },
    { href: "/dashboard/dlq", label: "Dead Letter Queue", icon: AlertTriangle, badge: "DLQ" },
    { href: "/dashboard/ai-insights", label: "AI Failure Analysis", icon: Sparkles, badge: "AI" },
    { href: "/dashboard/architecture", label: "3D Infrastructure", icon: Cpu, badge: "3D" },
  ];


  return (
    <aside className="w-64 border-r border-surface-border bg-surface/50 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono tracking-wider text-slate-500 uppercase">
          Observability & Ops
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-glow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-card/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  link.badge === "AI"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* System Status footer */}
      <div className="p-3.5 rounded-xl bg-surface-card/60 border border-slate-800 text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span>Backend Engine</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Healthy
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>PostgreSQL 17.4</span>
          <span className="text-slate-300">Connected</span>
        </div>
      </div>
    </aside>
  );
}
