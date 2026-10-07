"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/ui/CommandPalette";
import { api, getActiveProjectId, setActiveProjectId, clearAuthToken } from "@/lib/api";

const DashboardBackground3D = dynamic(() => import("@/components/DashboardBackground3D"), {
  ssr: false,
});

interface Project {
  id: string;
  name: string;
}

interface DashboardContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  refreshProjects: () => Promise<void>;
  openCommandPalette: () => void;
}

const DashboardContext = createContext<DashboardContextType>({
  projects: [],
  activeProject: null,
  setActiveProject: () => {},
  refreshProjects: async () => {},
  openCommandPalette: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);

      if (list.length > 0) {
        const storedId = getActiveProjectId();
        const found = list.find((p) => p.id === storedId) || list[0];
        setActiveProjectState(found);
        setActiveProjectId(found.id);
      } else {
        // Create an initial project automatically
        const created = await api.createProject({ name: "Default Gateway" });
        setProjects([created]);
        setActiveProjectState(created);
        setActiveProjectId(created.id);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
      // If unauthorized, redirect to login
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectProject = (projectId: string) => {
    const selected = projects.find((p) => p.id === projectId);
    if (selected) {
      setActiveProjectState(selected);
      setActiveProjectId(selected.id);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!activeProject) return;
    try {
      await api.ingestEvent(
        {
          eventType: "order.created",
          payload: {
            orderId: "ord_" + Math.random().toString(36).substring(2, 9),
            amount: 4999,
            currency: "USD",
            source: "command_palette_simulator",
          },
          idempotencyKey: "idem_cmd_" + Date.now(),
        },
        undefined,
        activeProject.id
      );
      router.push("/dashboard/deliveries");
    } catch (err: any) {
      console.error("Simulation error", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">CONNECTING TO EVENTPULSE CLUSTER...</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject: (p) => {
          setActiveProjectState(p);
          setActiveProjectId(p.id);
        },
        refreshProjects: fetchProjects,
        openCommandPalette: () => setCommandPaletteOpen(true),
      }}
    >
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <DashboardBackground3D />
        <Navbar
          projects={projects}
          activeProjectId={activeProject?.id}
          onSelectProject={handleSelectProject}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <div className="flex-1 flex relative z-10">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl">
            {children}
          </main>
        </div>

        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSimulateEvent={handleSimulateWebhook}
        />
      </div>
    </DashboardContext.Provider>
  );
}
