"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  PieChart,
  Settings2,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { useLiveSimulation } from "../../hooks/useLiveSimulation";
import { planStore, AssetAllocation } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";
import InlineEditableField from "./InlineEditableField";
import AllocationSliders from "./AllocationSliders";
import AssumptionsPanel from "./AssumptionsPanel";

export default function PlanView() {
  const store = usePlanStore();
  const { previewSimulation } = useLiveSimulation();
  const { profile, assets, marketModel, decumulationStrategy } = store;

  const [activeTab, setActiveTab] = useState<"income" | "assets" | "assumptions">("income");

  // Local draft states for inline editing & live delta preview
  const [draftIncome, setDraftIncome] = useState(profile.monthly_income);
  const [draftExpenses, setDraftExpenses] = useState(profile.monthly_expenses);
  const [draftSip, setDraftSip] = useState(profile.monthly_sip);
  const [draftWealth, setDraftWealth] = useState(profile.current_wealth);
  const [draftRetireAge, setDraftRetireAge] = useState(profile.retirement_age);
  const [draftGrowth, setDraftGrowth] = useState(profile.annual_salary_growth * 100);

  // Draft Asset Allocations
  const [draftAssets, setDraftAssets] = useState<AssetAllocation>(assets);

  // Sync draft state with store updates
  useEffect(() => {
    setDraftIncome(profile.monthly_income);
    setDraftExpenses(profile.monthly_expenses);
    setDraftSip(profile.monthly_sip);
    setDraftWealth(profile.current_wealth);
    setDraftRetireAge(profile.retirement_age);
    setDraftGrowth(profile.annual_salary_growth * 100);
    setDraftAssets(assets);
  }, [profile, assets]);

  // Compute live delta preview based on current active tab draft
  const deltaPreview = previewSimulation(
    {
      monthly_income: draftIncome,
      monthly_expenses: draftExpenses,
      monthly_sip: draftSip,
      current_wealth: draftWealth,
      retirement_age: draftRetireAge,
      annual_salary_growth: draftGrowth / 100,
    },
    draftAssets
  );

  const hasUnsavedIncomeChanges =
    draftIncome !== profile.monthly_income ||
    draftExpenses !== profile.monthly_expenses ||
    draftSip !== profile.monthly_sip ||
    draftWealth !== profile.current_wealth ||
    draftRetireAge !== profile.retirement_age ||
    draftGrowth !== profile.annual_salary_growth * 100;

  const hasUnsavedAssetChanges =
    draftAssets.equity !== assets.equity ||
    draftAssets.debt !== assets.debt ||
    draftAssets.gold !== assets.gold ||
    draftAssets.cash !== assets.cash;

  const handleSaveIncomeProfile = () => {
    planStore.updateProfile({
      monthly_income: draftIncome,
      monthly_expenses: draftExpenses,
      monthly_sip: draftSip,
      current_wealth: draftWealth,
      retirement_age: draftRetireAge,
      annual_salary_growth: draftGrowth / 100,
    });
  };

  const handleSaveAssets = () => {
    planStore.updateAssetAllocation(draftAssets);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[11px] font-bold text-[#00dce5] uppercase tracking-wider">
            Twin Parameters & Assumptions
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">My Financial Plan</h1>
        </div>

        {/* Live Delta Preview Badge */}
        {(hasUnsavedIncomeChanges || hasUnsavedAssetChanges) && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#00dce5]/10 border border-[#00dce5]/30 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-[#00dce5]" />
            <span className="text-white/80">Predicted Score:</span>
            <span className="text-white font-mono">{deltaPreview.currentScore}</span>
            <ArrowRight className="w-3 h-3 text-[#00dce5]" />
            <span className="text-[#00dce5] font-bold font-mono">
              {deltaPreview.projectedScore} ({deltaPreview.formattedDelta} pts)
            </span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/5">
        {[
          { id: "income", label: "Income & Expenses", icon: Wallet },
          { id: "assets", label: "Assets & Allocation", icon: PieChart },
          { id: "assumptions", label: "Assumptions & Engine", icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                active
                  ? "border-[#00dce5] text-[#00dce5] bg-[#00dce5]/5"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: INCOME & EXPENSES ================= */}
      {activeTab === "income" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly SIP Card */}
            <div className="bg-[#0e141c]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Monthly SIP (Investment)
                </span>
                <span className="text-lg font-bold text-[#00dce5] font-mono">{formatINR(draftSip)}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={150000}
                step={2500}
                value={draftSip}
                onChange={(e) => setDraftSip(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>₹ 5k/mo</span>
                <span>₹ 75k/mo</span>
                <span>₹ 1.5L/mo</span>
              </div>
            </div>

            {/* Retirement Age Card */}
            <div className="bg-[#0e141c]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Target Retirement Age
                </span>
                <span className="text-lg font-bold text-[#d1bcff] font-mono">Age {draftRetireAge}</span>
              </div>
              <input
                type="range"
                min={40}
                max={65}
                step={1}
                value={draftRetireAge}
                onChange={(e) => setDraftRetireAge(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d1bcff]"
              />
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>Age 40 (FIRE)</span>
                <span>Age 50</span>
                <span>Age 65 (Standard)</span>
              </div>
            </div>
          </div>

          {/* Grid of Click-to-Edit Inputs */}
          <div className="bg-[#0e141c]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Core Cashflow Values</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InlineEditableField
                label="Monthly Take-home Salary"
                value={draftIncome}
                onChange={setDraftIncome}
                unit="₹/mo"
                step={5000}
                isCurrency={true}
              />

              <InlineEditableField
                label="Monthly Household Expenses"
                value={draftExpenses}
                onChange={setDraftExpenses}
                unit="₹/mo"
                step={2500}
                isCurrency={true}
              />

              <InlineEditableField
                label="Current Total Wealth / Portfolio"
                value={draftWealth}
                onChange={setDraftWealth}
                unit="₹"
                step={50000}
                isCurrency={true}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                disabled={!hasUnsavedIncomeChanges}
                onClick={handleSaveIncomeProfile}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                  hasUnsavedIncomeChanges
                    ? "bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 cursor-pointer"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Save Cashflow Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ASSETS & ALLOCATION ================= */}
      {activeTab === "assets" && (
        <AllocationSliders
          assets={draftAssets}
          onChange={setDraftAssets}
          onSave={handleSaveAssets}
          hasUnsavedChanges={hasUnsavedAssetChanges}
          expectedReturn={deltaPreview.result.expected_return}
          expectedVolatility={deltaPreview.result.expected_volatility}
        />
      )}

      {/* ================= TAB 3: ASSUMPTIONS & ENGINE ================= */}
      {activeTab === "assumptions" && (
        <AssumptionsPanel
          marketModel={marketModel}
          decumulationStrategy={decumulationStrategy}
          onConfigChange={(model, strategy) => planStore.setSimulationConfig(model, strategy)}
        />
      )}
    </div>
  );
}
