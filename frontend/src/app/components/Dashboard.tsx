import React from "react";
import { Activity, Landmark, CreditCard, ShieldAlert, Award, Calendar } from "lucide-react";

interface DashboardProps {
  appState: any;
  onTabChange: (tab: string) => void;
}

export default function Dashboard({ appState, onTabChange }: DashboardProps) {
  const simulation = appState.simulation;
  const profile = appState.profile || { current_age: 21, current_wealth: 0, monthly_sip: 0 };
  const goals = appState.goals || [];
  const lifeEvents = appState.lifeEvents || [];
  const liabilities = appState.liabilities || [];

  const healthScore = simulation ? Math.round(simulation.goals[0]?.success_probability * 100 || 75) : 75;
  const terminalWealth = simulation ? simulation.terminal_wealth_median : 0;

  // Build Conical SVG Trajectory paths
  let svgPaths = null;
  let maxValLabel = "₹ 0 CR";
  if (simulation && simulation.percentiles) {
    const p50 = simulation.percentiles.p50 || [];
    const p5 = simulation.percentiles.p5 || [];
    const p95 = simulation.percentiles.p95 || [];

    const width = 800;
    const height = 320;
    const nPoints = p50.length;
    const maxVal = Math.max(...p95) * 1.15 || 1;
    maxValLabel = `₹ ${(maxVal / 10000000).toFixed(1)} CR`;

    const buildPath = (data: number[]) => {
      return data
        .map((val, idx) => {
          const x = (idx / (nPoints - 1)) * width;
          const y = height - (val / maxVal) * height;
          return `${idx === 0 ? "M" : "L"} ${x},${y}`;
        })
        .join(" ");
    };

    const topPath = p95.map((val: number, idx: number) => `${(idx / (nPoints - 1)) * width},${height - (val / maxVal) * height}`);
    const bottomPath = p5
      .map((val: number, idx: number) => `${(idx / (nPoints - 1)) * width},${height - (val / maxVal) * height}`)
      .reverse();
    const coneD = `M ${topPath.join(" L ")} L ${bottomPath.join(" L ")} Z`;

    svgPaths = (
      <>
        {/* Shaded Conical Distribution Range */}
        <path d={coneD} fill="url(#cone-grad)" opacity="0.18" />
        {/* Median Vector Path */}
        <path d={buildPath(p50)} stroke="#00dce5" strokeWidth="3" fill="none" />
        {/* Downside 5th Percentile Path */}
        <path d={buildPath(p5)} stroke="#ffb4ab" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
        {/* Upside 95th Percentile Path */}
        <path d={buildPath(p95)} stroke="#d1bcff" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
      </>
    );
  }

  const outstandingDebt = liabilities.reduce((sum: number, l: any) => sum + l.principal, 0);
  const monthlyEMIs = liabilities.reduce((sum: number, l: any) => sum + l.emi, 0);

  return (
    <div className="flex flex-col w-full">
      {/* Net Worth Percentiles Hero Trajectory */}
      <section className="relative w-full h-[380px] bg-gradient-to-b from-[#111822] to-transparent rounded-2xl border border-white/5 p-6 mb-8 overflow-hidden flex flex-col justify-between shadow-lg">
        <div className="absolute inset-0 z-0 opacity-85">
          {simulation ? (
            <svg className="w-full h-full" viewBox="0 0 800 320" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cone-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00dce5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0b0f14" stopOpacity="0" />
                </linearGradient>
              </defs>
              {svgPaths}
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-sm">
              [ Running Simulation Cones... ]
            </div>
          )}
        </div>

        <div className="relative z-10 flex justify-between items-start w-full">
          <div>
            <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase">Net Worth Trajectory</span>
            <h2 className="text-xl font-bold mt-1 text-white">The Future Cone</h2>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase">Projected Median Value</span>
            <div className="text-2xl font-bold text-[#00dce5] font-mono">
              ₹ {(terminalWealth / 10000000).toFixed(2)} CR
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full flex justify-between text-xs text-white/40 border-t border-white/5 pt-2">
          <span>Current Age: {profile.current_age}</span>
          <span>Timeline End: Age {profile.current_age + 40}</span>
        </div>
      </section>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#00dce5]" /> Financial Health
          </span>
          <div className="text-2xl font-bold text-[#00dce5] mt-3 font-mono">{healthScore}/100</div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-white/60" /> Starting Wealth
          </span>
          <div className="text-2xl font-bold text-white mt-3 font-mono">
            ₹ {profile.current_wealth?.toLocaleString()}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-[#d1bcff]" /> Monthly SIP
          </span>
          <div className="text-2xl font-bold text-white mt-3 font-mono">
            ₹ {profile.monthly_sip?.toLocaleString()}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Outstanding Debt
          </span>
          <div className={`text-2xl font-bold mt-3 font-mono ${outstandingDebt > 0 ? "text-red-400" : "text-white"}`}>
            ₹ {outstandingDebt.toLocaleString()}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Monthly EMIs
          </span>
          <div className={`text-2xl font-bold mt-3 font-mono ${monthlyEMIs > 0 ? "text-red-400" : "text-white"}`}>
            ₹ {Math.round(monthlyEMIs).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Target Goals & Timeline Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Target vectors / Goals Success */}
        <div className="lg:col-span-8 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-md">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00dce5]" /> Target Vectors & Goals
          </h3>
          <div className="space-y-6">
            {goals.map((g: any, idx: number) => {
              const res = simulation?.goals?.find((gr: any) => gr.name === g.name);
              const prob = res ? Math.round(res.success_probability * 100) : 0;
              return (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="font-semibold text-white text-sm">{g.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        Target: ₹ {g.target_amount.toLocaleString()} at Age {g.target_age}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white/40">Success rate:</span>
                      <div className="text-base font-bold text-[#00dce5] font-mono">{prob}%</div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00dce5] rounded-full transition-all duration-500" style={{ width: `${prob}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Life Timeline */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-md">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#d1bcff]" /> Life Events Timeline
          </h3>
          <div className="border-l-2 border-white/10 pl-4 space-y-6">
            {lifeEvents.length === 0 ? (
              <div className="text-xs text-white/30 py-4">No scheduled life events.</div>
            ) : (
              lifeEvents.map((e: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#0b0f14] border-2 border-[#d1bcff]" />
                  <div className="text-[10px] font-bold text-[#d1bcff] tracking-wider uppercase">Age {e.age}</div>
                  <div className="font-semibold text-white text-sm mt-0.5">{e.name}</div>
                  <div className="text-xs text-white/40 font-mono mt-0.5">₹ {e.amount.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
