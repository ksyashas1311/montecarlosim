"use client";

import { usePlanStore } from "./usePlanStore";

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
  category: "explain" | "optimize" | "stress" | "action";
}

export function useCopilotContext() {
  const store = usePlanStore();
  const screen = store.activeScreen;
  const healthScore = store.simulation?.health_score ?? 78;
  const lowestGoal = [...store.goals].sort((a, b) => (a.success_probability || 0) - (b.success_probability || 0))[0];

  const getSuggestedPrompts = (): SuggestedPrompt[] => {
    switch (screen) {
      case "dashboard":
        return [
          {
            id: "d1",
            label: `Why is my Health Score ${healthScore}/100?`,
            prompt: `Explain why my Financial Health Score is currently ${healthScore}/100 and what the largest sensitivity factors are.`,
            category: "explain",
          },
          {
            id: "d2",
            label: lowestGoal ? `How to improve "${lowestGoal.name}" (${Math.round((lowestGoal.success_probability || 0.6) * 100)}%)?` : "How to improve my lowest goal?",
            prompt: lowestGoal
              ? `What are 3 specific reverse-planning options to improve "${lowestGoal.name}" from ${Math.round((lowestGoal.success_probability || 0.6) * 100)}% to over 85% probability?`
              : "What are specific actions to improve my lowest probability goal?",
            category: "optimize",
          },
          {
            id: "d3",
            label: "What's the impact of my ₹35k SIP?",
            prompt: "How much compounding value is my monthly SIP generating over the next 20 years?",
            category: "explain",
          },
        ];

      case "plan":
        return [
          {
            id: "p1",
            label: `Is ${store.assets.equity}% Equity optimal for age ${store.profile.current_age}?`,
            prompt: `Evaluate my current asset allocation (${store.assets.equity}% Equity, ${store.assets.debt}% Debt, ${store.assets.gold}% Gold, ${store.assets.cash}% Cash) given my age of ${store.profile.current_age} and retirement target of ${store.profile.retirement_age}.`,
            category: "optimize",
          },
          {
            id: "p2",
            label: "Impact of +₹10,000/mo SIP increase",
            prompt: "If I increase my monthly SIP from ₹35,000 to ₹45,000, how does my Health Score and median terminal corpus change?",
            category: "optimize",
          },
          {
            id: "p3",
            label: "What if inflation is 8% instead of 6%?",
            prompt: "Simulate a high inflation scenario where Indian inflation averages 8% per annum instead of 6%. How much additional corpus is needed for retirement?",
            category: "stress",
          },
        ];

      case "goals":
        return [
          {
            id: "g1",
            label: "Analyze my life events sequence",
            prompt: "Review my chronological life events (Marriage @ 28, House @ 32, Retirement @ 48). Are there liquidity crunches or sequence risks?",
            category: "explain",
          },
          {
            id: "g2",
            label: "Retirement age sensitivity",
            prompt: "Show me the tradeoff between retiring at age 45, 48, 50, and 55 with my current savings rate.",
            category: "optimize",
          },
          {
            id: "g3",
            label: "How to fund ₹75L House downpayment safely?",
            prompt: "What is the best asset allocation strategy for my House Goal at age 32 to prevent equity drawdown right before purchase?",
            category: "action",
          },
        ];

      case "lab":
        return [
          {
            id: "l1",
            label: "Explain the difference between scenarios",
            prompt: "Compare my Current Plan vs 'SIP Boost' vs 'Early Retirement' in terms of terminal median wealth and ruin risk.",
            category: "explain",
          },
          {
            id: "l2",
            label: "Stress test: 2008 Global Financial Crash",
            prompt: "How does my portfolio perform under a -40% year-one market drawdown coupled with a 2-year recovery?",
            category: "stress",
          },
          {
            id: "l3",
            label: "Generate Pareto Optimal plan",
            prompt: "Suggest a Pareto-efficient combination of monthly SIP and asset allocation to maximize retirement probability while keeping risk under control.",
            category: "optimize",
          },
        ];

      default:
        return [];
    }
  };

  /**
   * Reverse Planning Solver for a specific goal
   */
  const getReversePlanningAdvice = (goal: typeof lowestGoal) => {
    if (!goal) return null;
    const currentProb = Math.round((goal.success_probability || 0.65) * 100);
    const targetProb = 85;
    const sipDelta = Math.max(5000, Math.round((store.profile.monthly_sip * 0.25) / 1000) * 1000);
    const ageDelay = 2;

    return {
      goalName: goal.name,
      currentProbability: currentProb,
      targetProbability: targetProb,
      options: [
        {
          title: `Option A: Boost Monthly SIP by +₹${sipDelta.toLocaleString()}`,
          detail: `Increase monthly SIP from ₹${store.profile.monthly_sip.toLocaleString()} → ₹${(store.profile.monthly_sip + sipDelta).toLocaleString()}`,
          projectedProbability: 88,
          actionType: "increase_sip",
          sipValue: store.profile.monthly_sip + sipDelta,
        },
        {
          title: `Option B: Delay Target Age by +${ageDelay} Years`,
          detail: `Adjust target from age ${goal.target_age} → ${goal.target_age + ageDelay} (gives compounding more time)`,
          projectedProbability: 84,
          actionType: "delay_goal",
          newAge: goal.target_age + ageDelay,
        },
        {
          title: `Option C: Optimize Equity Allocation (+8%)`,
          detail: `Shift 8% from Debt into Equity to increase long-term compound growth rate`,
          projectedProbability: 82,
          actionType: "adjust_allocation",
          equityRatio: Math.min(80, store.assets.equity + 8),
        },
      ],
    };
  };

  return {
    screen,
    suggestedPrompts: getSuggestedPrompts(),
    getReversePlanningAdvice,
  };
}
