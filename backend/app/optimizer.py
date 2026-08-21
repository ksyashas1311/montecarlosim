import sys
import os
import copy
from typing import List, Optional, Dict, Any

# Add workspace root to python path to allow importing the engine
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if workspace_root not in sys.path:
    sys.path.append(workspace_root)

from engine.simulation import (
    MonteCarloEngine, UserProfile, AssetClass, LifeEvent, Goal, SimulationConfig, Liability
)

def run_fast_simulation(
    profile: UserProfile,
    assets: List[AssetClass],
    life_events: List[LifeEvent],
    goals: List[Goal],
    n_sims: int = 1000,
    liabilities: Optional[List[Liability]] = None
) -> float:
    """Helper to run a fast simulation for optimization purposes with fewer paths."""
    config = SimulationConfig(n_simulations=n_sims, horizon_years=40, random_seed=42)
    engine = MonteCarloEngine(profile, assets, config, life_events, liabilities=liabilities)
    res = engine.run(goals=goals)
    if res.goals:
        return res.goals[0].success_probability
    return 0.0

def run_simulation_metrics(
    profile: UserProfile,
    assets: List[AssetClass],
    life_events: List[LifeEvent],
    goals: List[Goal],
    liabilities: Optional[List[Liability]] = None,
    n_sims: int = 1000
) -> Dict[str, Any]:
    """Helper to run a fast simulation and return summary metrics."""
    config = SimulationConfig(n_simulations=n_sims, horizon_years=40, random_seed=42)
    engine = MonteCarloEngine(profile, assets, config, life_events, liabilities=liabilities)
    res = engine.run(goals=goals)
    return {
        "success_probability": res.goals[0].success_probability if res.goals else 0.0,
        "terminal_wealth_median": res.terminal_wealth_median,
        "max_drawdown": res.max_drawdown_p50,
        "ruin_probability": res.ruin_probability,
        "retirement_survival": res.retirement_survival_probability
    }

