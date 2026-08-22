"use client";

import React from "react";
import { Sparkles, Layers } from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { planStore, Goal } from "../../store/planStore";
import StaleBadge from "../shared/StaleBadge";
import HealthScoreCard from "./HealthScoreCard";
import WhatChangedFeed from "./WhatChangedFeed";
import FutureConeChart from "./FutureConeChart";
import GoalProgressList from "./GoalProgressList";

export default function DashboardView() {
  const store = usePlanStore();
  const { profile, simulation, whatChanged, goals, isSimulating } = store;

  const healthScore = simulation?.health_score ?? 78;
  const scoreDelta = simulation?.health_score_delta ?? 4;

  const handleImproveGoal = (goal: Goal) => {
    // Open Copilot drawer with pre-seeded contextual query for this goal
    planStore.setCopilotOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-12">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Good evening, {profile.name}
            </h1>
            <StaleBadge isSimulating={isSimulating} />
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Your financial digital twin is live · 10,000 paths calculated
          </p>
        </div>

        {/* Quick Copilot Trigger Button */}
        <button
          onClick={() => planStore.setCopilotOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#00dce5]/15 to-[#d1bcff]/15 hover:from-[#00dce5]/25 hover:to-[#d1bcff]/25 text-[#00dce5] border border-[#00dce5]/30 shadow-md transition self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#d1bcff]" />
          <span>Ask FinTwin Copilot</span>
        </button>
      </div>

      {/* Row 1: Health Score & What Changed Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <HealthScoreCard
          score={healthScore}
          delta={scoreDelta}
          feasibilityPercent={84}
          className="lg:col-span-4"
        />
        <WhatChangedFeed items={whatChanged} className="lg:col-span-8" />
      </div>

      {/* Row 2: The Future Cone Chart */}
      <FutureConeChart
        currentAge={profile.current_age}
        retirementAge={profile.retirement_age}
        simulation={simulation}
      />

      {/* Row 3: Your Goals with "Improve →" CTA */}
      <GoalProgressList goals={goals} onImproveGoal={handleImproveGoal} />

      {/* Row 4: Quick Actions Bar */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Simulation Actions</h4>
          <p className="text-xs text-white/50 mt-0.5">Explore how changes will alter your Future Cone</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => planStore.setActiveScreen("goals")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition flex items-center gap-2"
          >
            <span>+ Add Life Event</span>
          </button>

          <button
            onClick={() => planStore.setActiveScreen("lab")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#d1bcff]" />
            <span>Compare Scenarios</span>
          </button>

          <button
            onClick={() => planStore.setCopilotOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-md shadow-[#00dce5]/20 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Talk to Copilot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
