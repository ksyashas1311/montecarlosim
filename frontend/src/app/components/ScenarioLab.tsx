import React, { useState } from "react";
import { Sliders, HelpCircle, ShieldAlert, Zap, Layers } from "lucide-react";

interface ScenarioLabProps {
  appState: any;
  onUpdateProfile: (sip: number, retAge: number) => void;
  onUpdateSimConfig: (model: string, strategy: string) => void;
  onRunStressTest: (type: string) => Promise<any>;
  onRunPareto: () => Promise<any>;
}

export default function ScenarioLab({
  appState,
  onUpdateProfile,
  onUpdateSimConfig,
  onRunStressTest,
  onRunPareto,
}: ScenarioLabProps) {
  const profile = appState.profile || { monthly_sip: 10000, retirement_age: 50 };
  const simConfig = appState.simConfig || { market_model: "regime_switching", decumulation_strategy: "guyton_klinger" };

  const [sip, setSip] = useState(profile.monthly_sip);
  const [retAge, setRetAge] = useState(profile.retirement_age);
  const [marketModel, setMarketModel] = useState(simConfig.market_model);
  const [strategy, setStrategy] = useState(simConfig.decumulation_strategy);

  const [stressResult, setStressResult] = useState<any>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [selectedStress, setSelectedStress] = useState("");

  const [paretoResults, setParetoResults] = useState<any>(null);
  const [paretoLoading, setParetoLoading] = useState(false);

  const handleApplyParams = () => {
    onUpdateProfile(sip, retAge);
  };

  const handleConfigChange = (newModel: string, newStrategy: string) => {
    setMarketModel(newModel);
    setStrategy(newStrategy);
    onUpdateSimConfig(newModel, newStrategy);
  };

  const triggerStress = async (type: string) => {
    setSelectedStress(type);
    setStressLoading(true);
    try {
      const res = await onRunStressTest(type);
      setStressResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setStressLoading(false);
    }
  };

  const triggerPareto = async () => {
    setParetoLoading(true);
    try {
      const res = await onRunPareto();
      setParetoResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setParetoLoading(false);
    }
  };

  const stressPresets = [
    { id: "market_crash", name: "Global Crash", desc: "Equities crash -40% in Year 1 with spiked correlations" },
    { id: "hyperinflation", name: "Hyperinflation", desc: "Inflation spikes to 15% annually for 3 consecutive years" },
    { id: "stagflation", name: "Stagflation", desc: "Low returns coupled with persistent high inflation rates" },
    { id: "career_shock", name: "Career Shock", desc: "Complete income loss for 2 years (Age 35-37) with no SIP" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Left panel: Simulation Parameters controls */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00dce5]" /> Parameters Lab
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                <span>Monthly SIP:</span>
                <span className="text-[#00dce5] font-bold">₹ {sip.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={sip}
                onChange={(e) => setSip(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                <span>Retirement Age:</span>
                <span className="text-[#00dce5] font-bold">{retAge} Years</span>
              </div>
              <input
                type="range"
                min="40"
                max="70"
                step="1"
                value={retAge}
                onChange={(e) => setRetAge(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
            </div>

            <button
              onClick={handleApplyParams}
              className="w-full bg-[#00dce5]/10 border border-[#00dce5]/30 hover:bg-[#00dce5]/20 text-[#00dce5] py-2 rounded-xl text-xs font-semibold tracking-wide transition-all mt-4"
            >
              Re-Simulate Trajectory
            </button>
          </div>
        </section>

        <section className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#d1bcff]" /> Market & Withdrawal Model
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Market Engine Model</label>
              <select
                value={marketModel}
                onChange={(e) => handleConfigChange(e.target.value, strategy)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00dce5]"
              >
                <option value="parametric" className="bg-[#0b0f14]">Parametric Monte Carlo (Correlated)</option>
                <option value="historical_bootstrap" className="bg-[#0b0f14]">Historical Bootstrap (Nifty 50)</option>
                <option value="regime_switching" className="bg-[#0b0f14]">Markov Regime-Switching (5-State)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Withdrawal Decumulation</label>
              <select
                value={strategy}
                onChange={(e) => handleConfigChange(marketModel, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff]"
              >
                <option value="fixed" className="bg-[#0b0f14]">Fixed Annual Withdrawal</option>
                <option value="inflation_adjusted" className="bg-[#0b0f14]">Inflation-Adjusted Withdrawals</option>
                <option value="constant_percent" className="bg-[#0b0f14]">Constant % of Portfolio</option>
                <option value="guyton_klinger" className="bg-[#0b0f14]">Guyton-Klinger Capital Preservation Guardrails</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Right panel: Pareto & Stress tests */}
      <div className="lg:col-span-8 space-y-8">
        {/* Stress Testing Section */}
        <section className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-red-400" /> Stress Test Scenario Lab
          </h3>
          <p className="text-xs text-white/40 mb-6">Subject your financial plan to historically severe crises and check ruins.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stressPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => triggerStress(preset.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedStress === preset.id
                    ? "bg-[#00dce5]/5 border-[#00dce5] shadow-lg shadow-[#00dce5]/5"
                    : "bg-white/5 border-white/5 hover:border-white/15"
                }`}
              >
                <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" /> {preset.name}
                </div>
                <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{preset.desc}</p>
              </button>
            ))}
          </div>

          {stressLoading && (
            <div className="text-center text-xs text-white/30 py-6 border border-white/5 border-dashed rounded-xl">
              [ Running 10,000 stressed simulation paths... ]
            </div>
          )}

          {stressResult && !stressLoading && (
            <div className="bg-[#ffb4ab]/5 p-5 rounded-xl border border-red-500/20">
              <h4 className="font-semibold text-red-300 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                Stress Test Impact Analytics: {stressResult.scenario_name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Baseline Success</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">
                    {Math.round(stressResult.baseline_success_probability * 100)}%
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Stressed Success</div>
                  <div className="text-lg font-bold text-red-400 mt-1 font-mono">
                    {Math.round(stressResult.stressed_success_probability * 100)}%
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Stressed CVaR</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">
                    ₹ {Math.round(stressResult.stressed_simulation.risk_analytics.cvar_95 / 10000000).toFixed(1)} CR
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Stressed Ruin</div>
                  <div className="text-lg font-bold text-red-400 mt-1 font-mono">
                    {Math.round(stressResult.stressed_simulation.risk_analytics.probability_of_ruin * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Multi-Objective Optimization Profiles Section */}
        <section className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-[#00dce5]" /> Pareto Multi-Objective Profiles
              </h3>
              <p className="text-xs text-white/40 mt-1">Generate and compare Safe, Balanced, and Aggressive digital twin strategies.</p>
            </div>
            <button
              onClick={triggerPareto}
              disabled={paretoLoading}
              className="bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              {paretoLoading ? "Calculating..." : "Analyze Profiles"}
            </button>
          </div>

          {paretoResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              {["safe_profile", "balanced_profile", "aggressive_profile"].map((key) => {
                const item = paretoResults[key];
                const labels: any = {
                  safe_profile: { name: "Conservative (Safe)", desc: "Capital preservation emphasis" },
                  balanced_profile: { name: "Balanced Growth", desc: "Moderate asset allocations" },
                  aggressive_profile: { name: "Aggressive Horizon", desc: "Wealth compounding focus" },
                };
                return (
                  <div key={key} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{labels[key].name}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{labels[key].desc}</div>

                      <div className="my-4 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white/40">Equity / Debt:</span>
                          <span className="text-white font-mono">{Math.round(item.allocation.equity_ratio * 100)}% / {Math.round(item.allocation.debt_ratio * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Success Prob:</span>
                          <span className="text-[#00dce5] font-bold font-mono">{Math.round(item.success_probability * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Ruin Prob:</span>
                          <span className="text-red-400 font-bold font-mono">{Math.round(item.ruin_probability * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
