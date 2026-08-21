import React, { useState } from "react";
import { PieChart, Landmark, ShieldAlert, Plus, Trash2 } from "lucide-react";

interface AssetLiabilitiesProps {
  appState: any;
  onUpdateAssetAllocation: (alloc: { equity: number; debt: number; gold: number; cash: number }) => void;
  onAddLiability: (liability: any) => Promise<void>;
  onDeleteLiability: (name: string) => Promise<void>;
}

export default function AssetLiabilities({
  appState,
  onUpdateAssetAllocation,
  onAddLiability,
  onDeleteLiability,
}: AssetLiabilitiesProps) {
  const assets = appState.assets || { equity: 50, debt: 30, gold: 10, cash: 10 };
  const liabilities = appState.liabilities || [];

  const [equity, setEquity] = useState(assets.equity);
  const [debt, setDebt] = useState(assets.debt);
  const [gold, setGold] = useState(assets.gold);
  const [cash, setCash] = useState(assets.cash);

  // Form states for creating a new liability
  const [loanName, setLoanName] = useState("");
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(15);
  const [startAge, setStartAge] = useState(25);
  const [prepay, setPrepay] = useState(0);
  const [vol, setVol] = useState(0.0);

  const totalAllocation = equity + debt + gold + cash;

  const handleApplyAssets = () => {
    if (totalAllocation !== 100) {
      alert("Error: Total allocation weights must equal exactly 100%. Current sum: " + totalAllocation + "%");
      return;
    }
    onUpdateAssetAllocation({ equity, debt, gold, cash });
  };

  const handleCreateLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName) return;
    const emiVal = calculateEMI(principal, rate, tenure);
    const newLoan = {
      name: loanName,
      principal,
      interest_rate: rate / 100,
      tenure_years: tenure,
      start_age: startAge,
      emi: emiVal,
      prepayment_monthly: prepay,
      variable_rate_vol: vol,
    };
    await onAddLiability(newLoan);
    setLoanName("");
  };

  const calculateEMI = (p: number, r: number, t: number) => {
    const r_m = r / 100 / 12;
    const N = t * 12;
    if (r_m === 0) return p / N;
    return p * (r_m * Math.pow(1 + r_m, N)) / (Math.pow(1 + r_m, N) - 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Portfolio Allocations weights sliders */}
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#00dce5]" /> Portfolio Asset Allocation
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                <span>Equity Weight:</span>
                <span className="text-[#00dce5] font-bold">{equity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={equity}
                onChange={(e) => setEquity(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                <span>Debt Weight:</span>
                <span className="text-[#00dce5] font-bold">{debt}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={debt}
                onChange={(e) => setDebt(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                <span>Gold Weight:</span>
                <span className="text-[#00dce5] font-bold">{gold}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={gold}
                onChange={(e) => setGold(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2 font-mono">
                <span>Cash Weight:</span>
                <span className="text-[#00dce5] font-bold">{cash}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cash}
                onChange={(e) => setCash(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00dce5]"
              />
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs">
              <span className="text-white/40">Total Weights Allocated:</span>
              <span className={`font-bold font-mono ${totalAllocation === 100 ? "text-[#00dce5]" : "text-red-400"}`}>
                {totalAllocation}%
              </span>
            </div>

            <button
              onClick={handleApplyAssets}
              className="w-full bg-[#00dce5]/10 border border-[#00dce5]/30 hover:bg-[#00dce5]/20 text-[#00dce5] py-2 rounded-xl text-xs font-semibold tracking-wide transition-all mt-4"
            >
              Rebalance Portfolio Assets
            </button>
          </div>
        </section>
      </div>

      {/* Liabilities and Loan form / manager */}
      <div className="lg:col-span-7 space-y-6">
        <section className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Landmark className="w-4.5 h-4.5 text-[#d1bcff]" /> Liabilities & Outstanding Debt
          </h3>

          <form onSubmit={handleCreateLiability} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Loan Name</label>
              <input
                type="text"
                placeholder="e.g. Home Loan"
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Principal (₹)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Interest Rate % (Annual)</label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Tenure (Years)</label>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Start Age</label>
              <input
                type="number"
                value={startAge}
                onChange={(e) => setStartAge(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Monthly Prepayment (₹)</label>
              <input
                type="number"
                value={prepay}
                onChange={(e) => setPrepay(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d1bcff] font-mono"
              />
            </div>

            <button
              type="submit"
              className="md:col-span-2 bg-[#d1bcff] hover:bg-[#c2a7ff] text-[#0b0f14] py-2 rounded-xl text-xs font-semibold tracking-wide transition-all mt-4 flex items-center justify-center gap-1 shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Liability
            </button>
          </form>

          {/* Active Loans list */}
          <div className="border-t border-white/5 pt-6">
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Active Liabilities</h4>
            <div className="space-y-4">
              {liabilities.length === 0 ? (
                <div className="text-xs text-white/30 py-4 text-center border border-white/5 border-dashed rounded-xl">
                  No outstanding liabilities.
                </div>
              ) : (
                liabilities.map((loan: any, idx: number) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white text-xs">{loan.name}</div>
                      <div className="text-[10px] text-white/40 mt-1 leading-relaxed">
                        Principal: ₹ {loan.principal.toLocaleString()} | Rate: {Math.round(loan.interest_rate * 1000) / 10}% | Tenure: {loan.tenure_years} Years
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-white/40 uppercase">Monthly EMI</span>
                        <div className="text-sm font-bold text-white font-mono">₹ {Math.round(loan.emi).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => onDeleteLiability(loan.name)}
                        className="text-white/40 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
