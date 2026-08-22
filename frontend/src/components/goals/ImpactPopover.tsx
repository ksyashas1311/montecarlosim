"use client";

import React from "react";
import { X, Trash2 } from "lucide-react";
import { formatINR } from "../shared/CurrencyFormat";

interface ImpactPopoverProps {
  node: { type: "goal" | "event"; item: any };
  onClose: () => void;
  onRemove: () => void;
  className?: string;
}

export default function ImpactPopover({
  node,
  onClose,
  onRemove,
  className = "",
}: ImpactPopoverProps) {
  const { type, item } = node;
  const isGoal = type === "goal";

  return (
    <div
      className={`mt-8 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in relative ${className}`}
    >
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-white/40 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#00dce5]/10 text-[#00dce5] border border-[#00dce5]/20">
            {isGoal ? "Goal Milestone" : "Life Event Impact"}
          </span>
          <h4 className="text-sm font-bold text-white">{item.name}</h4>
        </div>
        <p className="text-xs text-white/60">
          Amount:{" "}
          <strong className="text-white font-mono">
            {formatINR(isGoal ? item.target_amount : item.amount, true)}
          </strong>{" "}
          · Scheduled at Age {item.target_age || item.age}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-[10px] text-white/40 uppercase block font-mono">
            {isGoal ? "Success Probability" : "Portfolio Drawdown"}
          </span>
          <span className="text-base font-bold text-[#00dce5] font-mono">
            {isGoal
              ? `${Math.round((item.success_probability || 0.74) * 100)}% likely`
              : `- ${formatINR(item.amount, true)}`}
          </span>
        </div>

        <button
          onClick={onRemove}
          className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
          title="Remove from twin"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
