"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  PieChart,
} from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { planStore } from "../../store/planStore";
import { riskApi, RiskProfileDto } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import RiskGauge from "./RiskGauge";
import RiskQuestionnaireModal from "./RiskQuestionnaireModal";
import GoalRiskBreakdown from "./GoalRiskBreakdown";
import { formatINR } from "../shared/CurrencyFormat";

export default function RiskProfileView() {
  const store = usePlanStore();
  const { profile, goals, riskProfile } = store;
  const { isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAppliedAllocation, setHasAppliedAllocation] = useState(false);

  const fetchRiskProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await riskApi.getProfile();
      if (data) {
        planStore.setRiskProfile(data);
      }
    } catch {
      // If 404, user has not taken assessment yet
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!riskProfile && isAuthenticated) {
      fetchRiskProfile();
    }
  }, [riskProfile, isAuthenticated, fetchRiskProfile]);

  const handleApplyAllocation = () => {
    if (!riskProfile?.recommended_allocation) return;
    planStore.applyRiskAllocation(riskProfile.recommended_allocation);
    setHasAppliedAllocation(true);
    setTimeout(() => setHasAppliedAllocation(false), 3000);
  };

  const currentAge = profile.current_age || 25;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center text-[#0b0f14] shadow-md shadow-[#00dce5]/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Personalized Risk Profiling
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-1 max-w-2xl">
            A quantitative assessment evaluating your psychological risk tolerance (willingness) paired with empirical financial capacity (ability based on goals, horizon, and debt).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-[#00dce5] to-[#d1bcff] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{riskProfile ? "Retake Assessment" : "Take Assessment"}</span>
        </button>
      </div>

      {/* Main Content: If No Assessment Exists */}
      {!riskProfile ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0e141c] border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#00dce5]/20 to-[#d1bcff]/20 border border-[#00dce5]/30 mx-auto flex items-center justify-center text-[#00dce5] shadow-xl">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-white">No Risk Profile Found</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Complete a short 5-question evaluation to determine your personal risk score, psychological tolerance, financial capacity, and recommended asset allocation.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 rounded-2xl text-xs font-black bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-xl shadow-[#00dce5]/25 transition cursor-pointer"
            >
              Start 2-Minute Risk Assessment
            </button>
          </div>
        </div>
      ) : (
        /* Assessment Active View */
        <div className="space-y-6">
          {/* Top Grid: Gauge + Financial Horizon Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 Cols: SVG Gauge */}
            <div className="lg:col-span-5 flex">
              <RiskGauge
                score={riskProfile.overall_score}
                toleranceScore={riskProfile.risk_tolerance_score}
                capacityScore={riskProfile.risk_capacity_score}
                category={riskProfile.risk_category}
              />
            </div>

            {/* Right 7 Cols: Capacity Dimensions & Metrics */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0e141c] border border-white/5 flex flex-col justify-between shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Risk Architecture Breakdown
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  Primary Horizon: {riskProfile.investment_horizon_years} Years
                </span>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Time Horizon</span>
                  <span className="text-base font-black text-white block">
                    {riskProfile.investment_horizon_years} Yrs
                  </span>
                  <span className="text-[10px] text-[#00dce5]">
                    {riskProfile.investment_horizon_years >= 10 ? "High Risk Capacity" : "Moderate Capacity"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Liquid Buffer</span>
                  <span className="text-base font-black text-white block">
                    {formatINR(profile.current_wealth)}
                  </span>
                  <span className="text-[10px] text-[#d1bcff]">
                    {(profile.current_wealth / Math.max(1, profile.monthly_expenses)).toFixed(1)}x Mo. Expenses
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Monthly Surplus</span>
                  <span className="text-base font-black text-white block">
                    {formatINR(profile.monthly_income - profile.monthly_expenses)}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {formatINR(profile.monthly_sip)} SIP Active
                  </span>
                </div>
              </div>

              {/* Summary Highlights */}
              <div className="p-4 rounded-2xl bg-[#00dce5]/5 border border-[#00dce5]/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00dce5]">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Key Quantitative Observation</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {riskProfile.risk_tolerance_score >= riskProfile.risk_capacity_score
                    ? "Your psychological risk willingness exceeds your empirical financial capacity. Near-term goal liabilities necessitate downside protection regardless of risk appetite."
                    : "Your financial capacity exceeds your psychological risk tolerance. While your cash flow and horizon could absorb higher volatility, your portfolio respects your peace of mind."}
                </p>
              </div>
            </div>
          </div>

          {/* Key Positive and Negative Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive Factors */}
            <div className="p-5 rounded-3xl bg-[#0e141c] border border-white/5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Positive Risk-Capacity Factors
                </h4>
              </div>

              <div className="space-y-2.5">
                {riskProfile.factors
                  .filter((f) => f.type === "positive")
                  .map((factor, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-0.5"
                    >
                      <span className="text-xs font-bold text-emerald-300 block">
                        + {factor.title}
                      </span>
                      <span className="text-[11px] text-white/60 block leading-tight">
                        {factor.description}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Risk-Reducing / Caution Factors */}
            <div className="p-5 rounded-3xl bg-[#0e141c] border border-white/5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Risk-Reducing & Caution Factors
                </h4>
              </div>

              <div className="space-y-2.5">
                {riskProfile.factors
                  .filter((f) => f.type === "negative" || f.type === "neutral")
                  .map((factor, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-0.5"
                    >
                      <span className="text-xs font-bold text-amber-300 block">
                        • {factor.title}
                      </span>
                      <span className="text-[11px] text-white/60 block leading-tight">
                        {factor.description}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Dynamic Personalized Narrative */}
          <div className="p-6 rounded-3xl bg-[#0e141c] border border-white/5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00dce5]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                Personalized Qualitative Assessment
              </h4>
            </div>
            <div className="text-xs text-white/70 leading-relaxed space-y-2 whitespace-pre-line font-sans">
              {riskProfile.narrative}
            </div>
          </div>

          {/* Recommended Educational Asset Allocation */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e141c] to-[#121a24] border border-[#00dce5]/20 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#00dce5]" />
                  <span>Recommended Asset Allocation Benchmark</span>
                </h4>
                <span className="text-[11px] text-white/40">
                  Target portfolio weights tailored for the **{riskProfile.risk_category}** risk profile.
                </span>
              </div>

              <button
                onClick={handleApplyAllocation}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                  hasAppliedAllocation
                    ? "bg-emerald-500 text-[#0b0f14]"
                    : "bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-[#00dce5]/20"
                }`}
              >
                {hasAppliedAllocation ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied to Plan!</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Apply to My Plan</span>
                  </>
                )}
              </button>
            </div>

            {/* 4 Allocation Weight Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#00dce5]">Equity</span>
                <span className="text-2xl font-black text-white block">
                  {riskProfile.recommended_allocation.equity}%
                </span>
                <span className="text-[10px] text-white/40 font-mono">Growth Engine</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#d1bcff]">Debt</span>
                <span className="text-2xl font-black text-white block">
                  {riskProfile.recommended_allocation.debt}%
                </span>
                <span className="text-[10px] text-white/40 font-mono">Stability & Income</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-300">Gold</span>
                <span className="text-2xl font-black text-white block">
                  {riskProfile.recommended_allocation.gold}%
                </span>
                <span className="text-[10px] text-white/40 font-mono">Inflation Hedge</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Cash / Liquid</span>
                <span className="text-2xl font-black text-white block">
                  {riskProfile.recommended_allocation.cash}%
                </span>
                <span className="text-[10px] text-white/40 font-mono">Emergency Buffer</span>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-[#00dce5]"
                style={{ width: `${riskProfile.recommended_allocation.equity}%` }}
                title={`Equity: ${riskProfile.recommended_allocation.equity}%`}
              />
              <div
                className="h-full bg-[#d1bcff]"
                style={{ width: `${riskProfile.recommended_allocation.debt}%` }}
                title={`Debt: ${riskProfile.recommended_allocation.debt}%`}
              />
              <div
                className="h-full bg-amber-300"
                style={{ width: `${riskProfile.recommended_allocation.gold}%` }}
                title={`Gold: ${riskProfile.recommended_allocation.gold}%`}
              />
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${riskProfile.recommended_allocation.cash}%` }}
                title={`Cash: ${riskProfile.recommended_allocation.cash}%`}
              />
            </div>
          </div>

          {/* Goal-by-Goal Horizon Risk Alignment */}
          <GoalRiskBreakdown
            goalAssessments={riskProfile.goal_assessments}
            currentAge={currentAge}
          />
        </div>
      )}

      {/* Interactive Questionnaire Modal */}
      <RiskQuestionnaireModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialResponses={riskProfile?.responses}
        onSuccess={(updatedProfile) => {
          planStore.setRiskProfile(updatedProfile);
        }}
      />
    </div>
  );
}
