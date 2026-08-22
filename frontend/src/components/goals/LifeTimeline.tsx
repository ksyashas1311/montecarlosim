"use client";

import React from "react";
import { Target, HeartHandshake } from "lucide-react";
import { Goal, LifeEvent } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";

interface LifeTimelineProps {
  startAge: number;
  endAge: number;
  goals: Goal[];
  lifeEvents: LifeEvent[];
  selectedNode: { type: "goal" | "event"; item: any } | null;
  onSelectNode: (node: { type: "goal" | "event"; item: any }) => void;
  className?: string;
}

export default function LifeTimeline({
  startAge,
  endAge,
  goals,
  lifeEvents,
  selectedNode,
  onSelectNode,
  className = "",
}: LifeTimelineProps) {
  const totalSpan = endAge - startAge;

  const getNodeXPercent = (age: number) => {
    const clamped = Math.max(startAge, Math.min(endAge, age));
    return ((clamped - startAge) / totalSpan) * 100;
  };

  return (
    <div
      className={`bg-gradient-to-b from-[#111822] to-[#0c1017] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl ${className}`}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Interactive Horizon
          </span>
          <h3 className="text-base font-bold text-white">Age-Axis Life Path</h3>
        </div>
        <span className="text-xs text-white/50 font-mono">
          Click any milestone to preview instant Future Cone impact
        </span>
      </div>

      {/* Timeline Horizontal Track */}
      <div className="relative py-16 px-4 my-8">
        {/* Central Age Line */}
        <div className="w-full h-1 bg-gradient-to-r from-[#00dce5] via-[#d1bcff] to-[#ffb4ab]/40 rounded-full" />

        {/* Age Tick Marks */}
        {[startAge, 28, 32, 36, 40, 48, 55, endAge].map((tickAge) => {
          const xPos = getNodeXPercent(tickAge);
          return (
            <div
              key={tickAge}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${xPos}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/40" />
              <span className="text-[10px] text-white/40 font-mono mt-3">
                Age {tickAge} {tickAge === startAge ? "(Now)" : ""}
              </span>
            </div>
          );
        })}

        {/* Goal Nodes (Positioned Above the Line) */}
        {goals.map((g) => {
          const xPos = getNodeXPercent(g.target_age);
          const isSelected = selectedNode?.type === "goal" && selectedNode?.item.id === g.id;
          const prob = Math.round((g.success_probability || 0.7) * 100);

          return (
            <button
              key={g.id}
              onClick={() => onSelectNode({ type: "goal", item: g })}
              className={`absolute -top-12 -translate-x-1/2 flex flex-col items-center group cursor-pointer transition transform hover:scale-110 z-20 ${
                isSelected ? "scale-110" : ""
              }`}
              style={{ left: `${xPos}%` }}
            >
              <div
                className={`p-2.5 rounded-2xl border shadow-lg flex items-center gap-1.5 transition ${
                  isSelected
                    ? "bg-[#00dce5] text-[#0b0f14] border-white shadow-[#00dce5]/30"
                    : "bg-[#0e141c] text-white border-[#00dce5]/50 group-hover:border-[#00dce5]"
                }`}
              >
                <Target className="w-4 h-4" />
                <span className="text-[11px] font-bold whitespace-nowrap">{g.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? "bg-[#0b0f14]/20 text-[#0b0f14]" : "bg-[#00dce5]/20 text-[#00dce5]"
                  }`}
                >
                  {prob}%
                </span>
              </div>
              <div className="w-0.5 h-4 bg-[#00dce5]" />
            </button>
          );
        })}

        {/* Life Event Nodes (Positioned Below the Line) */}
        {lifeEvents.map((e) => {
          const xPos = getNodeXPercent(e.age);
          const isSelected = selectedNode?.type === "event" && selectedNode?.item.id === e.id;

          return (
            <button
              key={e.id}
              onClick={() => onSelectNode({ type: "event", item: e })}
              className={`absolute -bottom-12 -translate-x-1/2 flex flex-col items-center group cursor-pointer transition transform hover:scale-110 z-20 ${
                isSelected ? "scale-110" : ""
              }`}
              style={{ left: `${xPos}%` }}
            >
              <div className="w-0.5 h-4 bg-[#d1bcff]" />
              <div
                className={`p-2.5 rounded-2xl border shadow-lg flex items-center gap-1.5 transition ${
                  isSelected
                    ? "bg-[#d1bcff] text-[#0b0f14] border-white shadow-[#d1bcff]/30"
                    : "bg-[#0e141c] text-white border-[#d1bcff]/50 group-hover:border-[#d1bcff]"
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-[#d1bcff] group-hover:text-white" />
                <span className="text-[11px] font-bold whitespace-nowrap">{e.name}</span>
                <span className="text-[10px] font-mono text-white/60">
                  {formatINR(e.amount, true)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
