import React from "react";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message?: string;
  lastUpdatedText?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message = "Live simulation engine unavailable — showing cached forecast.",
  lastUpdatedText = "Calculated recently",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="w-full bg-amber-500/10 border border-amber-500/25 text-amber-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs mb-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{message}</span>
        <span className="text-amber-200/60 flex items-center gap-1 font-mono text-[11px] ml-2">
          <Clock className="w-3 h-3 inline" /> {lastUpdatedText}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 px-2.5 py-1 rounded-md transition"
        >
          <RefreshCw className="w-3 h-3" /> Reconnect
        </button>
      )}
    </div>
  );
}
