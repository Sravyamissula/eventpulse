import React from "react";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 rounded-xl ${className}`}
    />
  );
}
