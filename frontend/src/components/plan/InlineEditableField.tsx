"use client";

import React, { useState } from "react";
import { formatINR } from "../shared/CurrencyFormat";

interface InlineEditableFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  isCurrency?: boolean;
  className?: string;
}

export default function InlineEditableField({
  label,
  value,
  onChange,
  unit = "",
  step = 1000,
  min = 0,
  max,
  isCurrency = false,
  className = "",
}: InlineEditableFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium text-white/60">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00dce5] transition"
        />
        {unit && (
          <span className="absolute right-3 top-2.5 text-xs text-white/40 font-mono">{unit}</span>
        )}
      </div>
      {isCurrency && (
        <span className="text-[10px] text-white/40 block font-mono">
          {formatINR(value, true)} {unit.includes("/mo") ? "/ month" : ""}
        </span>
      )}
    </div>
  );
}
