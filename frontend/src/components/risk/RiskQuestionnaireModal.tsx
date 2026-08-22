"use client";

import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { riskApi, RiskProfileDto } from "../../lib/api";
import { planStore } from "../../store/planStore";

interface RiskQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialResponses?: {
    market_decline?: number;
    investment_objective?: number;
    volatility_comfort?: number;
    return_preference?: number;
    financial_stability?: number;
  };
  onSuccess?: (profile: RiskProfileDto) => void;
}

const QUESTIONS = [
  {
    id: "market_decline",
    title: "Reaction to Market Decline",
    question: "If your investment portfolio lost 20% of its value during a market downturn over a few months, what would you most likely do?",
    subtitle: "Evaluates your psychological loss aversion and panic-selling risk.",
    options: [
      { value: 1, label: "Sell all investments immediately to avoid further losses", detail: "Maximum risk aversion · Capital preservation is essential" },
      { value: 2, label: "Sell some investments to cut risk and reduce anxiety", detail: "Conservative reaction · Cautious about prolonged downturns" },
      { value: 3, label: "Hold and wait patiently for market recovery", detail: "Disciplined neutral · Comfortable staying the course" },
      { value: 4, label: "Continue investing normally according to schedule", detail: "Growth-oriented · Views dips as part of normal market cycles" },
      { value: 5, label: "Invest significantly more to buy discounted assets", detail: "Aggressive value-seeking · Strong opportunistic mindset" },
    ],
  },
  {
    id: "investment_objective",
    title: "Primary Investment Objective",
    question: "What is your primary investment objective for your accumulated capital?",
    subtitle: "Clarifies your target tradeoff between growth and capital stability.",
    options: [
      { value: 1, label: "Capital Preservation", detail: "Protect nominal value at all costs with near-zero downside" },
      { value: 2, label: "Stable Income Generation", detail: "Generate predictable cash flow with low capital fluctuation" },
      { value: 3, label: "Balanced Growth & Stability", detail: "Moderate capital growth while buffering against volatility" },
      { value: 4, label: "Long-Term Growth", detail: "Outpace inflation and maximize equity compounding over time" },
      { value: 5, label: "Maximum Long-Term Growth", detail: "Aggressive wealth accumulation with tolerance for high drawdowns" },
    ],
  },
  {
    id: "volatility_comfort",
    title: "Comfort with Portfolio Volatility",
    question: "How comfortable are you with seeing significant month-to-month fluctuations in your net worth?",
    subtitle: "Measures emotional resilience to paper losses.",
    options: [
      { value: 1, label: "Very uncomfortable", detail: "Any noticeable dip causes stress and worry" },
      { value: 2, label: "Uncomfortable", detail: "Prefer predictable, smooth trajectory over sporadic high returns" },
      { value: 3, label: "Neutral", detail: "Accept moderate volatility as the natural price of market investing" },
      { value: 4, label: "Comfortable", detail: "Comfortable with swings as long as long-term trajectory is up" },
      { value: 5, label: "Very comfortable", detail: "Embrace volatility as an engine for compounding returns" },
    ],
  },
  {
    id: "return_preference",
    title: "Risk vs. Return Tradeoff",
    question: "Which hypothetical 1-year portfolio outcome best aligns with your expectations?",
    subtitle: "Tests your willingness to absorb downside in exchange for upside.",
    options: [
      { value: 1, label: "Low Risk: +4% Gain in good years / 0% Drop in bad years", detail: "Safe, fixed-income orientation" },
      { value: 2, label: "Conservative: +8% Gain in good years / -3% Drop in bad years", detail: "Inflation beating with minimal downside" },
      { value: 3, label: "Balanced: +14% Gain in good years / -8% Drop in bad years", detail: "Equally balanced upside and downside" },
      { value: 4, label: "Growth: +22% Gain in good years / -16% Drop in bad years", detail: "Strong compounding with moderate corrections" },
      { value: 5, label: "Aggressive: +35% Gain in good years / -28% Drop in bad years", detail: "High-octane growth with deep drawdowns" },
    ],
  },
  {
    id: "financial_stability",
    title: "Financial Stability & Security",
    question: "How would you describe the stability of your current income and emergency buffer?",
    subtitle: "Self-assesses your personal safety net and cash flow predictability.",
    options: [
      { value: 1, label: "Unpredictable / variable earnings with minimal buffer", detail: "High cash flow vulnerability" },
      { value: 2, label: "Somewhat stable, but limited emergency reserves", detail: "Manageable expenses with thin safety cushion" },
      { value: 3, label: "Moderately stable with steady monthly income", detail: "Standard emergency reserve in place" },
      { value: 4, label: "Very stable career with comfortable cash surplus", detail: "Strong job security and healthy savings rate" },
      { value: 5, label: "Exceptional stability & deep multi-year safety net", detail: "Recession-resilient income and substantial assets" },
    ],
  },
];

export default function RiskQuestionnaireModal({
  isOpen,
  onClose,
  initialResponses,
  onSuccess,
}: RiskQuestionnaireModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({
    market_decline: initialResponses?.market_decline ?? 3,
    investment_objective: initialResponses?.investment_objective ?? 3,
    volatility_comfort: initialResponses?.volatility_comfort ?? 3,
    return_preference: initialResponses?.return_preference ?? 3,
    financial_stability: initialResponses?.financial_stability ?? 3,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentQ = QUESTIONS[currentStep];
  const totalSteps = QUESTIONS.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleSelectOption = (value: number) => {
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        market_decline: responses.market_decline,
        investment_objective: responses.investment_objective,
        volatility_comfort: responses.volatility_comfort,
        return_preference: responses.return_preference,
        financial_stability: responses.financial_stability,
      };

      const result = await riskApi.submitQuestionnaire(payload);
      planStore.setRiskProfile(result);
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to calculate risk assessment";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0e141c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Step Progress */}
        <div className="p-6 border-b border-white/5 bg-[#0b0f14]/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center text-[#0b0f14] shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Risk Tolerance Questionnaire
                </h3>
                <span className="text-[10px] text-white/40 font-mono">
                  Step {currentStep + 1} of {totalSteps} · Multi-Dimensional Assessment
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex gap-1">
            {QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  idx < currentStep
                    ? "bg-[#00dce5]"
                    : idx === currentStep
                    ? "bg-gradient-to-r from-[#00dce5] to-[#d1bcff]"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Question & Option Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <span className="text-[11px] font-bold text-[#00dce5] uppercase tracking-wider">
              {currentQ.title}
            </span>
            <h4 className="text-base sm:text-lg font-extrabold text-white mt-1 leading-snug">
              {currentQ.question}
            </h4>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">{currentQ.subtitle}</p>
          </div>

          {/* Options List */}
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = responses[currentQ.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    isSelected
                      ? "bg-[#00dce5]/10 border-[#00dce5] shadow-lg shadow-[#00dce5]/5"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? "border-[#00dce5] bg-[#00dce5] text-[#0b0f14]"
                          : "border-white/30 bg-transparent"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          isSelected ? "text-[#00dce5]" : "text-white"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-white/40 mt-0.5 block leading-tight">
                        {opt.detail}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-white/30 shrink-0">
                    +{opt.value * 20} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-6 border-t border-white/5 bg-[#0b0f14]/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              currentStep === 0
                ? "opacity-30 cursor-not-allowed text-white/40"
                : "text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-3">
            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#00dce5] to-[#d1bcff] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 hover:brightness-110 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#0b0f14] border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Twin...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Risk Profile</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#00dce5] text-[#0b0f14] shadow-md shadow-[#00dce5]/20 hover:bg-[#00c5cd] active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
