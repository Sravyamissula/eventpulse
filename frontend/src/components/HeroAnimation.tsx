"use client";

import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulse: number;
}

interface PulsePacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

export default function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 800;
      height = canvas.height = canvas.parentElement?.clientHeight || 500;
    };
    window.addEventListener("resize", handleResize);

    const colors = ["#38bdf8", "#06b6d4", "#a855f7", "#10b981", "#818cf8"];

    // Initialize distributed nodes
    const nodeCount = 22;
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 3 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // Dynamic packets moving across the distributed mesh
    const packets: PulsePacket[] = [];
    const spawnPacket = () => {
      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      let to = Math.floor(Math.random() * nodes.length);
      while (to === from) {
        to = Math.floor(Math.random() * nodes.length);
      }
      packets.push({
        fromNode: from,
        toNode: to,
        progress: 0,
        speed: Math.random() * 0.012 + 0.008,
        color: nodes[from].color,
      });
    };

    const interval = setInterval(spawnPacket, 600);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & draw packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }

        const start = nodes[p.fromNode];
        const end = nodes[p.toNode];
        const curX = start.x + (end.x - start.x) * p.progress;
        const curY = start.y + (end.y - start.y) * p.progress;

        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 30 || n.x > width - 30) n.vx *= -1;
        if (n.y < 30 || n.y > height - 30) n.vy *= -1;

        n.pulse += 0.04;
        const currentRadius = n.radius + Math.sin(n.pulse) * 1.5;

        // Glowing node core
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = n.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Subtle outer pulse ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `${n.color}33`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-[450px] lg:h-[520px] rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 shadow-glow">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          DISTRIBUTED WEBHOOK TOPOLOGY: ACTIVE
        </span>
        <span className="text-cyan-400/80">LATENCY TARGET: &lt; 50ms</span>
      </div>
    </div>
  );
}
