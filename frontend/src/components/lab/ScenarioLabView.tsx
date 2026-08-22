"use client";

import React, { useState } from "react";
import {
  Plus,
  ShieldAlert,
} from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { planStore } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";
import ScenarioCard from "./ScenarioCard";
import ScenarioCompareChart from "./ScenarioCompareChart";

export default function ScenarioLabView() {
  const store = usePlanStore();
  const { profile, scenarios } = store;

  const [selectedStress, setSelectedStress] = useState<string | null>(null);
  const [stressOutput, setStressOutput] = useState<any>(null);

  // New Scenario Modal
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const [forkName, setForkName] = useState("Aggressive Growth");
  const [forkSip, setForkSip] = useState(profile.monthly_sip + 15000);
  const [forkRetireAge, setForkRetireAge] = useState(profile.retirement_age);
  const [forkEquity, setForkEquity] = useState(70);

  const stressPresets = [
    {
      id: "market_crash",
      name: "2008 Global Crash",
      desc: "Equities plummet -40% in Year 1 with spiked asset correlation",
      impact: "-14% Health Score",
    },
    {
      id: "hyperinflation",
      name: "15% Hyperinflation",
      desc: "Living expenses triple over 8 years due to persistent high inflation",
      impact: "-18% Health Score",
    },
    {
      id: "stagflation",
      name: "Stagflationary Decade",
      desc: "Sub-5% equity returns coupled with 9% consumer price inflation",
      impact: "-12% Health Score",
    },
    {
      id: "career_shock",
      name: "2-Year Career Hiatus",
      desc: "Income stops for 24 months (Age 32-34) with zero SIP contribution",
      impact: "-8% Health Score",
    },
  ];

  const handleRunStress = (presetId: string) => {
    setSelectedStress(presetId);
    setTimeout(() => {
      setStressOutput({
        presetId,
        impactScore: presetId === "market_crash" ? 64 : presetId === "hyperinflation" ? 60 : 66,
        ruinRisk: presetId === "hyperinflation" ? "6.2%" : "2.4%",
        recoveryTime: "3.5 Years",
        recommendation: "Increase emergency liquidity to 12 months expenses and maintain equity SIP discipline.",
      });
    }, 250);
  };

  const handleSaveForkedScenario = () => {
    planStore.addScenario({
      name: forkName,
      description: `SIP ₹${(forkSip / 1000).toFixed(0)}k/mo · Retire @ ${forkRetireAge} · ${forkEquity}% Equity`,
      color: "#38ef7d",
      monthly_sip: forkSip,
      retirement_age: forkRetireAge,
      equity_ratio: forkEquity,
      health_score: Math.min(96, Math.round(78 + (forkSip - profile.monthly_sip) / 4000)),
      p50_terminal: Math.round(48500000 * (1 + (forkSip - profile.monthly_sip) / 35000)),
    });
    setIsForkModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[11px] font-bold text-[#00dce5] uppercase tracking-wider">
            What-If Playground & Compare
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Scenario Lab
          </h1>
        </div>

        <button
          onClick={() => setIsForkModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Fork New Scenario</span>
        </button>
      </div>

      {/* Row 1: Side-by-Side Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((scen) => (
          <ScenarioCard
            key={scen.id}
            scenario={scen}
            onCommit={() => planStore.applyScenarioAsPlan(scen.id)}
          />
        ))}
      </div>

      {/* Row 2: Overlaid Comparison Chart */}
      <ScenarioCompareChart scenarios={scenarios} />

      {/* Row 3: Stress Testing Presets */}
      <section className="bg-[#0e141c]/90 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-base font-bold text-white">Historical & Macro Stress Testing</h3>
            <p className="text-xs text-white/50">Simulate severe market regimes against your digital twin.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stressPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleRunStress(preset.id)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                selectedStress === preset.id
                  ? "bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/10"
                  : "bg-white/5 border-white/5 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">{preset.name}</span>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{preset.desc}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                <span className="text-red-400 font-bold">{preset.impact}</span>
                <span className="text-white/40">Run Stress →</span>
              </div>
            </button>
          ))}
        </div>

        {/* Stress Result Output Box */}
        {stressOutput && (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs space-y-3 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="font-bold text-red-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Stress Impact Evaluation
              </span>
              <span className="font-mono text-white/60">Portfolio Recovery: {stressOutput.recoveryTime}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-3 bg-black/30 rounded-xl">
                <span className="text-white/40 block text-[10px]">Stressed Health Score</span>
                <span className="text-xl font-bold text-red-400">{stressOutput.impactScore}/100</span>
              </div>
              <div className="p-3 bg-black/30 rounded-xl">
                <span className="text-white/40 block text-[10px]">Terminal Ruin Risk</span>
                <span className="text-xl font-bold text-amber-300">{stressOutput.ruinRisk}</span>
              </div>
              <div className="p-3 bg-black/30 rounded-xl">
                <span className="text-white/40 block text-[10px]">Recovery Horizon</span>
                <span className="text-xl font-bold text-white">{stressOutput.recoveryTime}</span>
              </div>
            </div>
            <p className="text-white/80 text-[11px] leading-relaxed pt-1">
              <strong>Twin Copilot Strategy:</strong> {stressOutput.recommendation}
            </p>
          </div>
        )}
      </section>

      {/* ================= FORK SCENARIO MODAL ================= */}
      {isForkModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e141c] border border-white/15 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 animate-fade-in relative">
            <div>
              <span className="text-xs font-bold text-[#00dce5] uppercase tracking-wider">
                What-If Explorer
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">Fork from Active Plan</h2>
              <p className="text-xs text-white/50">Tweak parameters to compare side-by-side against your baseline.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/70">Scenario Title</label>
                <input
                  type="text"
                  value={forkName}
                  onChange={(e) => setForkName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#00dce5]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Monthly SIP</span>
                  <span className="font-mono text-[#00dce5] font-bold">{formatINR(forkSip)}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={150000}
                  step={2500}
                  value={forkSip}
                  onChange={(e) => setForkSip(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Retirement Age</span>
                  <span className="font-mono text-[#d1bcff] font-bold">Age {forkRetireAge}</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={65}
                  step={1}
                  value={forkRetireAge}
                  onChange={(e) => setForkRetireAge(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d1bcff]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Equity Allocation</span>
                  <span className="font-mono text-emerald-400 font-bold">{forkEquity}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={5}
                  value={forkEquity}
                  onChange={(e) => setForkEquity(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsForkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForkedScenario}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-md transition cursor-pointer"
              >
                Add to Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
