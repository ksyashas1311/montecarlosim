"use client";

import React from "react";
import { SuggestedPrompt } from "../../hooks/useCopilotContext";

interface SuggestedPromptsProps {
  prompts: SuggestedPrompt[];
  onSelectPrompt: (promptText: string) => void;
  className?: string;
}

export default function SuggestedPrompts({
  prompts,
  onSelectPrompt,
  className = "",
}: SuggestedPromptsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
        Suggested for Current Screen
      </span>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {prompts.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPrompt(p.prompt)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 whitespace-nowrap transition cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
