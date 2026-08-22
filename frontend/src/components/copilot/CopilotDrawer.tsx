"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  Check,
} from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { useCopilotContext } from "../../hooks/useCopilotContext";
import { planStore, PlanState } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";
import SuggestedPrompts from "./SuggestedPrompts";
import ProbabilityChip from "./ProbabilityChip";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  chips?: { label: string; prob: number; linkScreen?: PlanState["activeScreen"] }[];
  reversePlan?: {
    goalName: string;
    options: { title: string; detail: string; projectedProbability: number; actionType: string; payload?: any }[];
  };
}

export default function CopilotDrawer() {
  const store = usePlanStore();
  const { suggestedPrompts, getReversePlanningAdvice } = useCopilotContext();
  const isOpen = store.copilotOpen;

  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m_welcome",
      sender: "copilot",
      text: `Hello ${store.profile.name}! I'm your digital twin copilot. I continuously monitor your 10,000 Monte Carlo paths, cashflows, and goal probabilities. How can I assist you with your plan today?`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    // Simulate smart copilot AI reasoning & Reverse Planning
    setTimeout(() => {
      let botResponse: Message;

      const lower = query.toLowerCase();

      if (lower.includes("improve") || lower.includes("house") || lower.includes("reverse") || lower.includes("low")) {
        const lowestGoal = store.goals.find((g) => g.category === "house") || store.goals[0];
        const advice = getReversePlanningAdvice(lowestGoal);

        botResponse = {
          id: `c_${Date.now()}`,
          sender: "copilot",
          text: `To improve **${advice?.goalName || "your goal"}** from its current probability to **${advice?.targetProbability}%+**, here are 3 mathematically validated Reverse Planning levers:`,
          reversePlan: advice
            ? {
                goalName: advice.goalName,
                options: advice.options.map((opt) => ({
                  title: opt.title,
                  detail: opt.detail,
                  projectedProbability: opt.projectedProbability,
                  actionType: opt.actionType,
                  payload: (opt as any).sipValue || (opt as any).newAge || (opt as any).equityRatio,
                })),
              }
            : undefined,
        };
      } else if (lower.includes("health score") || lower.includes("why is")) {
        botResponse = {
          id: `c_${Date.now()}`,
          sender: "copilot",
          text: `Your Financial Health Score is **${store.simulation?.health_score ?? 78}/100**. This reflects:\n\n• **High Savings Rate:** Your ₹35,000 monthly SIP covers regular accumulation.\n• **Low Ruin Risk:** Less than 1.5% chance of portfolio depletion before age 65.\n• **Key Sensitivity:** Your House Goal at age 32 represents a ₹75L cash outflow right when equity compounding is accelerating.`,
          chips: [
            { label: "House @ 32", prob: 68, linkScreen: "goals" },
            { label: "Retirement @ 48", prob: 74, linkScreen: "goals" },
          ],
        };
      } else if (lower.includes("sip") || lower.includes("increase")) {
        botResponse = {
          id: `c_${Date.now()}`,
          sender: "copilot",
          text: `Increasing your monthly SIP by **+₹10,000** (to ₹45,000/mo) boosts your terminal median corpus by **+₹1.27 Crore** and increases your overall Financial Health Score from **78 → 86** (+8 points).`,
          chips: [{ label: "Compare in Scenario Lab", prob: 86, linkScreen: "lab" }],
        };
      } else if (lower.includes("inflation") || lower.includes("crash") || lower.includes("stress")) {
        botResponse = {
          id: `c_${Date.now()}`,
          sender: "copilot",
          text: `Under an 8% inflation regime or a -40% year-one market drawdown, your portfolio's median wealth reduces by approximately 18%, but your 25% debt allocation and emergency liquidity prevent portfolio ruin.`,
          chips: [{ label: "Open Stress Tester", prob: 64, linkScreen: "lab" }],
        };
      } else {
        botResponse = {
          id: `c_${Date.now()}`,
          sender: "copilot",
          text: `Based on your profile (Age ${store.profile.current_age}, SIP ${formatINR(store.profile.monthly_sip)}/mo, ${store.assets.equity}% Equity), your plan has a strong foundation with a **${store.simulation?.health_score ?? 78}%** composite health score. Let me know if you'd like to test a what-if scenario or optimize specific milestones!`,
          chips: [{ label: "View Future Cone", prob: 78, linkScreen: "dashboard" }],
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 500);
  };

  const handleApplyOption = (opt: any) => {
    if (opt.actionType === "increase_sip") {
      planStore.updateProfile({ monthly_sip: opt.payload });
    } else if (opt.actionType === "delay_goal") {
      const houseGoal = store.goals.find((g) => g.category === "house") || store.goals[0];
      if (houseGoal) {
        planStore.updateProfile({ retirement_age: opt.payload });
      }
    } else if (opt.actionType === "adjust_allocation") {
      planStore.updateAssetAllocation({
        equity: opt.payload,
        debt: Math.max(0, 100 - opt.payload - store.assets.gold - store.assets.cash),
        gold: store.assets.gold,
        cash: store.assets.cash,
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `c_applied_${Date.now()}`,
        sender: "copilot",
        text: `Applied **"${opt.title}"** to your digital twin! Re-simulating 10,000 paths now.`,
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#0e141c]/95 border-l border-white/10 backdrop-blur-2xl z-50 flex flex-col shadow-2xl animate-fade-in">
      {/* Drawer Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00dce5] to-[#d1bcff] flex items-center justify-center text-[#0b0f14] shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">FinTwin Copilot</h3>
            <span className="text-[10px] text-white/50 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Context Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#00dce5]/10 text-[#00dce5] border border-[#00dce5]/20 font-mono">
            Score: {store.simulation?.health_score ?? 78}/100
          </span>
          <button
            onClick={() => planStore.setCopilotOpen(false)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} space-y-2`}
          >
            <div
              className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-[#00dce5] text-[#0b0f14] font-medium shadow-md"
                  : "bg-white/5 text-white/90 border border-white/5"
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Inline Probability Chips with Deep Links */}
              {m.chips && m.chips.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/10">
                  {m.chips.map((chip, idx) => (
                    <ProbabilityChip
                      key={idx}
                      label={chip.label}
                      probability={chip.prob}
                      linkScreen={chip.linkScreen}
                    />
                  ))}
                </div>
              )}

              {/* Reverse Planning Options Card */}
              {m.reversePlan && (
                <div className="space-y-2 mt-3 pt-2 border-t border-white/10">
                  {m.reversePlan.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 hover:border-[#00dce5]/30 transition"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white text-[11px]">{opt.title}</span>
                        <span className="text-[#00dce5] font-mono font-bold text-[10px] bg-[#00dce5]/10 px-1.5 py-0.5 rounded">
                          → {opt.projectedProbability}%
                        </span>
                      </div>
                      <p className="text-[10px] text-white/60">{opt.detail}</p>
                      <button
                        onClick={() => handleApplyOption(opt)}
                        className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-[#00dce5] hover:text-[#0b0f14] text-white transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Apply to Twin</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#00dce5] font-mono animate-pulse">
            <Bot className="w-4 h-4" />
            <span>Simulating what-if response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contextual Suggested Prompt Pills */}
      <div className="px-5 py-2.5 border-t border-white/5 bg-white/5">
        <SuggestedPrompts
          prompts={suggestedPrompts}
          onSelectPrompt={(text) => handleSendMessage(text)}
        />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-white/5 bg-[#0e141c]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about your money, goals, or what-ifs..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00dce5]"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="p-2.5 rounded-xl bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
