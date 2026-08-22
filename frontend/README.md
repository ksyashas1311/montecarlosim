# FinTwin Frontend — Living Financial Digital Twin Product

This is the Next.js React frontend for **FinTwin**, rebuilt from the ground up as an interactive, retention-focused financial digital twin product.

---

## 🚀 Key Product Architecture

Organized around the core user question: **"Is my plan still on track?"**

### 1. Unified Information Model
- **Persistent Health Score**: Real-time composite indicator (`78/100`, `▲ +4 this month`) computed across 1,500+ Monte Carlo paths.
- **The Future Cone**: Wealth projection fan chart ($p_5, p_{25}, p_{50}, p_{75}, p_{95}$) with **Narration Perspectives** (*Optimistic*, *Median*, *Conservative*) and age hover tooltips.
- **"What Changed Since Last Visit" Feed**: Audit log tracking adjustments to salary, SIP, allocation, and scheduled milestones.
- **Goal Feasibility with Reverse Planning**: Every goal features an **"Improve →"** CTA that triggers actionable AI Reverse Planning levers.

### 2. Feature Screens
1. **Onboarding Wizard** (`src/components/onboarding/OnboardingFlow.tsx`): 5-step onboarding with instant payoff Future Cone calculation and 1-click **"Try Demo Data"** (Aditi, 25).
2. **Living Dashboard** (`src/components/dashboard/DashboardView.tsx`): Health score card, what changed feed, future cone fan chart, goal progress bars with CTAs, and quick action bar.
3. **My Plan** (`src/components/plan/PlanView.tsx`): Cashflow editing, interactive linked allocation sliders with real-time volatility preview, and live delta score predictions before committing.
4. **Goals & Life Timeline** (`src/components/goals/GoalsTimelineView.tsx`): Interactive horizontal age axis (25 → 65+), node click impact popovers, template picker, and specialized retirement age-vs-probability curve.
5. **Scenario Lab** (`src/components/lab/ScenarioLabView.tsx`): Side-by-side what-if fork cards, overlaid trajectory chart, 1-click **"Save as My Plan"**, and macro stress test presets.
6. **Persistent AI Copilot** (`src/components/copilot/CopilotDrawer.tsx`): Universal floating bubble, screen-aware suggested prompts, reverse planning solver, and interactive deep-linking probability chips.

---

## 🛠 Component Tree

```
src/
├── app/
│   ├── layout.tsx                    # Dark theme shell, metadata
│   ├── page.tsx                      # 4-destination persistent navigation
│   └── globals.css                   # Tailwind tokens, animations
├── components/
│   ├── dashboard/                    # HealthScoreCard, WhatChangedFeed, FutureConeChart, GoalProgressList
│   ├── plan/                         # InlineEditableField, AllocationSliders, AssumptionsPanel
│   ├── goals/                        # LifeTimeline, EventTemplatePicker, ImpactPopover, RetirementCurveDetail
│   ├── lab/                          # ScenarioCard, ScenarioCompareChart, SaveAsPlanButton
│   ├── copilot/                      # CopilotBubble, CopilotDrawer, SuggestedPrompts, ProbabilityChip
│   ├── onboarding/                   # OnboardingFlow
│   └── shared/                       # CurrencyFormat, SkeletonChart, StaleBadge, ErrorBanner
├── hooks/
│   ├── usePlanStore.ts               # Reactive state selector
│   ├── useLiveSimulation.ts          # Live delta preview hook
│   ├── useOnboardingState.ts         # Onboarding management
│   └── useCopilotContext.ts          # Contextual prompts & reverse planning
└── store/
    └── planStore.ts                  # Central reactive store & Monte Carlo simulation engine
```

---

## 💻 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch FinTwin.

To verify production build:
```bash
npm run build
```
