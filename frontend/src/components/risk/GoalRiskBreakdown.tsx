"use client";

import React from "react";
import { Target, Calendar, Shield, TrendingUp, Info } from "lucide-react";
import { GoalRiskDto } from "../../lib/api";
import { formatINR } from "../shared/CurrencyFormat";

interface GoalRiskBreakdownProps {
  goalAssessments: GoalRiskDto[];
  currentAge: number;
}

export default function GoalRiskBreakdown({
  goalAssessments,
  currentAge,
}: GoalRiskBreakdownProps) {
  if (!goalAssessments || goalAssessments.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#0e141c] border border-white/5 text-center space-y-2">
        <Target className="w-8 h-8 text-white/20 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Specific Goals Linked</h4>
        <p className="text-xs text-white/40 max-w-md mx-auto">
          Add target financial goals (such as House, Retirement, or Education) in the Goals & Timeline tab to view customized risk horizon recommendations.
        </p>
      </div>
    );
  }

  const getPostureBadge = (posture: string) => {
    switch (posture) {
      case "Capital Preservation":
        return {
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
          icon: Shield,
        };
      case "Conservative Growth":
        return {
          bg: "bg-teal-500/10 border-teal-500/30 text-teal-400",
          icon: Shield,
        };
      case "Balanced Accumulation":
        return {
          bg: "bg-[#00dce5]/10 border-[#00dce5]/30 text-[#00dce5]",
          icon: TrendingUp,
        };
      case "Aggressive Compounding":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
          icon: TrendingUp,
        };
      default:
        return {
          bg: "bg-white/10 border-white/20 text-white/80",
          icon: Shield,
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00dce5]" />
            <span>Goal-by-Goal Horizon Risk Alignment</span>
          </h4>
          <span className="text-[11px] text-white/40">
            Different financial goals demand distinct risk postures based on timeline proximity.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {goalAssessments.map((goal, idx) => {
          const badge = getPostureBadge(goal.posture);
          const Icon = badge.icon;

          return (
            <div
              key={`${goal.name}_${idx}`}
              className="p-4 rounded-2xl bg-[#0e141c] border border-white/5 hover:border-white/10 transition space-y-3 shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-white block">{goal.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-white/50">
                      Target: {formatINR(goal.target_amount)}
                    </span>
                    <span className="text-[10px] text-white/30">·</span>
                    <span className="text-[10px] text-[#00dce5] font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Age {goal.target_age} ({goal.horizon_years} yrs away)
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${badge.bg}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{goal.posture}</span>
                </span>
              </div>

              {/* Sub-allocation Split Bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-[#00dce5]">Equity: {goal.suggested_equity_pct}%</span>
                  <span className="text-white/60">Debt & Cash: {goal.suggested_debt_pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
                  <div
                    className="h-full bg-[#00dce5]"
                    style={{ width: `${goal.suggested_equity_pct}%` }}
                    title={`Equity: ${goal.suggested_equity_pct}%`}
                  />
                  <div
                    className="h-full bg-[#d1bcff]"
                    style={{ width: `${goal.suggested_debt_pct}%` }}
                    title={`Debt/Cash: ${goal.suggested_debt_pct}%`}
                  />
                </div>
              </div>

              {/* Strategy Advice */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-[11px] text-white/60 leading-tight">
                <Info className="w-3.5 h-3.5 text-[#00dce5] shrink-0 mt-0.5" />
                <span>{goal.strategy_guidance}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
