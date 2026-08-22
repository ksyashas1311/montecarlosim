"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Settings2 } from "lucide-react";
import { PlanState } from "../../store/planStore";

interface AssumptionsPanelProps {
  marketModel: PlanState["marketModel"];
  decumulationStrategy: PlanState["decumulationStrategy"];
  onConfigChange: (model: PlanState["marketModel"], strategy: PlanState["decumulationStrategy"]) => void;
  className?: string;
}

export default function AssumptionsPanel({
  marketModel,
  decumulationStrategy,
  onConfigChange,
  className = "",
}: AssumptionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`bg-[#0e141c]/90 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden transition ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#00dce5]">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Advanced Model Assumptions & Withdrawal Rules
            </h3>
            <p className="text-xs text-white/50">
              Regime switching Markov chains, jump diffusion fat tails, and decumulation rules.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#00dce5] font-semibold">
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-white/5 space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80">Market Return Model</label>
              <select
                value={marketModel}
                onChange={(e) => onConfigChange(e.target.value as any, decumulationStrategy)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00dce5]"
              >
                <option value="regime_switching" className="bg-[#0b0f14]">
                  Regime Switching (Bull / Bear / Stagflation Markov Chains)
                </option>
                <option value="jump_diffusion" className="bg-[#0b0f14]">
                  Merton Jump Diffusion (Fat Tails & Flash Crashes)
                </option>
                <option value="gbm" className="bg-[#0b0f14]">
                  Geometric Brownian Motion (Log-Normal Standard)
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80">Decumulation Withdrawal Rule</label>
              <select
                value={decumulationStrategy}
                onChange={(e) => onConfigChange(marketModel, e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00dce5]"
              >
                <option value="guyton_klinger" className="bg-[#0b0f14]">
                  Guyton-Klinger Guardrails (Adaptive Inflation Freezes & Trims)
                </option>
                <option value="constant_percentage" className="bg-[#0b0f14]">
                  Constant 4% Real Rule (Fixed Inflation Adjusted)
                </option>
                <option value="vanguard_dynamic" className="bg-[#0b0f14]">
                  Vanguard Dynamic Spending (Ceiling & Floor Bands)
                </option>
              </select>
            </div>
          </div>

          {/* Explicit Disclaimer Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-200 block">Model Assumptions Disclaimer:</strong>
              <p className="leading-relaxed text-[11px] text-amber-200/70">
                These return and volatility assumptions represent mathematical parameters you control to simulate potential future regimes. They are not guaranteed returns or financial advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
