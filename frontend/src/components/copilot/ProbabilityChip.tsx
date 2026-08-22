"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { planStore, PlanState } from "../../store/planStore";

interface ProbabilityChipProps {
  label: string;
  probability?: number;
  linkScreen?: PlanState["activeScreen"];
  onClick?: () => void;
  className?: string;
}

export default function ProbabilityChip({
  label,
  probability,
  linkScreen,
  onClick,
  className = "",
}: ProbabilityChipProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (linkScreen) {
      planStore.setActiveScreen(linkScreen);
      planStore.setCopilotOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#00dce5]/15 hover:bg-[#00dce5]/25 text-[#00dce5] border border-[#00dce5]/30 shadow-sm transition cursor-pointer ${className}`}
    >
      <span>{label}</span>
      {probability !== undefined && (
        <span className="font-mono text-[10px] bg-[#00dce5]/20 px-1.5 py-0.5 rounded">
          {probability}%
        </span>
      )}
      <ArrowRight className="w-3 h-3" />
    </button>
  );
}
