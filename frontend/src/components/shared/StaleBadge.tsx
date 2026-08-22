import React from "react";
import { Loader2 } from "lucide-react";

interface StaleBadgeProps {
  isSimulating: boolean;
  className?: string;
}

export default function StaleBadge({ isSimulating, className = "" }: StaleBadgeProps) {
  if (!isSimulating) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#00dce5]/10 text-[#00dce5] border border-[#00dce5]/30 animate-pulse ${className}`}
    >
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>Recalculating...</span>
    </div>
  );
}
