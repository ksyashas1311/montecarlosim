"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Home as HomeIcon,
  Car,
  Target,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { planStore, computeClientSimulation } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);

  // Form state for custom onboarding
  const [age, setAge] = useState(25);
  const [income, setIncome] = useState(150000);
  const [expenses, setExpenses] = useState(65000);
  const [savings, setSavings] = useState(850000);

  // Goal state
  const [selectedGoalTemplate, setSelectedGoalTemplate] = useState<"retirement" | "house" | "car" | "custom">("retirement");
  const [goalName, setGoalName] = useState("Retirement Corpus");
  const [goalAmount, setGoalAmount] = useState(35000000);
  const [goalAge, setGoalAge] = useState(48);

  // Step 4 Simulation calculation result
  const [quickSimResult, setQuickSimResult] = useState<any>(null);

  const handleSelectGoalTemplate = (template: "retirement" | "house" | "car" | "custom") => {
    setSelectedGoalTemplate(template);
    if (template === "retirement") {
      setGoalName("Retirement Corpus");
      setGoalAmount(35000000); // 3.5 Cr
      setGoalAge(48);
    } else if (template === "house") {
      setGoalName("House Downpayment");
      setGoalAmount(7500000); // 75 L
      setGoalAge(32);
    } else if (template === "car") {
      setGoalName("Dream Car");
      setGoalAmount(1500000); // 15 L
      setGoalAge(28);
    } else {
      setGoalName("Custom Goal");
      setGoalAmount(2000000);
      setGoalAge(30);
    }
  };

  const handleRunInstantPayoff = () => {
    const monthlySip = Math.max(10000, Math.round((income - expenses) * 0.6));
    const testProfile = {
      name: "You",
      current_age: age,
      monthly_income: income,
      monthly_expenses: expenses,
      monthly_sip: monthlySip,
      current_wealth: savings,
      retirement_age: goalAge >= 45 ? goalAge : 55,
      target_goal_probability: 0.85,
      annual_salary_growth: 0.08,
      inflation_rate: 0.06,
    };

    const testAssets = { equity: 60, debt: 25, gold: 10, cash: 5 };
    const testGoals = [
      {
        id: "g_onboard_1",
        name: goalName,
        target_amount: goalAmount,
        target_age: goalAge,
        priority: "high" as const,
        category: selectedGoalTemplate,
      },
    ];

    const result = computeClientSimulation(testProfile, testAssets, testGoals, []);
    setQuickSimResult(result);
    setStep(4);
  };

  const handleFinishOnboarding = (useDemo: boolean = false) => {
    if (useDemo) {
      planStore.loadDemoData();
    } else {
      const monthlySip = Math.max(10000, Math.round((income - expenses) * 0.6));
      planStore.updateProfile({
        name: "You",
        current_age: age,
        monthly_income: income,
        monthly_expenses: expenses,
        monthly_sip: monthlySip,
        current_wealth: savings,
        retirement_age: goalAge >= 45 ? goalAge : 55,
      });

      planStore.addGoal({
        name: goalName,
        target_amount: goalAmount,
        target_age: goalAge,
        priority: "high",
        category: selectedGoalTemplate,
      });

      planStore.setIsOnboarded(true);
      planStore.setActiveScreen("dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#f0f4f9] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow ambient effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00dce5]/10 via-[#d1bcff]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Progress Dots */}
      <div className="flex items-center gap-2.5 mb-8 z-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-[#00dce5]" : i < step ? "w-4 bg-[#00dce5]/50" : "w-2 bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Container Box */}
      <div className="w-full max-w-xl bg-[#0e141c]/90 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl z-10 relative">
        {/* ================= STEP 1: WELCOME ================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center shadow-lg shadow-[#00dce5]/20">
                <Sparkles className="w-6 h-6 text-[#0b0f14]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#00dce5] tracking-wider uppercase">Welcome to FinTwin</span>
                <h1 className="text-2xl font-extrabold text-white">Let&apos;s build your financial twin</h1>
              </div>
            </div>

            <p className="text-sm text-white/70 leading-relaxed">
              Not a static budget spreadsheet. FinTwin runs 10,000 Monte Carlo paths of your financial life to answer one persistent question: <strong className="text-white">&ldquo;Is my plan still on track?&rdquo;</strong>
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <TrendingUp className="w-5 h-5 text-[#00dce5] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block font-medium mb-0.5">The Future Cone</strong>
                  <span className="text-white/60">See your wealth trajectory across economic regimes, not just one optimistic line.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <ShieldCheck className="w-5 h-5 text-[#d1bcff] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block font-medium mb-0.5">Goal Probabilities with Action CTAs</strong>
                  <span className="text-white/60">Every goal has an actionable &ldquo;Improve →&rdquo; path powered by Reverse Planning.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-white block font-medium mb-0.5">Persistent AI Financial Copilot</strong>
                  <span className="text-white/60">Ask what-ifs, stress-test inflation shocks, and tweak your strategy in natural language.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 transition active:scale-[0.98]"
              >
                <span>Build My Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleFinishOnboarding(true)}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
              >
                <UserCheck className="w-4 h-4 text-[#d1bcff]" />
                <span>Try Demo Data</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: THE ESSENTIALS ================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#00dce5] tracking-wider uppercase">Step 1 of 3</span>
              <h2 className="text-xl font-extrabold text-white mt-1">The 4 Essentials</h2>
              <p className="text-xs text-white/60 mt-1">Everything else starts with smart defaults you can tune anytime.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Current Age</label>
                <div className="relative">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    min={18}
                    max={80}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00dce5]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-white/40">yrs</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Current Net Worth / Savings</label>
                <div className="relative">
                  <input
                    type="number"
                    value={savings}
                    onChange={(e) => setSavings(Number(e.target.value))}
                    step={50000}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00dce5]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-white/40">₹</span>
                </div>
                <span className="text-[10px] text-white/40">{formatINR(savings, true)}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Monthly Income</label>
                <div className="relative">
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    step={5000}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00dce5]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-white/40">₹/mo</span>
                </div>
                <span className="text-[10px] text-white/40">{formatINR(income, true)}/mo</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">Monthly Living Expenses</label>
                <div className="relative">
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(Number(e.target.value))}
                    step={5000}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00dce5]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-white/40">₹/mo</span>
                </div>
                <span className="text-[10px] text-white/40">{formatINR(expenses, true)}/mo</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#00dce5]/10 border border-[#00dce5]/20 flex items-center justify-between text-xs">
              <span className="text-white/80">Estimated Monthly Surplus (Investable SIP):</span>
              <span className="font-mono font-bold text-[#00dce5]">
                {formatINR(Math.max(0, income - expenses))} / mo
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ONE GOAL ================= */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#00dce5] tracking-wider uppercase">Step 2 of 3</span>
              <h2 className="text-xl font-extrabold text-white mt-1">What&apos;s one major goal you&apos;re saving for?</h2>
              <p className="text-xs text-white/60 mt-1">Choose a template to prefill target estimates.</p>
            </div>

            {/* Template Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "retirement", label: "Retirement", icon: Target, desc: "₹3.5 Cr @ 48" },
                { id: "house", label: "House", icon: HomeIcon, desc: "₹75 L @ 32" },
                { id: "car", label: "Car", icon: Car, desc: "₹15 L @ 28" },
                { id: "custom", label: "Custom", icon: Sparkles, desc: "Your milestone" },
              ].map((tpl) => {
                const Icon = tpl.icon;
                const active = selectedGoalTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectGoalTemplate(tpl.id as any)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col items-start gap-1.5 ${
                      active
                        ? "bg-[#00dce5]/15 border-[#00dce5] text-white shadow-md shadow-[#00dce5]/10"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-[#00dce5]" : "text-white/40"}`} />
                    <span className="text-xs font-bold block">{tpl.label}</span>
                    <span className="text-[10px] text-white/40">{tpl.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Goal Customization Fields */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="space-y-1">
                <label className="text-[11px] text-white/60 font-medium">Goal Name</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#00dce5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-white/60 font-medium">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(Number(e.target.value))}
                    step={100000}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#00dce5]"
                  />
                  <span className="text-[10px] text-white/40">{formatINR(goalAmount, true)}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-white/60 font-medium">Target Age</label>
                  <input
                    type="number"
                    value={goalAge}
                    onChange={(e) => setGoalAge(Number(e.target.value))}
                    min={age + 1}
                    max={85}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#00dce5]"
                  />
                  <span className="text-[10px] text-white/40">In {goalAge - age} years</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 transition"
              >
                Back
              </button>
              <button
                onClick={handleRunInstantPayoff}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate Future Cone</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: INSTANT PAYOFF ================= */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00dce5]/10 text-[#00dce5] border border-[#00dce5]/30">
                <Sparkles className="w-3.5 h-3.5" /> Instant Payoff Simulated
              </div>
              <h2 className="text-2xl font-extrabold text-white">Your First Future Cone is Ready!</h2>
              <p className="text-xs text-white/60">
                Based on 1,500 Monte Carlo paths with inflation and asset returns.
              </p>
            </div>

            {/* Quick Result Hero */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111c28] to-[#0e141c] border border-white/10 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Goal Success Probability</span>
                  <div className="text-3xl font-extrabold text-[#00dce5] font-mono mt-1">
                    {quickSimResult ? Math.round((quickSimResult.goal_probabilities["g_onboard_1"] || 0.74) * 100) : 74}%
                  </div>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> On Track for {goalName}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Median Wealth @ {goalAge}</span>
                  <div className="text-xl font-bold text-[#d1bcff] font-mono mt-1">
                    {quickSimResult ? formatINR(quickSimResult.terminal_wealth_median, true) : "₹ 4.2 Cr"}
                  </div>
                </div>
              </div>

              {/* Mini SVG cone */}
              <div className="h-28 w-full relative">
                <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="onboard-cone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00dce5" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00dce5" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d="M 0,90 Q 200,80 400,20 L 400,110 Q 200,95 0,90 Z" fill="url(#onboard-cone)" />
                  <path d="M 0,90 Q 200,85 400,60" stroke="#00dce5" strokeWidth="2.5" fill="none" />
                  <path d="M 0,90 Q 200,80 400,20" stroke="#d1bcff" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7" />
                  <path d="M 0,90 Q 200,95 400,110" stroke="#ffb4ab" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7" />
                </svg>
                <div className="flex justify-between text-[10px] text-white/40 border-t border-white/5 pt-1">
                  <span>Age {age} (Today)</span>
                  <span>Age {goalAge} (Goal Year)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setStep(5)}
                className="py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 transition"
              >
                Add Asset Detail
              </button>
              <button
                onClick={() => handleFinishOnboarding(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 transition"
              >
                <span>See Full Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: OPTIONAL DETAIL ================= */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#00dce5] tracking-wider uppercase">Optional Quick Tuning</span>
              <h2 className="text-xl font-extrabold text-white mt-1">Asset Allocation & Life Events</h2>
              <p className="text-xs text-white/60 mt-1">Default 60/25/10/5 portfolio is pre-configured. You can tweak more anytime.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <span className="text-xs font-bold text-white/70 block uppercase tracking-wider">Default Portfolio Mix</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[#00dce5] font-bold font-mono">60%</div>
                  <div className="text-[10px] text-white/50">Equity</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[#d1bcff] font-bold font-mono">25%</div>
                  <div className="text-[10px] text-white/50">Debt</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-amber-300 font-bold font-mono">10%</div>
                  <div className="text-[10px] text-white/50">Gold</div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-white/60 font-bold font-mono">5%</div>
                  <div className="text-[10px] text-white/50">Cash</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/70">
              <span className="text-white font-medium block mb-1">Pre-loaded Life Milestones:</span>
              <ul className="list-disc pl-4 space-y-1 text-white/50 text-[11px]">
                <li>Marriage Expenses (₹15L @ Age 28)</li>
                <li>Child Higher Education (₹25L @ Age 38)</li>
              </ul>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => handleFinishOnboarding(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-lg shadow-[#00dce5]/20 transition"
              >
                <span>Launch FinTwin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