def optimize_goal(
    profile: UserProfile,
    assets: List[AssetClass],
    life_events: List[LifeEvent],
    goal: Goal,
    target_probability: float = 0.80,
    liabilities: Optional[List[Liability]] = None
) -> dict:
    """
    Given a goal and current profile, search the parameter space to find:
    Option A: Minimum SIP increase to achieve target_probability.
    Option B: Minimum retirement age delay to achieve target_probability.
    Option C: Best asset allocation adjustment to maximize probability.
    """
    results = {
        "goal_name": goal.name,
        "target_amount": goal.target_amount,
        "target_age": goal.target_age,
        "current_probability": 0.0,
        "target_probability": target_probability,
        "options": []
    }

    # 1. Run base case simulation
    current_prob = run_fast_simulation(profile, assets, life_events, [goal], n_sims=2000, liabilities=liabilities)
    results["current_probability"] = current_prob

    # ----------------------------------------------------
    # OPTION A: Increase Monthly SIP
    # ----------------------------------------------------
    low_sip = profile.monthly_sip
    max_savings = max(profile.monthly_income - profile.monthly_expenses, 0.0)
    high_sip = max(low_sip, max_savings, 200_000.0)

    opt_sip = low_sip
    opt_sip_prob = current_prob

    profile_test = copy.deepcopy(profile)
    profile_test.monthly_sip = high_sip
    high_prob = run_fast_simulation(profile_test, assets, life_events, [goal], n_sims=1000, liabilities=liabilities)

    if high_prob < target_probability:
        opt_sip = high_sip
        opt_sip_prob = high_prob
    else:
        for _ in range(8):
            mid_sip = (low_sip + high_sip) / 2
            profile_test.monthly_sip = mid_sip
            prob = run_fast_simulation(profile_test, assets, life_events, [goal], n_sims=1000, liabilities=liabilities)
            if prob >= target_probability:
                high_sip = mid_sip
                opt_sip = mid_sip
                opt_sip_prob = prob
            else:
                low_sip = mid_sip

    sip_diff = opt_sip - profile.monthly_sip
    if sip_diff > 1.0:
        results["options"].append({
            "option_type": "A",
            "description": f"Increase your monthly SIP by ₹{sip_diff:,.0f} (to ₹{opt_sip:,.0f}/month)",
            "success_probability": round(opt_sip_prob, 4),
            "parameters": {"monthly_sip": round(opt_sip, 2), "sip_increase": round(sip_diff, 2)}
        })
    else:
        results["options"].append({
            "option_type": "A",
            "description": "Your current SIP is already optimal or sufficient to reach this target.",
            "success_probability": round(current_prob, 4),
            "parameters": {"monthly_sip": round(profile.monthly_sip, 2), "sip_increase": 0.0}
        })

    # ----------------------------------------------------
    # OPTION B: Retire Later (Delay Target Age)
    # ----------------------------------------------------
    opt_age = goal.target_age
    opt_age_prob = current_prob
    
    if current_prob < target_probability:
        max_age = min(75, profile.current_age + 40)
        found = False
        for age in range(goal.target_age + 1, max_age + 1):
            goal_test = copy.deepcopy(goal)
            goal_test.target_age = age
            prob = run_fast_simulation(profile, assets, life_events, [goal_test], n_sims=1000, liabilities=liabilities)
            if prob >= target_probability:
                opt_age = age
                opt_age_prob = prob
                found = True
                break
            if prob > opt_age_prob:
                opt_age = age
                opt_age_prob = prob
        
        if found or opt_age > goal.target_age:
            results["options"].append({
                "option_type": "B",
                "description": f"Delay retirement / goal achievement by {opt_age - goal.target_age} years (to age {opt_age})",
                "success_probability": round(opt_age_prob, 4),
                "parameters": {"target_age": opt_age, "delay_years": opt_age - goal.target_age}
            })
    else:
        min_age = profile.current_age + 1
        earliest_age = goal.target_age
        earliest_prob = current_prob
        for age in range(goal.target_age - 1, min_age - 1, -1):
            goal_test = copy.deepcopy(goal)
            goal_test.target_age = age
            prob = run_fast_simulation(profile, assets, life_events, [goal_test], n_sims=1000, liabilities=liabilities)
            if prob >= target_probability:
                earliest_age = age
                earliest_prob = prob
            else:
                break
        
        if earliest_age < goal.target_age:
            results["options"].append({
                "option_type": "B",
                "description": f"Retire earlier! You can achieve this goal at age {earliest_age} with a {earliest_prob:.1%} success rate.",
                "success_probability": round(earliest_prob, 4),
                "parameters": {"target_age": earliest_age, "earlier_years": goal.target_age - earliest_age}
            })
        else:
            results["options"].append({
                "option_type": "B",
                "description": "Retiring at your current target age is optimal.",
                "success_probability": round(current_prob, 4),
                "parameters": {"target_age": goal.target_age, "delay_years": 0}
            })

    # ----------------------------------------------------
    # OPTION C: Optimize Asset Allocation
    # ----------------------------------------------------
    total_non_equity = sum(a.weight for a in assets if a.name != "Equity")
    best_assets = assets
    best_prob = current_prob
    best_equity_weight = next((a.weight for a in assets if a.name == "Equity"), 0.5)

    for eq_w in [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
        new_assets = []
        for a in assets:
            new_a = copy.deepcopy(a)
            if a.name == "Equity":
                new_a.weight = eq_w
            else:
                if total_non_equity > 0:
                    new_a.weight = a.weight * (1.0 - eq_w) / total_non_equity
                else:
                    other_count = len(assets) - 1
                    new_a.weight = (1.0 - eq_w) / max(other_count, 1)
            new_assets.append(new_a)
        
        prob = run_fast_simulation(profile, new_assets, life_events, [goal], n_sims=1000, liabilities=liabilities)
        if prob > best_prob + 0.02:
            best_prob = prob
            best_assets = new_assets
            best_equity_weight = eq_w

    if best_prob > current_prob + 0.02:
        asset_details = {a.name: round(a.weight, 2) for a in best_assets}
        results["options"].append({
            "option_type": "C",
            "description": f"Adjust asset allocation to {best_equity_weight:.0%} Equity (increases success probability to {best_prob:.1%})",
            "success_probability": round(best_prob, 4),
            "parameters": {"assets": asset_details}
        })
    else:
        results["options"].append({
            "option_type": "C",
            "description": "Your current asset allocation is already optimal or very close to it.",
            "success_probability": round(current_prob, 4),
            "parameters": {"assets": {a.name: round(a.weight, 2) for a in assets}}
        })

    # ----------------------------------------------------
    # OPTION D: Combined Strategy (Moderate SIP + Moderate Retirement Delay)
    # ----------------------------------------------------
    if current_prob < target_probability:
        # We attempt to find a compromise: delay retirement by 2 years, then find required SIP
        compromise_delay = 2
        goal_test = copy.deepcopy(goal)
        goal_test.target_age += compromise_delay
        
        # Now binary search for the required SIP under this new target age
        low_sip = profile.monthly_sip
        high_sip = max(low_sip, max_savings, 200_000.0)
        opt_comb_sip = low_sip
        opt_comb_prob = current_prob
        
        profile_test = copy.deepcopy(profile)
        profile_test.monthly_sip = high_sip
        high_comb_prob = run_fast_simulation(profile_test, assets, life_events, [goal_test], n_sims=1000, liabilities=liabilities)
        
        if high_comb_prob >= target_probability:
            for _ in range(8):
                mid_sip = (low_sip + high_sip) / 2
                profile_test.monthly_sip = mid_sip
                prob = run_fast_simulation(profile_test, assets, life_events, [goal_test], n_sims=1000, liabilities=liabilities)
                if prob >= target_probability:
                    high_sip = mid_sip
                    opt_comb_sip = mid_sip
                    opt_comb_prob = prob
                else:
                    low_sip = mid_sip
                    
            comb_sip_diff = opt_comb_sip - profile.monthly_sip
            if comb_sip_diff > 1.0:
                results["options"].append({
                    "option_type": "D",
                    "description": f"Combined Strategy: Increase SIP by ₹{comb_sip_diff:,.0f} and delay goal by {compromise_delay} years (to age {goal.target_age + compromise_delay})",
                    "success_probability": round(opt_comb_prob, 4),
                    "parameters": {
                        "monthly_sip": round(opt_comb_sip, 2),
                        "sip_increase": round(comb_sip_diff, 2),
                        "target_age": goal.target_age + compromise_delay,
                        "delay_years": compromise_delay
                    }
                })

    return results

def optimize_multi_objective(
    profile: UserProfile,
    assets: List[AssetClass],
    life_events: List[LifeEvent],
    goals: List[Goal],
    liabilities: Optional[List[Liability]] = None
) -> dict:
    """
    Pareto Optimization (Phase 11): Returns Safe, Balanced, and Aggressive strategy profiles
    with computed success, terminal wealth, drawdowns, and ruin risk metrics.
    """
    goal = goals[0] if goals else Goal("Retirement", 10000000, 55)
    
    # 1. Safe Profile Setup
    # Low equity (30%), delay retirement by 3 years, increase SIP by 15%
    safe_profile = copy.deepcopy(profile)
    safe_profile.monthly_sip *= 1.15
    safe_profile.retirement_age += 3
    safe_goal = copy.deepcopy(goal)
    safe_goal.target_age += 3
    
    safe_assets = []
    for a in assets:
        new_a = copy.deepcopy(a)
        if a.name == "Equity":
            new_a.weight = 0.30
        elif a.name == "Debt":
            new_a.weight = 0.50
        elif a.name == "Cash":
            new_a.weight = 0.20
        else:
            new_a.weight = 0.0
        safe_assets.append(new_a)
    
    # 2. Balanced Profile Setup
    # Current values
    balanced_profile = copy.deepcopy(profile)
    balanced_assets = copy.deepcopy(assets)
    balanced_goal = copy.deepcopy(goal)
    
    # 3. Aggressive Profile Setup
    # High equity (85%), early retirement (target age - 4 years), increase SIP by 30%
    agg_profile = copy.deepcopy(profile)
    agg_profile.monthly_sip *= 1.30
    agg_profile.retirement_age = max(agg_profile.retirement_age - 4, profile.current_age + 5)
    agg_goal = copy.deepcopy(goal)
    agg_goal.target_age = max(agg_goal.target_age - 4, profile.current_age + 5)
    
    agg_assets = []
    for a in assets:
        new_a = copy.deepcopy(a)
        if a.name == "Equity":
            new_a.weight = 0.85
        elif a.name == "Debt":
            new_a.weight = 0.10
        elif a.name == "Gold":
            new_a.weight = 0.05
        else:
            new_a.weight = 0.0
        agg_assets.append(new_a)

    # Run simulations
    safe_metrics = run_simulation_metrics(safe_profile, safe_assets, life_events, [safe_goal], liabilities)
    balanced_metrics = run_simulation_metrics(balanced_profile, balanced_assets, life_events, [balanced_goal], liabilities)
    agg_metrics = run_simulation_metrics(agg_profile, agg_assets, life_events, [agg_goal], liabilities)

    return {
        "goal_name": goal.name,
        "strategies": [
            {
                "name": "Conservative (Safe)",
                "allocation": {"Equity": 0.30, "Debt": 0.50, "Cash": 0.20},
                "retirement_age": safe_profile.retirement_age,
                "sip_amount": round(safe_profile.monthly_sip, 2),
                "metrics": safe_metrics
            },
            {
                "name": "Balanced (Current Baseline)",
                "allocation": {a.name: round(a.weight, 2) for a in assets},
                "retirement_age": balanced_profile.retirement_age,
                "sip_amount": round(balanced_profile.monthly_sip, 2),
                "metrics": balanced_metrics
            },
            {
                "name": "Growth (Aggressive)",
                "allocation": {"Equity": 0.85, "Debt": 0.10, "Gold": 0.05},
                "retirement_age": agg_profile.retirement_age,
                "sip_amount": round(agg_profile.monthly_sip, 2),
                "metrics": agg_metrics
            }
        ]
    }

def analyze_sensitivity(
    profile: UserProfile,
    assets: List[AssetClass],
    life_events: List[LifeEvent],
    goal: Goal,
    liabilities: Optional[List[Liability]] = None
) -> dict:
    """Simulates modifications to inputs and measures impact on goal success probability."""
    base_prob = run_fast_simulation(profile, assets, life_events, [goal], n_sims=2000, liabilities=liabilities)
    factors = []

    # 1. Monthly SIP (+20% increase)
    profile_sip = copy.deepcopy(profile)
    profile_sip.monthly_sip *= 1.20
    sip_prob = run_fast_simulation(profile_sip, assets, life_events, [goal], n_sims=1000, liabilities=liabilities)
    impact = sip_prob - base_prob
    factors.append({
        "factor": "Monthly SIP",
        "impact_score": round(abs(impact), 4),
        "direction": "positive" if impact >= 0 else "negative",
        "description": f"Increasing monthly SIP by 20% shifts success probability by {impact:+.1%}"
    })

    # 2. Asset Returns (+1% overall annual return)
    assets_ret = copy.deepcopy(assets)
    for a in assets_ret:
        a.expected_return += 0.01
    ret_prob = run_fast_simulation(profile, assets_ret, life_events, [goal], n_sims=1000, liabilities=liabilities)
    impact = ret_prob - base_prob
    factors.append({
        "factor": "Asset Returns",
        "impact_score": round(abs(impact), 4),
        "direction": "positive" if impact >= 0 else "negative",
        "description": f"A 1% increase in average market returns shifts success probability by {impact:+.1%}"
    })

    # 3. Inflation (+1.5% spike)
    profile_inf = copy.deepcopy(profile)
    profile_inf.inflation_mean += 0.015
    inf_prob = run_fast_simulation(profile_inf, assets, life_events, [goal], n_sims=1000, liabilities=liabilities)
    impact = inf_prob - base_prob
    factors.append({
        "factor": "Inflation",
        "impact_score": round(abs(impact), 4),
        "direction": "positive" if impact >= 0 else "negative",
        "description": f"A 1.5% inflation surge shifts success probability by {impact:+.1%}"
    })

    # 4. Monthly Expenses (+15% increase)
    profile_exp = copy.deepcopy(profile)
    profile_exp.monthly_expenses *= 1.15
    exp_prob = run_fast_simulation(profile_exp, assets, life_events, [goal], n_sims=1000, liabilities=liabilities)
    impact = exp_prob - base_prob
    factors.append({
        "factor": "Monthly Expenses",
        "impact_score": round(abs(impact), 4),
        "direction": "positive" if impact >= 0 else "negative",
        "description": f"Increasing monthly expenses by 15% shifts success probability by {impact:+.1%}"
    })

    # 5. Interest Rate Shock (+2.0% annual rate spike on liabilities)
    if liabilities:
        liabilities_stressed = copy.deepcopy(liabilities)
        for l in liabilities_stressed:
            l.interest_rate += 0.02
        rate_prob = run_fast_simulation(profile, assets, life_events, [goal], n_sims=1000, liabilities=liabilities_stressed)
        impact_rate = rate_prob - base_prob
        factors.append({
            "factor": "Interest Rates",
            "impact_score": round(abs(impact_rate), 4),
            "direction": "positive" if impact_rate >= 0 else "negative",
            "description": f"A 2.0% spike in loan interest rates shifts success probability by {impact_rate:+.1%}"
        })

    # Sort factors by impact score descending
    factors.sort(key=lambda x: x["impact_score"], reverse=True)

    return {
        "goal_name": goal.name,
        "base_probability": round(base_prob, 4),
        "factors": factors
    }

def run_stress_test(
    profile: UserProfile,
    assets: List[AssetClass],
    life_events: List[LifeEvent],
    goals: List[Goal],
    scenario_type: str,
    liabilities: Optional[List[Liability]] = None
) -> dict:
    """Runs a stressed Monte Carlo simulation by modifying profile/assets based on scenario type."""
    stressed_profile = copy.deepcopy(profile)
    stressed_assets = copy.deepcopy(assets)
    stressed_events = copy.deepcopy(life_events)
    stressed_liabilities = copy.deepcopy(liabilities) if liabilities else []

    scenario_name = ""
    description = ""

    if scenario_type == "market_crash":
        scenario_name = "Global Market Crash"
        description = "Simulates a major market correction: Equity expected returns drop to -15% with double the volatility (36%) for the initial years."
        for a in stressed_assets:
            if a.name == "Equity":
                a.expected_return = -0.15
                a.volatility = 0.36

    elif scenario_type == "hyperinflation":
        scenario_name = "Hyperinflation Spiral"
        description = "Simulates high-inflation crisis: annual inflation mean spikes to 12% with 4% volatility."
        stressed_profile.inflation_mean = 0.12
        stressed_profile.inflation_vol = 0.04

    elif scenario_type == "stagflation":
        scenario_name = "Stagflation Crisis"
        description = "Simulates stagnation + inflation: annual inflation spikes to 9% while returns drop by 4% across all asset classes."
        stressed_profile.inflation_mean = 0.09
        for a in stressed_assets:
            a.expected_return = max(a.expected_return - 0.04, 0.0)

    elif scenario_type == "career_disruption":
        scenario_name = "Sudden Career Disruption"
        disruption_age = profile.current_age + 5
        description = f"Simulates unexpected job loss at age {disruption_age} lasting for 12 months with 90% probability."
        
        # Inject career disruption event
        try:
            from engine.simluation import LifeEventType
            job_loss_type = LifeEventType.JOB_LOSS
        except Exception:
            job_loss_type = "job_loss"
            
        job_loss_event = LifeEvent(
            name="Stressed Job Loss",
            type=job_loss_type,
            age=disruption_age,
            amount=0,
            duration_years=1,
            probability=0.9,
            income_factor=0.0
        )
        stressed_events.append(job_loss_event)

    else:
        raise ValueError(f"Unknown stress scenario type: {scenario_type}")

    # Run baseline probabilities (fast run)
    base_probs = {}
    for g in goals:
        base_probs[g.name] = run_fast_simulation(profile, assets, life_events, [g], n_sims=1000, liabilities=liabilities)

    # Run stressed simulation (full 10,000 runs to match complete simulation schema)
    config = SimulationConfig(n_simulations=10000, horizon_years=40, random_seed=42)
    
    # Simple correlation matrix
    n_assets = len(stressed_assets)
    import numpy as np
    correlation_matrix = np.full((n_assets, n_assets), 0.2)
    np.fill_diagonal(correlation_matrix, 1.0)

    engine = MonteCarloEngine(
        profile=stressed_profile,
        assets=stressed_assets,
        config=config,
        life_events=stressed_events,
        correlation_matrix=correlation_matrix,
        liabilities=stressed_liabilities
    )
    stressed_result = engine.run(goals=goals)

    # Collect compared goal results
    goal_comparison = []
    for g in stressed_result.goals:
        base_p = base_probs.get(g.name, 0.0)
        goal_comparison.append({
            "name": g.name,
            "base_probability": round(base_p, 4),
            "stressed_probability": round(g.success_probability, 4),
            "impact": round(g.success_probability - base_p, 4)
        })

    # Return structure matching schemas.StressTestResponse
    return {
        "scenario_name": scenario_name,
        "description": description,
        "goals": goal_comparison,
        "stressed_simulation": stressed_result
    }
