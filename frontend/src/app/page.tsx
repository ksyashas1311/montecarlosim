"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Calendar,
  Sliders,
  Sparkles,
  RotateCcw,
  Bell,
  User,
  ShieldCheck,
} from "lucide-react";
import { usePlanStore } from "../hooks/usePlanStore";
import { planStore } from "../store/planStore";

// Feature modules
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import DashboardView from "../components/dashboard/DashboardView";
import PlanView from "../components/plan/PlanView";
import GoalsTimelineView from "../components/goals/GoalsTimelineView";
import ScenarioLabView from "../components/lab/ScenarioLabView";
import CopilotBubble from "../components/copilot/CopilotBubble";
import CopilotDrawer from "../components/copilot/CopilotDrawer";

export default function Home() {
  const store = usePlanStore();
  const { isOnboarded, activeScreen, profile, simulation } = store;

  // Render Onboarding if first-time user
  if (!isOnboarded) {
    return <OnboardingFlow />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "plan", label: "My Plan", icon: FileSpreadsheet },
    { id: "goals", label: "Goals & Timeline", icon: Calendar },
    { id: "lab", label: "Scenario Lab", icon: Sliders },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0f14] text-[#f0f4f9] selection:bg-[#00dce5] selection:text-[#0b0f14]">
      {/* Desktop Left Persistent Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#0e141c] border-r border-white/5 flex-col justify-between z-40 shadow-xl">
        <div>
          {/* Brand Logo & Name */}
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center shadow-lg shadow-[#00dce5]/20">
              <Sparkles className="w-5 h-5 text-[#0b0f14]" />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight block leading-none">FinTwin</span>
              <span className="text-[10px] text-white/40 font-mono">Digital Financial Twin</span>
            </div>
          </div>

          {/* 4 Primary Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => planStore.setActiveScreen(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all ${
                    active
                      ? "bg-[#00dce5]/15 text-[#00dce5] border border-[#00dce5]/30 shadow-md shadow-[#00dce5]/5"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#00dce5]" : "text-white/50"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Demo Reset */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {/* User Profile Card */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d1bcff] to-[#00dce5] flex items-center justify-center text-[#0b0f14] font-bold text-xs">
              {profile.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">{profile.name}</span>
              <span className="text-[10px] text-white/40 font-mono block">
                Age {profile.current_age} · Score: {simulation?.health_score ?? 78}
              </span>
            </div>
          </div>

          <button
            onClick={() => planStore.loadDemoData()}
            className="w-full py-2 rounded-xl text-[11px] font-semibold text-white/40 hover:text-white hover:bg-white/5 transition flex items-center justify-center gap-1.5"
            title="Reset workspace to benchmark demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen flex flex-col bg-transparent pb-20 md:pb-8">
        {/* Sticky Top Header Bar */}
        <header className="h-16 px-6 sm:px-8 border-b border-white/5 flex items-center justify-between bg-[#0e141c]/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#00dce5] animate-pulse" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider hidden sm:inline">
              Twin Core Online
            </span>
            <span className="text-[10px] text-white/40 font-mono pl-2 border-l border-white/10 hidden lg:inline">
              10,000 Monte Carlo Paths · Regime Switching Model
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => planStore.setCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00dce5]/10 hover:bg-[#00dce5]/20 text-[#00dce5] border border-[#00dce5]/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Copilot</span>
            </button>

            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Dynamic View Canvas */}
        <div className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeScreen === "dashboard" && <DashboardView />}
          {activeScreen === "plan" && <PlanView />}
          {activeScreen === "goals" && <GoalsTimelineView />}
          {activeScreen === "lab" && <ScenarioLabView />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (4 destinations) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0e141c]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-around z-40 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => planStore.setActiveScreen(item.id as any)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                active ? "text-[#00dce5]" : "text-white/40"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Persistent Floating Copilot Affordance across ALL screens */}
      <CopilotBubble />
      <CopilotDrawer />
    </div>
  );
}
