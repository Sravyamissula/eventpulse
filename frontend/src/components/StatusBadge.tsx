import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "delivery" | "circuit" | "endpoint" | "dlq";
}

export default function StatusBadge({ status, type = "delivery" }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  let bg = "bg-slate-800 text-slate-300 border-slate-700";
  let dot = "bg-slate-400";

  if (["SUCCESS", "ACTIVE", "CLOSED", "RESOLVED"].includes(norm)) {
    bg = "bg-emerald-950/40 text-emerald-400 border-emerald-500/30";
    dot = "bg-emerald-400";
  } else if (["RETRYING", "HALF_OPEN", "RATE_LIMITED"].includes(norm)) {
    bg = "bg-amber-950/40 text-amber-400 border-amber-500/30";
    dot = "bg-amber-400 animate-pulse";
  } else if (["FAILED", "OPEN", "DISCARDED"].includes(norm)) {
    bg = "bg-rose-950/40 text-rose-400 border-rose-500/30";
    dot = "bg-rose-400";
  } else if (["PENDING", "ACCEPTED"].includes(norm)) {
    bg = "bg-cyan-950/40 text-cyan-400 border-cyan-500/30";
    dot = "bg-cyan-400";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {norm}
    </span>
  );
}
