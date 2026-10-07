"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface CinematicIntroProps {
  onComplete: () => void;
}

const LETTERS = [
  { char: "E", isAccent: false, delay: 0 },
  { char: "V", isAccent: false, delay: 80 },
  { char: "E", isAccent: false, delay: 160 },
  { char: "N", isAccent: false, delay: 240 },
  { char: "T", isAccent: false, delay: 320 },
  { char: "P", isAccent: true, delay: 460 },
  { char: "U", isAccent: true, delay: 540 },
  { char: "L", isAccent: true, delay: 620 },
  { char: "S", isAccent: true, delay: 700 },
  { char: "E", isAccent: true, delay: 780 },
];

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [visibleLetters, setVisibleLetters] = useState<number>(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  const finishIntro = useCallback(() => {
    sessionStorage.setItem("eventpulse_intro_seen", "true");
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 600);
  }, [onComplete]);

  useEffect(() => {
    // Check user accessibility preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasSeenIntro = sessionStorage.getItem("eventpulse_intro_seen");

    if (prefersReducedMotion || hasSeenIntro) {
      setVisible(false);
      onComplete();
      return;
    }

    // Letter-by-letter construction schedule
    const letterTimers: NodeJS.Timeout[] = [];
    LETTERS.forEach((item, index) => {
      const timer = setTimeout(() => {
        setVisibleLetters(index + 1);
      }, item.delay + 300);
      letterTimers.push(timer);
    });

    // Light pulse travels through the wordmark after all letters arrive
    const pulseTimer = setTimeout(() => {
      setPulseActive(true);
      setSubtitleVisible(true);
    }, 1250);

    // Fade out and transition smoothly to hero (total ~2.8s)
    const exitTimer = setTimeout(() => {
      finishIntro();
    }, 2800);

    // Escape key listener to skip intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finishIntro();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      letterTimers.forEach(clearTimeout);
      clearTimeout(pulseTimer);
      clearTimeout(exitTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [finishIntro, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="EventPulse Platform Introduction"
      className={`fixed inset-0 z-50 bg-[#03060c] flex flex-col items-center justify-center p-6 select-none transition-all duration-700 ${
        exiting ? "opacity-0 scale-105 pointer-events-none filter blur-sm" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient subtle particle field background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(6,182,212,0.12),transparent_80%)] pointer-events-none" />

      {/* Decorative fine perspective grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          transform: "perspective(600px) rotateX(45deg)",
        }}
      />

      {/* Skip Button */}
      <button
        onClick={finishIntro}
        className="absolute top-6 right-8 text-xs font-mono text-slate-400 hover:text-cyan-300 transition flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border border-slate-800 bg-surface/60 hover:border-cyan-500/40 hover:bg-slate-900/80 shadow-lg group backdrop-blur-md"
        aria-label="Skip cinematic introduction"
      >
        <span>Skip Intro</span>
        <kbd className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-cyan-300 ml-1">
          Esc
        </kbd>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
      </button>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
        {/* Animated Wordmark Container */}
        <div className="relative inline-flex items-center tracking-[0.18em] sm:tracking-[0.24em] font-extrabold text-4xl sm:text-6xl md:text-7xl font-mono select-none py-4 px-6">
          {LETTERS.map((item, index) => {
            const isVisible = index < visibleLetters;
            return (
              <span
                key={index}
                style={{
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isVisible
                    ? "translate3d(0, 0, 0) scale(1)"
                    : "translate3d(0, 24px, 40px) scale(1.3)",
                  opacity: isVisible ? 1 : 0,
                  filter: isVisible ? "blur(0px)" : "blur(12px)",
                }}
                className={`inline-block relative ${
                  item.isAccent
                    ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                    : "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                }`}
              >
                {item.char}
              </span>
            );
          })}

          {/* Sweeping Light Pulse Beam across the wordmark */}
          {pulseActive && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ mixBlendMode: "screen" }}
            >
              <div
                className="w-24 h-full bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent transform -skew-x-12 animate-[sweep_0.9s_cubic-bezier(0.4,0,0.2,1)_forwards]"
                style={{
                  filter: "blur(6px)",
                  boxShadow: "0 0 35px #38bdf8",
                }}
              />
            </div>
          )}
        </div>

        {/* Subtitle with graceful delayed appearance */}
        <div
          className={`transition-all duration-700 transform flex items-center gap-2 text-xs sm:text-sm font-mono tracking-widest uppercase ${
            subtitleVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">
            Distributed Webhook Engine <span className="text-cyan-400">&bull;</span> AI Observability
          </span>
        </div>
      </div>

      {/* Subtle Bottom Progress Pulse Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 animate-[pulseProgress_2.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards]" />
      </div>

      <style jsx>{`
        @keyframes sweep {
          0% {
            transform: translateX(-150%) skewX(-20deg);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(350%) skewX(-20deg);
            opacity: 0;
          }
        }
        @keyframes pulseProgress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
