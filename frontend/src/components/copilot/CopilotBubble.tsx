"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { planStore } from "../../store/planStore";

export default function CopilotBubble() {
  const store = usePlanStore();
  const isOpen = store.copilotOpen;

  return (
    <button
      onClick={() => planStore.setCopilotOpen(!isOpen)}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-[#00dce5] via-[#00c5cd] to-[#d1bcff] text-[#0b0f14] shadow-2xl shadow-[#00dce5]/30 hover:scale-105 active:scale-95 transition flex items-center justify-center group"
      aria-label="Open FinTwin Copilot"
    >
      <Sparkles className="w-6 h-6 transition transform group-hover:rotate-12" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
        Copilot
      </span>
      {/* Pulse ring */}
      <span className="absolute -inset-1 rounded-full bg-[#00dce5]/30 animate-ping pointer-events-none -z-10" />
    </button>
  );
}
