import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "cyan" | "purple" | "rose" | "emerald" | "none";
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  glow = "none",
  hoverable = true,
  ...props
}: CardProps) {
  const glowStyles = {
    none: "",
    cyan: "hover:border-cyan-500/40 hover:shadow-glow",
    purple: "hover:border-purple-500/40 hover:shadow-glow-purple",
    rose: "hover:border-rose-500/40 hover:shadow-glow-rose",
    emerald: "hover:border-emerald-500/40 hover:shadow-glow-emerald",
  };

  return (
    <div
      className={`glass-panel rounded-2xl border border-slate-800/90 transition-all duration-300 ${
        hoverable ? "hover:bg-surface-card/60 " + glowStyles[glow] : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
