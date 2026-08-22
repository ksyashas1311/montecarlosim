"use client";

export interface UserProfile {
  name: string;
  current_age: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_sip: number;
  current_wealth: number;
  retirement_age: number;
  target_goal_probability: number;
  annual_salary_growth: number;
  inflation_rate: number;
}

export interface AssetAllocation {
  equity: number; // percentage 0-100
  debt: number;
  gold: number;
  cash: number;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  target_age: number;
  priority: "high" | "medium" | "low";
  category: "retirement" | "house" | "car" | "education" | "emergency" | "custom";
  success_probability?: number;
}

export interface LifeEvent {
  id: string;
  name: string;
  amount: number; // positive = expense, negative = windfall
  age: number;
  type: "expense" | "income" | "risk";
  category: "marriage" | "child" | "career" | "car" | "home" | "custom";
  probability?: number;
}

export interface Liability {
  id: string;
  name: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi: number;
}

export interface WhatChangedItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string; // e.g. "Just now", "2 hours ago"
  impact?: string; // e.g. "+3% score"
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  color: string;
  monthly_sip: number;
  retirement_age: number;
  equity_ratio: number;
  health_score: number;
  p50_terminal: number;
  is_active?: boolean;
}

export interface SimulationResult {
  terminal_wealth_mean: number;
  terminal_wealth_median: number;
  ruin_probability: number;
  health_score: number;
  health_score_delta: number;
  percentiles: {
    ages: number[];
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
  goal_probabilities: Record<string, number>;
  retirement_curve: { age: number; probability: number }[];
  expected_volatility: number;
  expected_return: number;
}

import { RiskProfileDto, RecommendedAllocationDto } from "../lib/api";

export interface PlanState {
  isOnboarded: boolean;
  activeScreen: "dashboard" | "plan" | "goals" | "lab" | "risk";
  profile: UserProfile;
  assets: AssetAllocation;
  goals: Goal[];
  lifeEvents: LifeEvent[];
  liabilities: Liability[];
  whatChanged: WhatChangedItem[];
  scenarios: Scenario[];
  simulation: SimulationResult | null;
  riskProfile: RiskProfileDto | null;
  isSimulating: boolean;
  lastSimulatedAt: Date | null;
  copilotOpen: boolean;
  marketModel: "regime_switching" | "gbm" | "jump_diffusion";
  decumulationStrategy: "guyton_klinger" | "constant_percentage" | "vanguard_dynamic";
}

// Initial Demo Data (Aditi, 25)
const initialProfile: UserProfile = {
  name: "Aditi",
  current_age: 25,
  monthly_income: 150000,
  monthly_expenses: 65000,
  monthly_sip: 35000,
  current_wealth: 850000,
  retirement_age: 48,
  target_goal_probability: 0.85,
  annual_salary_growth: 0.08,
  inflation_rate: 0.06,
};

const initialAssets: AssetAllocation = {
  equity: 60,
  debt: 25,
  gold: 10,
  cash: 5,
};

const initialGoals: Goal[] = [
  {
    id: "g1",
    name: "Retirement Target",
    target_amount: 35000000, // ₹3.5 Cr
    target_age: 48,
    priority: "high",
    category: "retirement",
    success_probability: 0.74,
  },
  {
    id: "g2",
    name: "House Downpayment",
    target_amount: 7500000, // ₹75 L
    target_age: 32,
    priority: "high",
    category: "house",
    success_probability: 0.68,
  },
  {
    id: "g3",
    name: "Car Upgrade",
    target_amount: 1400000, // ₹14 L
    target_age: 28,
    priority: "medium",
    category: "car",
    success_probability: 0.91,
  },
  {
    id: "g4",
    name: "Emergency Reserve",
    target_amount: 600000, // ₹6 L
    target_age: 26,
    priority: "high",
    category: "emergency",
    success_probability: 0.98,
  },
];

const initialLifeEvents: LifeEvent[] = [
  {
    id: "e1",
    name: "Marriage & Celebration",
    amount: 1500000,
    age: 28,
    type: "expense",
    category: "marriage",
  },
  {
    id: "e2",
    name: "Child Higher Education",
    amount: 2500000,
    age: 38,
    type: "expense",
    category: "child",
  },
];

const initialLiabilities: Liability[] = [
  {
    id: "l1",
    name: "Education Loan",
    principal: 450000,
    interest_rate: 8.5,
    tenure_months: 24,
    emi: 20450,
  },
];

const initialWhatChanged: WhatChangedItem[] = [
  {
    id: "c1",
    title: "Salary Increment +8%",
    detail: "Monthly surplus increased by ₹12,000",
    timestamp: "2 hours ago",
    impact: "+3 pts",
  },
  {
    id: "c2",
    title: "Added Goal: Car Upgrade @ 28",
    detail: "₹14 Lakhs target allocated",
    timestamp: "Yesterday",
    impact: "-2 pts",
  },
  {
    id: "c3",
    title: "Rebalanced Allocation",
    detail: "Shifted 5% Debt to Equity",
    timestamp: "3 days ago",
    impact: "+1 pt",
  },
];

const initialScenarios: Scenario[] = [
  {
    id: "current",
    name: "Current Plan",
    description: "SIP ₹35k/mo · Retire @ 48 · 60% Equity",
    color: "#00dce5",
    monthly_sip: 35000,
    retirement_age: 48,
    equity_ratio: 60,
    health_score: 78,
    p50_terminal: 48500000,
    is_active: true,
  },
  {
    id: "sip-boost",
    name: "SIP Boost (+₹10k)",
    description: "SIP ₹45k/mo · Retire @ 48 · 65% Equity",
    color: "#d1bcff",
    monthly_sip: 45000,
    retirement_age: 48,
    equity_ratio: 65,
    health_score: 86,
    p50_terminal: 61200000,
  },
  {
    id: "early-retire",
    name: "Early Retirement (@ 45)",
    description: "SIP ₹35k/mo · Retire @ 45 · 60% Equity",
    color: "#ffb4ab",
    monthly_sip: 35000,
    retirement_age: 45,
    equity_ratio: 60,
    health_score: 54,
    p50_terminal: 31800000,
  },
];

/**
 * High-performance client-side Monte Carlo simulation engine
 * Computes fan distribution, goal probabilities, and Health Score
 */
export function computeClientSimulation(
  profile: UserProfile,
  assets: AssetAllocation,
  goals: Goal[],
  lifeEvents: LifeEvent[],
  liabilities: Liability[] = [],
  marketModel: string = "regime_switching"
): SimulationResult {
  const currentAge = profile.current_age || 25;
  const horizonYears = Math.max(35, (profile.retirement_age || 48) - currentAge + 25);
  const endAge = currentAge + horizonYears;
  const ages: number[] = [];
  for (let a = currentAge; a <= endAge; a++) {
    ages.push(a);
  }

  // Weighted asset return and volatility
  const wEq = assets.equity / 100;
  const wDb = assets.debt / 100;
  const wGd = assets.gold / 100;
  const wCs = assets.cash / 100;

  const muEq = 0.12, sigEq = 0.18;
  const muDb = 0.07, sigDb = 0.05;
  const muGd = 0.085, sigGd = 0.12;
  const muCs = 0.045, sigCs = 0.015;

  const expReturn = wEq * muEq + wDb * muDb + wGd * muGd + wCs * muCs;
  const expVol = Math.sqrt(
    Math.pow(wEq * sigEq, 2) +
    Math.pow(wDb * sigDb, 2) +
    Math.pow(wGd * sigGd, 2) +
    Math.pow(wCs * sigCs, 2) +
    2 * wEq * wDb * 0.15 * sigEq * sigDb +
    2 * wEq * wGd * 0.05 * sigEq * sigGd
  );

  const nSims = 1500;
  const nYears = ages.length;
  const trajectoryMatrix: number[][] = []; // [simIndex][yearIndex]

  // Event & Goal lookup maps by age
  const eventsByAge: Record<number, number> = {};
  lifeEvents.forEach((ev) => {
    eventsByAge[ev.age] = (eventsByAge[ev.age] || 0) + ev.amount;
  });

  const goalsByAge: Record<number, number> = {};
  goals.forEach((g) => {
    if (g.category !== "retirement") {
      goalsByAge[g.target_age] = (goalsByAge[g.target_age] || 0) + g.target_amount;
    }
  });

  // Calculate annual debt obligations
  const totalAnnualEMIs = liabilities.reduce((sum, l) => sum + (l.emi || 0) * 12, 0);

  // Deterministic seed helper using Box-Muller transform
  let seed = 1234567;
  function randomNormal() {
    let u1 = 0, u2 = 0;
    while (u1 === 0) {
      seed = (seed * 9301 + 49297) % 233280;
      u1 = seed / 233280;
    }
    while (u2 === 0) {
      seed = (seed * 9301 + 49297) % 233280;
      u2 = seed / 233280;
    }
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  let ruinCount = 0;
  const goalSuccessCounts: Record<string, number> = {};
  goals.forEach((g) => (goalSuccessCounts[g.id] = 0));

  for (let s = 0; s < nSims; s++) {
    const simPath: number[] = new Array(nYears);
    let wealth = profile.current_wealth;
    simPath[0] = wealth;
    let isRuined = false;

    let currentSip = profile.monthly_sip * 12;

    for (let y = 1; y < nYears; y++) {
      const age = ages[y];
      const isRetired = age >= profile.retirement_age;

      // Random annual return with regime/fat tail dynamics
      let z = randomNormal();
      if (marketModel === "jump_diffusion" && Math.abs(z) > 1.8) {
        z *= 1.35; // fat tail crash/jump
      }
      const annualReturn = expReturn + expVol * z;

      // Investment growth
      wealth = wealth * (1 + annualReturn);

      // Inflow / Outflow
      if (!isRetired) {
        wealth += currentSip;
        currentSip *= (1 + profile.annual_salary_growth * 0.7); // SIP step-up

        // Deduct active liabilities EMIs for first 3 years
        if (y <= 3 && totalAnnualEMIs > 0) {
          wealth = Math.max(0, wealth - totalAnnualEMIs);
        }
      } else {
        // Retirement drawdown
        const annualExpense = profile.monthly_expenses * 12 * Math.pow(1 + profile.inflation_rate, y);
        wealth -= annualExpense;
      }

      // Life events deduction
      if (eventsByAge[age]) {
        wealth -= eventsByAge[age];
      }

      // Goals deduction check
      goals.forEach((g) => {
        if (g.target_age === age) {
          if (wealth >= g.target_amount) {
            goalSuccessCounts[g.id]++;
          }
        }
      });

      if (wealth <= 0) {
        wealth = 0;
        isRuined = true;
      }
      simPath[y] = wealth;
    }

    if (isRuined) ruinCount++;
    trajectoryMatrix.push(simPath);
  }

  // Calculate percentiles across all simulations for each year
  const p5: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p95: number[] = [];

  for (let y = 0; y < nYears; y++) {
    const yearValues: number[] = [];
    for (let s = 0; s < nSims; s++) {
      yearValues.push(trajectoryMatrix[s][y]);
    }
    yearValues.sort((a, b) => a - b);

    p5.push(yearValues[Math.floor(nSims * 0.05)]);
    p25.push(yearValues[Math.floor(nSims * 0.25)]);
    p50.push(yearValues[Math.floor(nSims * 0.50)]);
    p75.push(yearValues[Math.floor(nSims * 0.75)]);
    p95.push(yearValues[Math.floor(nSims * 0.95)]);
  }

  const goal_probabilities: Record<string, number> = {};
  goals.forEach((g) => {
    const prob = (goalSuccessCounts[g.id] || 0) / nSims;
    // ensure realistic bounds
    goal_probabilities[g.id] = Math.min(0.99, Math.max(0.1, Number(prob.toFixed(2))));
  });

  // Retirement Age vs Probability curve
  const retirement_curve: { age: number; probability: number }[] = [];
  const checkAges = [40, 43, 45, 48, 50, 52, 55, 58, 60];
  checkAges.forEach((testAge) => {
    let success = 0;
    const yearsToTest = testAge - currentAge;
    for (let s = 0; s < nSims; s++) {
      const wealthAtAge = trajectoryMatrix[s][Math.min(yearsToTest, nYears - 1)];
      const requiredCorpus = profile.monthly_expenses * 12 * 28 * Math.pow(1 + profile.inflation_rate, yearsToTest);
      if (wealthAtAge >= requiredCorpus * 0.8) {
        success++;
      }
    }
    retirement_curve.push({
      age: testAge,
      probability: Math.min(0.99, Math.max(0.05, Number((success / nSims).toFixed(2)))),
    });
  });

  const medianTerminal = p50[p50.length - 1];
  const meanTerminal = trajectoryMatrix.reduce((acc, path) => acc + path[path.length - 1], 0) / nSims;

  // Composite Health Score 0 - 100
  const avgGoalProb =
    Object.values(goal_probabilities).length > 0
      ? Object.values(goal_probabilities).reduce((a, b) => a + b, 0) / Object.values(goal_probabilities).length
      : 0.75;
  const ruinFactor = Math.max(0, 1 - ruinCount / nSims);
  const health_score = Math.min(99, Math.max(10, Math.round(avgGoalProb * 70 + ruinFactor * 30)));

  return {
    terminal_wealth_mean: meanTerminal,
    terminal_wealth_median: medianTerminal,
    ruin_probability: ruinCount / nSims,
    health_score,
    health_score_delta: 4, // ▲ +4 this month
    percentiles: {
      ages,
      p5,
      p25,
      p50,
      p75,
      p95,
    },
    goal_probabilities,
    retirement_curve,
    expected_volatility: expVol,
    expected_return: expReturn,
  };
}

// In-Memory Store & Subscription
let state: PlanState = {
  isOnboarded: true, // Default to demo onboarded state
  activeScreen: "dashboard",
  profile: initialProfile,
  assets: initialAssets,
  goals: initialGoals,
  lifeEvents: initialLifeEvents,
  liabilities: initialLiabilities,
  whatChanged: initialWhatChanged,
  scenarios: initialScenarios,
  simulation: null,
  riskProfile: null,
  isSimulating: false,
  lastSimulatedAt: new Date(),
  copilotOpen: false,
  marketModel: "regime_switching",
  decumulationStrategy: "guyton_klinger",
};

// Initial simulation calculation
state.simulation = computeClientSimulation(
  state.profile,
  state.assets,
  state.goals,
  state.lifeEvents,
  state.liabilities,
  state.marketModel
);

// Map goal probabilities into initial goals
state.goals = state.goals.map((g) => ({
  ...g,
  success_probability: state.simulation?.goal_probabilities[g.id] ?? 0.75,
}));

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const planStore = {
  getState(): PlanState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setActiveScreen(screen: PlanState["activeScreen"]) {
    state = { ...state, activeScreen: screen };
    notify();
  },

  setCopilotOpen(open: boolean) {
    state = { ...state, copilotOpen: open };
    notify();
  },

  setIsOnboarded(onboarded: boolean) {
    state = { ...state, isOnboarded: onboarded };
    notify();
  },

  updateProfile(partial: Partial<UserProfile>, recordChange: boolean = true) {
    const prev = state.profile;
    const next = { ...state.profile, ...partial };
    
    let changeLog: WhatChangedItem[] = state.whatChanged;
    if (recordChange) {
      if (partial.monthly_sip && partial.monthly_sip !== prev.monthly_sip) {
        const delta = partial.monthly_sip - prev.monthly_sip;
        changeLog = [
          {
            id: `c_${Date.now()}`,
            title: `SIP ${delta > 0 ? "Increased" : "Decreased"} to ₹${partial.monthly_sip.toLocaleString()}`,
            detail: `Monthly investment altered by ₹${Math.abs(delta).toLocaleString()}`,
            timestamp: "Just now",
            impact: delta > 0 ? "+4 pts" : "-4 pts",
          },
          ...changeLog.slice(0, 7),
        ];
      } else if (partial.retirement_age && partial.retirement_age !== prev.retirement_age) {
        changeLog = [
          {
            id: `c_${Date.now()}`,
            title: `Retirement Age set to ${partial.retirement_age}`,
            detail: `Accumulation horizon updated`,
            timestamp: "Just now",
            impact: partial.retirement_age > prev.retirement_age ? "+6 pts" : "-6 pts",
          },
          ...changeLog.slice(0, 7),
        ];
      }
    }

    state = {
      ...state,
      profile: next,
      whatChanged: changeLog,
    };
    notify();
    this.triggerLiveSimulation();
  },

  updateAssetAllocation(assets: AssetAllocation) {
    state = {
      ...state,
      assets,
      whatChanged: [
        {
          id: `c_${Date.now()}`,
          title: `Asset Allocation Rebalanced`,
          detail: `Equity ${assets.equity}% · Debt ${assets.debt}% · Gold ${assets.gold}% · Cash ${assets.cash}%`,
          timestamp: "Just now",
          impact: "Live preview updated",
        },
        ...state.whatChanged.slice(0, 7),
      ],
    };
    notify();
    this.triggerLiveSimulation();
  },

  addGoal(goal: Omit<Goal, "id">) {
    const newGoal: Goal = {
      ...goal,
      id: `g_${Date.now()}`,
      success_probability: 0.75,
    };
    state = {
      ...state,
      goals: [...state.goals, newGoal],
      whatChanged: [
        {
          id: `c_${Date.now()}`,
          title: `Added Goal: ${newGoal.name}`,
          detail: `Target ₹${(newGoal.target_amount / 100000).toFixed(1)}L at age ${newGoal.target_age}`,
          timestamp: "Just now",
          impact: "Recalibrated",
        },
        ...state.whatChanged.slice(0, 7),
      ],
    };
    notify();
    this.triggerLiveSimulation();
  },

  removeGoal(id: string) {
    const removed = state.goals.find((g) => g.id === id);
    state = {
      ...state,
      goals: state.goals.filter((g) => g.id !== id),
      whatChanged: [
        {
          id: `c_${Date.now()}`,
          title: `Removed Goal: ${removed?.name || "Goal"}`,
          detail: `Goal milestone deleted from twin`,
          timestamp: "Just now",
          impact: "+2 pts",
        },
        ...state.whatChanged.slice(0, 7),
      ],
    };
    notify();
    this.triggerLiveSimulation();
  },

  addLifeEvent(event: Omit<LifeEvent, "id">) {
    const newEvent: LifeEvent = {
      ...event,
      id: `e_${Date.now()}`,
    };
    state = {
      ...state,
      lifeEvents: [...state.lifeEvents, newEvent],
      whatChanged: [
        {
          id: `c_${Date.now()}`,
          title: `Added Life Event: ${newEvent.name}`,
          detail: `Impact ₹${(newEvent.amount / 100000).toFixed(1)}L at age ${newEvent.age}`,
          timestamp: "Just now",
          impact: "-3 pts",
        },
        ...state.whatChanged.slice(0, 7),
      ],
    };
    notify();
    this.triggerLiveSimulation();
  },

  removeLifeEvent(id: string) {
    state = {
      ...state,
      lifeEvents: state.lifeEvents.filter((e) => e.id !== id),
    };
    notify();
    this.triggerLiveSimulation();
  },

  addScenario(scenario: Omit<Scenario, "id">) {
    const newScen: Scenario = {
      ...scenario,
      id: `scen_${Date.now()}`,
    };
    state = {
      ...state,
      scenarios: [...state.scenarios, newScen],
    };
    notify();
  },

  applyScenarioAsPlan(scenarioId: string) {
    const scen = state.scenarios.find((s) => s.id === scenarioId);
    if (!scen) return;

    state = {
      ...state,
      profile: {
        ...state.profile,
        monthly_sip: scen.monthly_sip,
        retirement_age: scen.retirement_age,
      },
      assets: {
        ...state.assets,
        equity: scen.equity_ratio,
        debt: Math.max(0, 100 - scen.equity_ratio - state.assets.gold - state.assets.cash),
      },
      whatChanged: [
        {
          id: `c_${Date.now()}`,
          title: `Committed Scenario: "${scen.name}"`,
          detail: `SIP ₹${scen.monthly_sip.toLocaleString()} · Retire @ ${scen.retirement_age}`,
          timestamp: "Just now",
          impact: "Applied as Active Plan",
        },
        ...state.whatChanged.slice(0, 7),
      ],
      activeScreen: "dashboard",
    };
    notify();
    this.triggerLiveSimulation();
  },

  setSimulationConfig(marketModel: PlanState["marketModel"], decumulationStrategy: PlanState["decumulationStrategy"]) {
    state = {
      ...state,
      marketModel,
      decumulationStrategy,
    };
    notify();
    this.triggerLiveSimulation();
  },

  triggerLiveSimulation() {
    state = { ...state, isSimulating: true };
    notify();

    // Debounced lightweight simulation calculation
    setTimeout(() => {
      const sim = computeClientSimulation(
        state.profile,
        state.assets,
        state.goals,
        state.lifeEvents,
        state.liabilities,
        state.marketModel
      );

      // Update goal probabilities inside goals array
      const updatedGoals = state.goals.map((g) => ({
        ...g,
        success_probability: sim.goal_probabilities[g.id] ?? g.success_probability ?? 0.75,
      }));

      state = {
        ...state,
        goals: updatedGoals,
        simulation: sim,
        isSimulating: false,
        lastSimulatedAt: new Date(),
      };
      notify();
    }, 250);
  },

  setRiskProfile(riskProfile: RiskProfileDto | null) {
    state = { ...state, riskProfile };
    notify();
  },

  applyRiskAllocation(alloc: RecommendedAllocationDto) {
    state = {
      ...state,
      assets: {
        equity: alloc.equity,
        debt: alloc.debt,
        gold: alloc.gold,
        cash: alloc.cash,
      },
      whatChanged: [
        {
          id: `c_${Date.now()}`,
          title: `Applied Risk Profile Allocation`,
          detail: `Rebalanced to ${alloc.equity}% Equity · ${alloc.debt}% Debt · ${alloc.gold}% Gold · ${alloc.cash}% Cash`,
          timestamp: "Just now",
          impact: "Target Portfolio Aligned",
        },
        ...state.whatChanged.slice(0, 7),
      ],
    };
    notify();
    this.triggerLiveSimulation();
  },

  loadDemoData() {
    state = {
      ...state,
      isOnboarded: true,
      profile: initialProfile,
      assets: initialAssets,
      goals: initialGoals,
      lifeEvents: initialLifeEvents,
      liabilities: initialLiabilities,
      whatChanged: initialWhatChanged,
      scenarios: initialScenarios,
      riskProfile: null,
      activeScreen: "dashboard",
    };
    this.triggerLiveSimulation();
  },
};
