import React from "react";

export function formatINR(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹ 0";

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (abs >= 10000000) {
      const cr = abs / 10000000;
      return `${sign}₹ ${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      const l = abs / 100000;
      return `${sign}₹ ${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} L`;
    }
    if (abs >= 1000) {
      const k = abs / 1000;
      return `${sign}₹ ${k.toFixed(0)}k`;
    }
    return `${sign}₹ ${abs.toLocaleString("en-IN")}`;
  }

  return "₹ " + Math.round(amount).toLocaleString("en-IN");
}

export function formatPercent(val: number, decimals: number = 0): string {
  return `${(val * 100).toFixed(decimals)}%`;
}

interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  className?: string;
}

export default function CurrencyDisplay({ amount, compact = false, className = "" }: CurrencyDisplayProps) {
  return <span className={className}>{formatINR(amount, compact)}</span>;
}
