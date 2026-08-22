"use client";

import React from "react";
import { Check } from "lucide-react";
import { AssetAllocation } from "../../store/planStore";

interface AllocationSlidersProps {
  assets: AssetAllocation;
  onChange: (assets: AssetAllocation) => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  expectedReturn: number;
  expectedVolatility: number;
  className?: string;
}

export default function AllocationSliders({
  assets,
  onChange,
  onSave,
  hasUnsavedChanges,
  expectedReturn,
  expectedVolatility,
  className = "",
}: AllocationSlidersProps) {
  const handleSliderChange = (key: keyof AssetAllocation, val: number) => {
    val = Math.max(0, Math.min(100, val));
    const otherKeys = (["equity", "debt", "gold", "cash"] as const).filter((k) => k !== key);
    const oldOtherSum = otherKeys.reduce((sum, k) => sum + assets[k], 0);
    const remaining = 100 - val;

    let nextAssets = { ...assets, [key]: val };
    if (oldOtherSum === 0) {
      nextAssets[otherKeys[0]] = remaining;
    } else {
      otherKeys.forEach((k) => {
        nextAssets[k] = Math.round((assets[k] / oldOtherSum) * remaining);
      });
    }

    const total = nextAssets.equity + nextAssets.debt + nextAssets.gold + nextAssets.cash;
    if (total !== 100) {
      nextAssets.debt += 100 - total;
    }

    onChange(nextAssets);
  };

  return (
    <div
      className={`bg-[#0e141c]/90 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Asset Allocation Mix
          </h3>
          <p className="text-xs text-white/50">
            Sliders auto-rebalance dynamically to maintain 100% total weight.
          </p>
        </div>

        {/* Portfolio Risk/Return Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white/50 block text-[10px]">Expected Return</span>
            <span className="text-[#00dce5] font-bold">
              {(expectedReturn * 100).toFixed(1)}% p.a.
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-white/50 block text-[10px]">Portfolio Volatility</span>
            <span className="text-[#d1bcff] font-bold">
              {(expectedVolatility * 100).toFixed(1)}% σ
            </span>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-5">
        {/* Equity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00dce5]" /> Equity (Domestic & Global Mutual Funds / Stocks)
            </span>
            <span className="font-mono font-bold text-[#00dce5]">{assets.equity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={assets.equity}
            onChange={(e) => handleSliderChange("equity", Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
          />
        </div>

        {/* Debt */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d1bcff]" /> Debt (EPF, PPF, Corporate Bonds, FDs)
            </span>
            <span className="font-mono font-bold text-[#d1bcff]">{assets.debt}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={assets.debt}
            onChange={(e) => handleSliderChange("debt", Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d1bcff]"
          />
        </div>

        {/* Gold */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> Gold & Sovereign Gold Bonds (SGB)
            </span>
            <span className="font-mono font-bold text-amber-300">{assets.gold}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={assets.gold}
            onChange={(e) => handleSliderChange("gold", Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-300"
          />
        </div>

        {/* Cash */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white/60" /> Cash & Liquid Savings
            </span>
            <span className="font-mono font-bold text-white/80">{assets.cash}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={assets.cash}
            onChange={(e) => handleSliderChange("cash", Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/5">
        <button
          disabled={!hasUnsavedChanges}
          onClick={onSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
            hasUnsavedChanges
              ? "bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 cursor-pointer"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Apply Rebalanced Allocation</span>
        </button>
      </div>
    </div>
  );
}
