"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Sliders, PieChart, Sparkles } from "lucide-react";
import Dashboard from "./components/Dashboard";
import ScenarioLab from "./components/ScenarioLab";
import AssetLiabilities from "./components/AssetLiabilities";
import AICopilot from "./components/AICopilot";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [appState, setAppState] = useState<any>({
    profile: null,
    assets: null,
    goals: [],
    lifeEvents: [],
    liabilities: [],
    simulation: null,
    simConfig: {
      market_model: "regime_switching",
      decumulation_strategy: "guyton_klinger"
    }
  });

  // Fetch initial profile & simulation inputs on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/1");
      if (!res.ok) {
        // Fallback user setup if user 1 does not exist
        const createUserRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Self",
            current_age: 25,
            retirement_age: 55,
            current_wealth: 500000,
            monthly_sip: 15000,
            target_goal_probability: 0.85
          })
        });
        const user = await createUserRes.json();
        // Load initial goals and allocations
        await fetch("/api/users/1/assets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equity: 0.6, debt: 0.3, gold: 0.05, cash: 0.05 })
        });
        await fetch("/api/users/1/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            { name: "Retirement Target", target_amount: 50000000, target_age: 55, priority: "high" }
          ])
        });
        await fetch("/api/users/1/life-events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            { name: "Marriage Expenses", amount: 1500000, age: 28, occurs_annually: false, start_age: 28, end_age: 28 }
          ])
        });
        
        // Retry fetch
        const retryRes = await fetch("/api/users/1");
        const data = await retryRes.json();
        updateLocalState(data);
      } else {
        const data = await res.json();
        updateLocalState(data);
      }
    } catch (e) {
      console.error("Failed fetching initial data", e);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalState = (data: any) => {
    setAppState((prev: any) => {
      const nextState = {
        ...prev,
        profile: {
          current_age: data.current_age,
          retirement_age: data.retirement_age,
          current_wealth: data.current_wealth,
          monthly_sip: data.monthly_sip,
          target_goal_probability: data.target_goal_probability
        },
        assets: data.asset_allocation ? {
          equity: Math.round(data.asset_allocation.equity_ratio * 100),
          debt: Math.round(data.asset_allocation.debt_ratio * 100),
          gold: Math.round(data.asset_allocation.gold_ratio * 100),
          cash: Math.round(data.asset_allocation.cash_ratio * 100)
        } : { equity: 50, debt: 30, gold: 10, cash: 10 },
        goals: data.goals || [],
        lifeEvents: data.life_events || [],
        liabilities: data.liabilities || []
      };
      // Run initial simulation
      runSimulation(nextState.simConfig.market_model, nextState.simConfig.decumulation_strategy);
      return nextState;
    });
  };

  const runSimulation = async (model: string, strategy: string) => {
    try {
      const res = await fetch("/api/users/1/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market_model: model,
          decumulation_strategy: strategy
        })
      });
      const data = await res.json();
      setAppState((prev: any) => ({
        ...prev,
        simulation: data,
        simConfig: { market_model: model, decumulation_strategy: strategy }
      }));
    } catch (e) {
      console.error("Simulation run failed", e);
    }
  };

  // State handlers to modify state & trigger backend syncs
  const handleUpdateProfile = async (sip: number, retAge: number) => {
    try {
      const res = await fetch("/api/users/1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appState.profile?.name || "Self",
          current_age: appState.profile?.current_age || 25,
          retirement_age: retAge,
          current_wealth: appState.profile?.current_wealth || 500000,
          monthly_sip: sip,
          target_goal_probability: appState.profile?.target_goal_probability || 0.85
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAppState((prev: any) => ({
          ...prev,
          profile: {
            ...prev.profile,
            monthly_sip: sip,
            retirement_age: retAge
          }
        }));
        await runSimulation(appState.simConfig.market_model, appState.simConfig.decumulation_strategy);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAssetAllocation = async (alloc: any) => {
    try {
      const res = await fetch("/api/users/1/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equity: alloc.equity / 100,
          debt: alloc.debt / 100,
          gold: alloc.gold / 100,
          cash: alloc.cash / 100
        })
      });
      if (res.ok) {
        setAppState((prev: any) => ({ ...prev, assets: alloc }));
        await runSimulation(appState.simConfig.market_model, appState.simConfig.decumulation_strategy);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLiability = async (loan: any) => {
    const list = [...appState.liabilities, loan];
    try {
      const res = await fetch("/api/users/1/liabilities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list)
      });
      if (res.ok) {
        const data = await res.json();
        setAppState((prev: any) => ({ ...prev, liabilities: data }));
        await runSimulation(appState.simConfig.market_model, appState.simConfig.decumulation_strategy);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLiability = async (name: string) => {
    const list = appState.liabilities.filter((l: any) => l.name !== name);
    try {
      const res = await fetch("/api/users/1/liabilities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list)
      });
      if (res.ok) {
        const data = await res.json();
        setAppState((prev: any) => ({ ...prev, liabilities: data }));
        await runSimulation(appState.simConfig.market_model, appState.simConfig.decumulation_strategy);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunStressTest = async (type: string) => {
    const res = await fetch("/api/users/1/stress-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_type: type })
    });
    return await res.json();
  };

  const handleRunPareto = async () => {
    const res = await fetch("/api/users/1/optimize-multi-objective", {
      method: "POST"
    });
    return await res.json();
  };

  const handleConfigChange = (model: string, strategy: string) => {
    runSimulation(model, strategy);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "scenario-lab", label: "Scenario Lab", icon: Sliders },
    { id: "asset-allocation", label: "Assets & Liabilities", icon: PieChart },
    { id: "copilot", label: "AI Copilot", icon: Sparkles }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0f14]">
        <div className="text-[#00dce5] font-mono text-sm tracking-wide animate-pulse">
          [ Initializing FinTwin Workspace Environment... ]
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f14] text-[#f0f4f9]">
      {/* Persistant Navigation Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0e141c] border-r border-white/5 flex flex-col z-50 shadow-md">
        <div className="p-6 flex items-center gap-2 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-[#0b0f14]" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FinTwin</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? "bg-[#00dce5]/10 text-[#00dce5] border border-[#00dce5]/20 shadow-md shadow-[#00dce5]/5"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <IconComponent className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col bg-transparent">
        <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-[#0e141c]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="text-xs font-semibold text-white/50 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00dce5] animate-pulse" /> Digital Twin Core Active
          </div>
          <div className="text-right text-[10px] text-white/40 font-mono">
            10,000 Path Simulations • Regime switching
          </div>
        </header>

        <div className="p-8 flex-1 max-w-7xl w-full">
          {activeTab === "dashboard" && <Dashboard appState={appState} onTabChange={setActiveTab} />}
          {activeTab === "scenario-lab" && (
            <ScenarioLab
              appState={appState}
              onUpdateProfile={handleUpdateProfile}
              onUpdateSimConfig={handleConfigChange}
              onRunStressTest={handleRunStressTest}
              onRunPareto={handleRunPareto}
            />
          )}
          {activeTab === "asset-allocation" && (
            <AssetLiabilities
              appState={appState}
              onUpdateAssetAllocation={handleUpdateAssetAllocation}
              onAddLiability={handleAddLiability}
              onDeleteLiability={handleDeleteLiability}
            />
          )}
          {activeTab === "copilot" && <AICopilot appState={appState} />}
        </div>
      </main>
    </div>
  );
}
