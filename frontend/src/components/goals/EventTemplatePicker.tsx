"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { formatINR } from "../shared/CurrencyFormat";

interface EventTemplatePickerProps {
  isOpen: boolean;
  type: "goal" | "event";
  startAge: number;
  endAge: number;
  onClose: () => void;
  onSave: (data: { name: string; amount: number; age: number; category: string }) => void;
}

export default function EventTemplatePicker({
  isOpen,
  type,
  startAge,
  endAge,
  onClose,
  onSave,
}: EventTemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("house");
  const [itemName, setItemName] = useState("New Home Purchase");
  const [itemAmount, setItemAmount] = useState(7500000);
  const [itemAge, setItemAge] = useState(32);

  if (!isOpen) return null;

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (type === "goal") {
      if (cat === "house") {
        setItemName("New Home Purchase");
        setItemAmount(7500000);
        setItemAge(32);
      } else if (cat === "car") {
        setItemName("EV / Luxury Car");
        setItemAmount(1800000);
        setItemAge(28);
      } else if (cat === "education") {
        setItemName("Higher Education / MBA");
        setItemAmount(2500000);
        setItemAge(29);
      } else {
        setItemName("Custom Milestone Goal");
        setItemAmount(2000000);
        setItemAge(35);
      }
    } else {
      if (cat === "marriage") {
        setItemName("Wedding & Celebration");
        setItemAmount(1500000);
        setItemAge(28);
      } else if (cat === "child") {
        setItemName("Child Education Fund");
        setItemAmount(2500000);
        setItemAge(38);
      } else if (cat === "career") {
        setItemName("Career Transition / Sabbatical");
        setItemAmount(800000);
        setItemAge(33);
      } else {
        setItemName("Life Milestone Outflow");
        setItemAmount(1000000);
        setItemAge(35);
      }
    }
  };

  const handleSave = () => {
    onSave({
      name: itemName || (type === "goal" ? "Custom Goal" : "Life Event"),
      amount: itemAmount,
      age: itemAge,
      category: selectedCategory,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e141c] border border-white/15 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-bold text-[#00dce5] uppercase tracking-wider">
            {type === "goal" ? "Add Financial Goal" : "Add Life Event"}
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {type === "goal" ? "Define Goal Milestone" : "Schedule Life Event"}
          </h2>
        </div>

        {/* Template Category Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(type === "goal"
            ? ["house", "car", "education", "custom"]
            : ["marriage", "child", "career", "custom"]
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition ${
                selectedCategory === cat
                  ? "bg-[#00dce5]/20 border-[#00dce5] text-white"
                  : "bg-white/5 border-white/5 text-white/60 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-white/70">Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#00dce5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/70">Amount (₹)</label>
              <input
                type="number"
                value={itemAmount}
                onChange={(e) => setItemAmount(Number(e.target.value))}
                step={100000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#00dce5]"
              />
              <span className="text-[10px] text-white/40">{formatINR(itemAmount, true)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/70">Scheduled Age</label>
              <input
                type="number"
                value={itemAge}
                onChange={(e) => setItemAge(Number(e.target.value))}
                min={startAge}
                max={endAge}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#00dce5]"
              />
              <span className="text-[10px] text-white/40">In {itemAge - startAge} years</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] shadow-md transition"
          >
            Add to Twin
          </button>
        </div>
      </div>
    </div>
  );
}
