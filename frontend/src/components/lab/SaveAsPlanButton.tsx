"use client";

import React from "react";
import { ArrowRight, Check } from "lucide-react";

interface SaveAsPlanButtonProps {
  isCurrent: boolean;
  onCommit: () => void;
  className?: string;
}

export default function SaveAsPlanButton({
  isCurrent,
  onCommit,
  className = "",
}: SaveAsPlanButtonProps) {
  if (isCurrent) {
    return (
      <div className={`text-center py-2 text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5 ${className}`}>
        <Check className="w-4 h-4" /> Currently Feeding Twin Core
      </div>
    );
  }

  return (
    <button
      onClick={onCommit}
      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-[#00dce5] hover:text-[#0b0f14] text-white border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      <span>Save this scenario as my plan</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );
}
