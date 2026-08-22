"use client";

import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Target,
  HeartHandshake,
  Trash2,
  List,
} from "lucide-react";
import { usePlanStore } from "../../hooks/usePlanStore";
import { planStore } from "../../store/planStore";
import { formatINR } from "../shared/CurrencyFormat";
import LifeTimeline from "./LifeTimeline";
import ImpactPopover from "./ImpactPopover";
import RetirementCurveDetail from "./RetirementCurveDetail";
import EventTemplatePicker from "./EventTemplatePicker";

export default function GoalsTimelineView() {
  const store = usePlanStore();
  const { profile, goals, lifeEvents, simulation } = store;

  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const [selectedNode, setSelectedNode] = useState<{ type: "goal" | "event"; item: any } | null>(null);

  // Modal State for Adding Goal / Event
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<"goal" | "event">("goal");

  // Retirement detail curve
  const retirementCurve = simulation?.retirement_curve || [
    { age: 40, probability: 0.17 },
    { age: 43, probability: 0.34 },
    { age: 45, probability: 0.54 },
    { age: 48, probability: 0.74 },
    { age: 50, probability: 0.86 },
    { age: 55, probability: 0.96 },
    { age: 60, probability: 0.99 },
  ];

  const startAge = profile.current_age || 25;
  const endAge = Math.max(startAge + 35, 65);

  const openAddModal = (type: "goal" | "event") => {
    setAddType(type);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (data: { name: string; amount: number; age: number; category: string }) => {
    if (addType === "goal") {
      planStore.addGoal({
        name: data.name,
        target_amount: data.amount,
        target_age: data.age,
        priority: "high",
        category: data.category as any,
      });
    } else {
      planStore.addLifeEvent({
        name: data.name,
        amount: data.amount,
        age: data.age,
        type: "expense",
        category: data.category as any,
      });
    }
  };

  const handleRemoveSelectedNode = () => {
    if (!selectedNode) return;
    if (selectedNode.type === "goal") {
      planStore.removeGoal(selectedNode.item.id);
    } else {
      planStore.removeLifeEvent(selectedNode.item.id);
    }
    setSelectedNode(null);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-12">
      {/* Header with View Toggle & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[11px] font-bold text-[#00dce5] uppercase tracking-wider">
            Future Sequence of Milestones
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Goals & Life Events
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeline vs List View Toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === "timeline"
                  ? "bg-[#00dce5] text-[#0b0f14]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === "list"
                  ? "bg-[#00dce5] text-[#0b0f14]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal("goal")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>

          <button
            onClick={() => openAddModal("event")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Life Event</span>
          </button>
        </div>
      </div>

      {/* ================= TIMELINE VIEW ================= */}
      {viewMode === "timeline" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <LifeTimeline
              startAge={startAge}
              endAge={endAge}
              goals={goals}
              lifeEvents={lifeEvents}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />

            {/* Inline Impact Popover when a node is clicked */}
            {selectedNode && (
              <ImpactPopover
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onRemove={handleRemoveSelectedNode}
              />
            )}
          </div>

          {/* Specialized Retirement Curve Detail */}
          <RetirementCurveDetail
            currentRetirementAge={profile.retirement_age}
            retirementCurve={retirementCurve}
            onSelectAge={(age) => planStore.updateProfile({ retirement_age: age })}
          />
        </div>
      )}

      {/* ================= LIST VIEW ================= */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {/* Goals List */}
          <div className="bg-[#0e141c]/90 border border-white/5 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Financial Goals</h3>
            {goals.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs">No goals created yet.</div>
            ) : (
              <div className="space-y-3">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/15 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00dce5]">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{g.name}</h4>
                        <span className="text-[11px] text-white/50 font-mono">
                          {formatINR(g.target_amount, true)} @ Age {g.target_age}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold font-mono text-[#00dce5]">
                        {Math.round((g.success_probability || 0.74) * 100)}% likely
                      </span>
                      <button
                        onClick={() => planStore.removeGoal(g.id)}
                        className="p-2 text-white/40 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Life Events List */}
          <div className="bg-[#0e141c]/90 border border-white/5 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Life Events</h3>
            {lifeEvents.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs">No life events scheduled yet.</div>
            ) : (
              <div className="space-y-3">
                {lifeEvents.map((e) => (
                  <div
                    key={e.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/15 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#d1bcff]">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{e.name}</h4>
                        <span className="text-[11px] text-white/50 font-mono">
                          {formatINR(e.amount, true)} @ Age {e.age}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => planStore.removeLifeEvent(e.id)}
                      className="p-2 text-white/40 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guided Template Picker Modal */}
      <EventTemplatePicker
        isOpen={isAddModalOpen}
        type={addType}
        startAge={startAge}
        endAge={endAge}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
}
