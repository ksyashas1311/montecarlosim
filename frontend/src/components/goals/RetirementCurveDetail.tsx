"use client";

import React from "react";

interface RetirementPoint {
  age: number;
  probability: number;
}

interface RetirementCurveDetailProps {
  currentRetirementAge: number;
  retirementCurve: RetirementPoint[];
  onSelectAge: (age: number) => void;
  className?: string;
}

export default function RetirementCurveDetail({
  currentRetirementAge,
  retirementCurve,
  onSelectAge,
  className = "",
}: RetirementCurveDetailProps) {
  return (
    <div
      className={`bg-[#0e141c]/90 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-[#00dce5] uppercase tracking-wider">
            Specialized Retirement Engine
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            Retirement Age-vs-Probability Curve
          </h3>
          <p className="text-xs text-white/50">
            Click any age pill to see how adjusting your retirement horizon impacts success probability.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-white/40 uppercase font-mono block">
            Target Retirement Age
          </span>
          <span className="text-lg font-bold text-[#00dce5] font-mono">
            Age {currentRetirementAge}
          </span>
        </div>
      </div>

      {/* Age Probability Badges Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
        {retirementCurve.map((point) => {
          const isSelected = currentRetirementAge === point.age;
          const prob = Math.round(point.probability * 100);
          return (
            <button
              key={point.age}
              onClick={() => onSelectAge(point.age)}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                isSelected
                  ? "bg-[#00dce5]/15 border-[#00dce5] shadow-lg shadow-[#00dce5]/10 scale-105"
                  : "bg-white/5 border-white/5 hover:border-white/20"
              }`}
            >
              <span className="text-xs font-bold text-white font-mono">Age {point.age}</span>
              <span
                className={`text-sm font-black font-mono ${
                  prob >= 80 ? "text-emerald-400" : prob >= 50 ? "text-[#00dce5]" : "text-amber-400"
                }`}
              >
                {prob}%
              </span>
              <span className="text-[9px] text-white/40 uppercase">
                {prob >= 80 ? "High" : prob >= 50 ? "Moderate" : "Stretched"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
