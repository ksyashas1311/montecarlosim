"use client";

import React from "react";
import { Scenario } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";
import SaveAsPlanButton from "./SaveAsPlanButton";

interface ScenarioCardProps {
  scenario: Scenario;
  onCommit: () => void;
  className?: string;
}

export default function ScenarioCard({
  scenario,
  onCommit,
  className = "",
}: ScenarioCardProps) {
  const isCurrent = scenario.id === "current";

  return (
    <div
      className={`p-6 rounded-3xl border flex flex-col justify-between backdrop-blur-md relative transition shadow-xl ${
        isCurrent
          ? "bg-[#0e1724]/90 border-[#00dce5]/40 shadow-[#00dce5]/5"
          : "bg-[#0e141c]/90 border-white/5 hover:border-white/20"
      } ${className}`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: scenario.color }}
            />
            <h3 className="text-base font-bold text-white">{scenario.name}</h3>
          </div>
          {isCurrent ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#00dce5]/10 text-[#00dce5] border border-[#00dce5]/30">
              Active Plan
            </span>
          ) : (
            <span className="text-[10px] text-white/40 font-mono">What-If Fork</span>
          )}
        </div>

        <p className="text-xs text-white/60 mb-6">{scenario.description}</p>

        {/* Score & Terminal Wealth Box */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
              Health Score
            </span>
            <span
              className="text-2xl font-black font-mono mt-1 block"
              style={{ color: scenario.color }}
            >
              {scenario.health_score}
              <span className="text-xs font-normal text-white/40">/100</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
              Median Wealth
            </span>
            <span className="text-lg font-bold text-white font-mono mt-1 block">
              {formatINR(scenario.p50_terminal, true)}
            </span>
          </div>
        </div>

        {/* Parameters Details */}
        <div className="space-y-2 text-xs text-white/60">
          <div className="flex justify-between">
            <span>Monthly SIP:</span>
            <span className="text-white font-mono">{formatINR(scenario.monthly_sip)}</span>
          </div>
          <div className="flex justify-between">
            <span>Retirement Target:</span>
            <span className="text-white font-mono">Age {scenario.retirement_age}</span>
          </div>
          <div className="flex justify-between">
            <span>Equity Allocation:</span>
            <span className="text-white font-mono">{scenario.equity_ratio}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <SaveAsPlanButton isCurrent={isCurrent} onCommit={onCommit} />
      </div>
    </div>
  );
}
