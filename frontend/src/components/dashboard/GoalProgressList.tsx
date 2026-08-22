"use client";

import React from "react";
import {
  Target,
  Home,
  Car,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { Goal, planStore } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";

interface GoalProgressListProps {
  goals: Goal[];
  onImproveGoal: (goal: Goal) => void;
  className?: string;
}

export default function GoalProgressList({
  goals,
  onImproveGoal,
  className = "",
}: GoalProgressListProps) {
  const getGoalIcon = (category: Goal["category"]) => {
    switch (category) {
      case "house":
        return Home;
      case "car":
        return Car;
      case "education":
        return GraduationCap;
      case "emergency":
        return ShieldCheck;
      default:
        return Target;
    }
  };

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Your Financial Goals</h3>
          <p className="text-xs text-white/50">
            Each goal probability reflects sequence-of-returns and life event cash flows.
          </p>
        </div>
        <button
          onClick={() => planStore.setActiveScreen("goals")}
          className="text-xs font-semibold text-[#00dce5] hover:underline flex items-center gap-1"
        >
          <span>Timeline View</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Empty State when no goals exist */}
      {goals.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#0e141c]/90 border border-dashed border-white/15 text-center space-y-3 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-[#00dce5]">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No goals tracked yet</h4>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Add your first goal to see probability tracking, future cash flow allocations, and reverse planning guidance.
          </p>
          <button
            onClick={() => planStore.setActiveScreen("goals")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-md transition mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const Icon = getGoalIcon(goal.category);
            const prob = Math.round((goal.success_probability || 0.7) * 100);
            const isHigh = prob >= 80;
            const isMid = prob >= 60 && prob < 80;

            const badgeColor = isHigh
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : isMid
              ? "text-[#00dce5] bg-[#00dce5]/10 border-[#00dce5]/20"
              : "text-amber-400 bg-amber-500/10 border-amber-500/20";

            const barColor = isHigh ? "bg-emerald-400" : isMid ? "bg-[#00dce5]" : "bg-amber-400";

            return (
              <div
                key={goal.id}
                className="bg-[#0e141c]/90 border border-white/5 hover:border-white/15 p-5 rounded-3xl backdrop-blur-md transition flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00dce5]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                        <span className="text-xs text-white/50 font-mono">
                          {formatINR(goal.target_amount, true)} @ Age {goal.target_age}
                        </span>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${badgeColor}`}>
                      {prob}% likely
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${barColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-white/40 font-mono">
                    Priority: <span className="capitalize text-white/70">{goal.priority}</span>
                  </span>

                  <button
                    onClick={() => onImproveGoal(goal)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00dce5]/10 hover:bg-[#00dce5]/20 text-[#00dce5] border border-[#00dce5]/25 transition"
                  >
                    <span>Improve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
