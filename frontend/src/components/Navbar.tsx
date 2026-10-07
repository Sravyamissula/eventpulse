"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, LogOut, Shield, Folder, Search, Command, Cpu } from "lucide-react";
import { clearAuthToken, getStoredUser } from "@/lib/api";

interface NavbarProps {
  projects?: Array<{ id: string; name: string }>;
  activeProjectId?: string;
  onSelectProject?: (id: string) => void;
  onOpenCommandPalette?: () => void;
}

export default function Navbar({
  projects = [],
  activeProjectId,
  onSelectProject,
  onOpenCommandPalette,
}: NavbarProps) {
  const router = useRouter();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            Event<span className="text-cyan-400">Pulse</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              v1.0
            </span>
          </span>
        </Link>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Project:</span>
            <select
              value={activeProjectId || ""}
              onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-card/80 hover:bg-surface-card border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200 transition text-xs font-mono shadow-sm group"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
        <span>Search commands, routes, simulate...</span>
        <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-slate-700 text-[10px] text-slate-400 font-mono">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* User profile & actions */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs">
        <Link
          href="/dashboard/architecture"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/20 transition font-mono"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D Topology</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card/60 border border-slate-800 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-slate-300">{user.email || "operator"}</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

