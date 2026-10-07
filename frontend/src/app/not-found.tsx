"use client";

import React from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowLeft, Home, Radio } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800/90 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-glow">
          <Radio className="w-8 h-8 animate-pulse text-cyan-400" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
            Error 404 &middot; Packet Dropped
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Route Not Found
          </h1>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            The requested destination URL or cluster path does not exist in the EventPulse routing table.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" icon={<Home className="w-4 h-4" />}>
              Dashboard Overview
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Home
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
          EVENTPULSE HIGH-RELIABILITY GATEWAY
        </div>
      </div>
    </div>
  );
}
