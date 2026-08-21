#!/usr/bin/env python3
"""
simulation_engine.py
=====================

Core Monte Carlo simulation engine for FinTwin.
Probabilistic Financial Digital Twin with support for:
- Proper monthly debt amortization and available cash-flow calculations
- Three market return models: Parametric, Historical Bootstrap, and Regime-Switching
- Dynamic correlation by path regime
- Conditional Life Event dependencies
- Retirement decumulation phase with Guyton-Klinger Guardrails
- Advanced risk metrics (VaR, CVaR, ruin probability, depletion age)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Tuple, Any
import numpy as np

# --- Historical Indian Market returns data (2010 - 2024) ---
# Columns: Equity (Nifty 50), Debt (Liquid/G-Sec), Gold, Cash (FD)
HISTORICAL_RETURNS = np.array([
    [0.179, 0.065, 0.232, 0.070],    # 2010
    [-0.246, 0.072, 0.315, 0.0825],  # 2011
    [0.277, 0.085, 0.124, 0.0875],   # 2012
    [0.068, 0.078, -0.152, 0.0875],  # 2013
    [0.314, 0.083, -0.081, 0.085],   # 2014
    [-0.041, 0.078, -0.065, 0.0775],  # 2015
    [0.030, 0.072, 0.112, 0.0725],   # 2016
    [0.286, 0.065, 0.051, 0.0675],   # 2017
    [0.032, 0.068, 0.078, 0.0675],   # 2018
    [0.120, 0.075, 0.238, 0.065],    # 2019
    [0.149, 0.058, 0.280, 0.0525],   # 2020
    [0.241, 0.062, -0.042, 0.050],   # 2021
    [0.043, 0.068, 0.138, 0.0575],   # 2022
    [0.194, 0.072, 0.125, 0.0675],   # 2023
    [0.185, 0.068, 0.162, 0.0725],   # 2024
])

# --- Enums ---
class MarketModel(str, Enum):
    PARAMETRIC = "parametric"
    BOOTSTRAP = "bootstrap"
    REGIME_SWITCHING = "regime_switching"

class DecumulationStrategy(str, Enum):
    FIXED = "fixed"
    INFLATION_ADJUSTED = "inflation_adjusted"
    PERCENTAGE = "percentage"
    GUYTON_KLINGER = "guyton_klinger"

class LifeEventType(str, Enum):
    LUMP_SUM_EXPENSE = "lump_sum_expense"        # e.g. car/house down payment
    RECURRING_EXPENSE = "recurring_expense"       # e.g. EMI, school fees
    JOB_LOSS = "job_loss"                         # income drops to `income_factor` for a window
    INCOME_BOOST = "income_boost"                 # e.g. promotion, bonus income
    MARRIAGE = "marriage"                         # marriage event triggers conditional events
    HOUSE_PURCHASE = "house_purchase"             # triggers mortgage liability setup

# --- Input Structures ---
@dataclass
class AssetClass:
    name: str
    weight: float            # fraction, e.g. 0.60
    expected_return: float   # e.g. 0.12
    volatility: float        # e.g. 0.18

@dataclass
class Liability:
    name: str
    principal: float
    interest_rate: float      # annual interest rate, e.g. 0.08
    tenure_years: int
    start_age: int
    emi: float                # monthly emi
    prepayment_monthly: float = 0.0
    variable_rate_vol: float = 0.0   # annual interest rate volatility

@dataclass
class LifeEvent:
    name: str
    type: LifeEventType
    age: int                          # trigger age
    amount: float = 0.0               # cost or boost amount
    duration_years: int = 0           # duration for recurring
    probability: float = 1.0          # path probability
    income_factor: float = 0.0        # for job loss

@dataclass
class UserProfile:
    current_age: int
    monthly_income: float
    monthly_expenses: float
    monthly_sip: float
    current_wealth: float
    income_growth_mean: float = 0.08
    income_growth_vol: float = 0.03
    inflation_mean: float = 0.06
    inflation_vol: float = 0.015
    retirement_age: int = 55
    emergency_fund_target: float = 0.0  # target cash reserve

@dataclass
class SimulationConfig:
    n_simulations: int = 10_000
    horizon_years: int = 40
    random_seed: Optional[int] = 42
    market_model: MarketModel = MarketModel.PARAMETRIC
    decumulation_strategy: DecumulationStrategy = DecumulationStrategy.INFLATION_ADJUSTED
    target_withdrawal_rate: float = 0.04  # percentage withdrawal target
    regime_transition_matrix: Optional[Any] = None

@dataclass
class Goal:
    name: str
    target_amount: float
    target_age: int
    priority: str = "need"  # need vs want

# --- Output Structures ---
@dataclass
class GoalResult:
    name: str
    target_amount: float
    target_age: int
    success_probability: float
    wealth_at_target_p5: float
    wealth_at_target_p50: float
    wealth_at_target_p95: float

@dataclass
class SimulationResult:
    ages: list
    percentiles: dict
    mean_wealth: list
    terminal_wealth_mean: float
    terminal_wealth_median: float
    var_95: float
    cvar_95: float
    max_drawdown_p50: float
    ruin_probability: float
    median_depletion_age: Optional[float]
    retirement_survival_probability: float
    goals: list[GoalResult]
    n_simulations: int
    wealth_paths_sample: list

# --- Engine ---
class MonteCarloEngine:
    def __init__(
        self,
        profile: UserProfile,
        assets: list[AssetClass],
        config: Optional[SimulationConfig] = None,
        life_events: Optional[list[LifeEvent]] = None,
        correlation_matrix: Optional[np.ndarray] = None,
        liabilities: Optional[list[Liability]] = None,
    ):
        self.profile = profile
        self.assets = assets
        self.config = config or SimulationConfig()
        self.life_events = life_events or []
        self.liabilities = liabilities or []

        # Validate asset weights
        weights = np.array([a.weight for a in assets], dtype=float)
        if len(assets) > 0:
            if not np.isclose(weights.sum(), 1.0, atol=1e-3):
                raise ValueError(f"Asset weights must sum to 1.0, got {weights.sum():.3f}")
        self.weights = weights
        self.means = np.array([a.expected_return for a in assets], dtype=float)
        self.vols = np.array([a.volatility for a in assets], dtype=float)

        # Base correlation matrix validation
        n_assets = len(assets)
        if correlation_matrix is None:
            correlation_matrix = np.full((n_assets, n_assets), 0.2)
            np.fill_diagonal(correlation_matrix, 1.0)
        
        # Verify PSD and symmetry
        if not np.allclose(correlation_matrix, correlation_matrix.T):
            raise ValueError("Correlation matrix must be symmetric")
        if not np.all(np.linalg.eigvals(correlation_matrix) >= -1e-8):
            raise ValueError("Correlation matrix must be positive semi-definite")
            
        self.correlation_matrix = correlation_matrix
        self._cholesky = np.linalg.cholesky(correlation_matrix)
        self.rng = np.random.default_rng(self.config.random_seed)

    # --- Market Return Models ---
    def _generate_returns(self, n_sims: int, n_years: int, regimes: np.ndarray) -> np.ndarray:
        """Returns array of shape (n_sims, n_years) representing portfolio returns."""
        n_assets = len(self.assets)
        if n_assets == 0:
            return np.zeros((n_sims, n_years))

        if self.config.market_model == MarketModel.BOOTSTRAP:
            # Historical Bootstrap Return Sampler
            n_obs = len(HISTORICAL_RETURNS)
            idxs = self.rng.choice(n_obs, size=(n_sims, n_years))
            obs_returns = HISTORICAL_RETURNS[idxs]  # (n_sims, n_years, 4)
            # Map columns to assets (assuming standard Asset allocation matches Equity, Debt, Gold, Cash order)
            mapped_returns = np.zeros((n_sims, n_years, n_assets))
            for i in range(min(n_assets, 4)):
                mapped_returns[:, :, i] = obs_returns[:, :, i]
            portfolio_returns = mapped_returns @ self.weights
            return portfolio_returns

        elif self.config.market_model == MarketModel.REGIME_SWITCHING:
            # Markov Regime-Switching Monte Carlo with Dynamic Correlation
            z = self.rng.standard_normal((n_sims, n_years, n_assets))
            
            # Dynamic Cholesky Matrices: Base vs Crisis
            corr_base = self.correlation_matrix
            L_base = self._cholesky
            # Crisis correlation is elevated (0.6)
            corr_crisis = np.full((n_assets, n_assets), 0.6)
            np.fill_diagonal(corr_crisis, 1.0)
            L_crisis = np.linalg.cholesky(corr_crisis)

            z_correlated = np.empty_like(z)
            is_crisis = (regimes == 3)  # CRISIS is index 3
            
            # Apply dynamic correlation structure
            z_correlated[is_crisis] = z[is_crisis] @ L_crisis.T
            z_correlated[~is_crisis] = z[~is_crisis] @ L_base.T

            # Regime modifications to Expected Return and Volatility
            # Regimes: BULL(0), NORMAL(1), BEAR(2), CRISIS(3), RECOVERY(4)
            returns_mod = np.zeros((n_sims, n_years, n_assets))
            vols_mod = np.ones((n_sims, n_years, n_assets))

            returns_mod[regimes == 0] = 0.03
            returns_mod[regimes == 2] = -0.05
            returns_mod[regimes == 3] = -0.15
            returns_mod[regimes == 4] = 0.04

            vols_mod[regimes == 0] = 0.8
            vols_mod[regimes == 2] = 1.3
            vols_mod[regimes == 3] = 1.8
            vols_mod[regimes == 4] = 1.1

            means_base = self.means[np.newaxis, np.newaxis, :]
            vols_base = self.vols[np.newaxis, np.newaxis, :]

            asset_returns = (means_base + returns_mod) + (vols_base * vols_mod) * z_correlated
            portfolio_returns = asset_returns @ self.weights
            return portfolio_returns

        else:
            # Default: Parametric Monte Carlo (correlated returns)
            z = self.rng.standard_normal((n_sims, n_years, n_assets))
            z_correlated = z @ self._cholesky.T
            asset_returns = self.means + self.vols * z_correlated
            portfolio_returns = asset_returns @ self.weights
            return portfolio_returns

    def _simulate_regimes(self, n_sims: int, n_years: int) -> np.ndarray:
        """Markov Transition Chain Matrix Simulation."""
        # Regimes: BULL(0), NORMAL(1), BEAR(2), CRISIS(3), RECOVERY(4)
        P = self.config.regime_transition_matrix
        if P is None:
            P = np.array([
                [0.60, 0.30, 0.08, 0.02, 0.00],  # BULL
                [0.15, 0.65, 0.15, 0.03, 0.02],  # NORMAL
                [0.05, 0.25, 0.50, 0.15, 0.05],  # BEAR
                [0.00, 0.05, 0.30, 0.45, 0.20],  # CRISIS
                [0.20, 0.30, 0.05, 0.05, 0.40]   # RECOVERY
            ])
        
        regimes = np.zeros((n_sims, n_years), dtype=int)
        # Starting regime is NORMAL (1) for all paths
        current_regime = np.ones(n_sims, dtype=int)
        
        for t in range(n_years):
            # Transition paths using probability matrix P
            for path in range(n_sims):
                r = current_regime[path]
                probs = P[r]
                current_regime[path] = self.rng.choice(5, p=probs)
            regimes[:, t] = current_regime
            
        return regimes

    # --- Life Event Dependencies (Marriage -> Child -> Mortgage) ---
    def _apply_life_events_dynamic(
        self,
        n_sims: int,
        n_years: int,
        ages: np.ndarray,
        paths_marriage: np.ndarray, # Tracks marriage year per path (-1 if none)
        injected_mortgages: list[dict] # Appends spawned mortgage details here
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Build three (n_sims, n_years) modifier arrays:
          income_factor_mult : multiplies annual income (1.0 = unaffected)
          extra_annual_expense : rupees added to that year's expenses
          lump_sum_wealth_hit : rupees subtracted from wealth in that year
        """
        income_factor_mult = np.ones((n_sims, n_years))
        extra_annual_expense = np.zeros((n_sims, n_years))
        lump_sum_wealth_hit = np.zeros((n_sims, n_years))

        for event in self.life_events:
            # Decide which paths this event fires in
            if event.probability >= 1.0:
                active_sims = np.ones(n_sims, dtype=bool)
            else:
                active_sims = self.rng.random(n_sims) < event.probability

            if not active_sims.any():
                continue

            year_idx = event.age - self.profile.current_age
            if year_idx < 0 or year_idx >= n_years:
                continue

            # Record marriage year for conditional events
            if event.type == LifeEventType.MARRIAGE:
                paths_marriage[active_sims] = year_idx

            if event.type == LifeEventType.LUMP_SUM_EXPENSE:
                lump_sum_wealth_hit[active_sims, year_idx] += event.amount

            elif event.type == LifeEventType.RECURRING_EXPENSE:
                end = min(year_idx + max(event.duration_years, 1), n_years)
                extra_annual_expense[active_sims, year_idx:end] += event.amount

            elif event.type == LifeEventType.INCOME_BOOST:
                end = min(year_idx + max(event.duration_years, 1), n_years)
                income_factor_mult[active_sims, year_idx:end] *= (1.0 + event.amount)

            elif event.type == LifeEventType.JOB_LOSS:
                end = min(year_idx + max(event.duration_years, 1), n_years)
                income_factor_mult[active_sims, year_idx:end] *= event.income_factor

            elif event.type == LifeEventType.HOUSE_PURCHASE:
                # Trigger Mortgage Setup: down payment + EMI mortgage liability
                down_payment = event.amount * 0.20
                lump_sum_wealth_hit[active_sims, year_idx] += down_payment
                
                loan_amt = event.amount * 0.80
                injected_mortgages.append({
                    "name": f"Mortgage ({event.name})",
                    "principal": loan_amt,
                    "interest_rate": 0.085,
                    "tenure_years": 20,
                    "start_age": event.age,
                    "prepayment_monthly": 0.0,
                    "active_sims": active_sims.copy()
                })

        # --- Conditional Events ---
        # 1. Child Education cost 3 years after Marriage (if marriage occurs)
        has_marriage = (paths_marriage >= 0)
        if has_marriage.any():
            for i in range(n_sims):
                if has_marriage[i]:
                    m_year = int(paths_marriage[i])
                    edu_year = m_year + 3
                    if edu_year < n_years:
                        # Add child education cost (₹2,50,000/year for 5 years)
                        end_edu = min(edu_year + 5, n_years)
                        extra_annual_expense[i, edu_year:end_edu] += 250_000.0

        return income_factor_mult, extra_annual_expense, lump_sum_wealth_hit

    # --- Run Loop ---
    def run(self, goals: Optional[list[Goal]] = None) -> SimulationResult:
        p = self.profile
        n_sims = self.config.n_simulations
        n_years = self.config.horizon_years
        goals = goals or []

        ages = p.current_age + np.arange(n_years + 1)

        # 1. Regimes transition
        regimes = self._simulate_regimes(n_sims, n_years)
        
        # 2. Portfolio return paths
        portfolio_returns = self._generate_returns(n_sims, n_years, regimes)

        # 3. Dynamic life events
        paths_marriage = np.full(n_sims, -1, dtype=int)
        injected_mortgages = []
        income_mult, extra_expense, lump_sum_hit = self._apply_life_events_dynamic(
            n_sims, n_years, ages, paths_marriage, injected_mortgages
        )

        # 4. Initialize dynamic liabilities
        active_loans = []
        for l in self.liabilities:
            active_loans.append({
                "name": l.name,
                "balance": np.full(n_sims, l.principal, dtype=float),
                "interest_rate": l.interest_rate,
                "tenure_years": l.tenure_years,
                "start_age": l.start_age,
                "emi": l.emi,
                "prepayment_monthly": l.prepayment_monthly,
                "variable_rate_vol": l.variable_rate_vol,
                "active_sims": np.ones(n_sims, dtype=bool)
            })

        # Income, Expenses, Inflation parameters
        income_growth = self.rng.normal(
            p.income_growth_mean, p.income_growth_vol, size=(n_sims, n_years)
        )
        # Scale inflation if in CRISIS regime
        inflation_base = self.rng.normal(
            p.inflation_mean, p.inflation_vol, size=(n_sims, n_years)
        )
        inflation = np.where(regimes == 3, inflation_base + 0.03, inflation_base)

        wealth = np.empty((n_sims, n_years + 1))
        wealth[:, 0] = p.current_wealth

        annual_income = np.full(n_sims, p.monthly_income * 12.0)
        annual_expenses = np.full(n_sims, p.monthly_expenses * 12.0)
        annual_sip = p.monthly_sip * 12.0

        # Survival tracking
        ruin_years = np.full(n_sims, -1, dtype=int)
        
        # Decumulation parameters
        base_retirement_expense = p.monthly_expenses * 12.0
        decumulation_withdrawals = np.zeros(n_sims)
        initial_withdrawal_rate = self.config.target_withdrawal_rate

        # Simulation loop
        for t in range(n_years):
            age = p.current_age + t
            
            # --- Spawn Injected Mortgages ---
            for mortgage in injected_mortgages:
                if mortgage["start_age"] == age:
                    # Calculate mortgage initial EMI
                    r_m = mortgage["interest_rate"] / 12.0
                    N = mortgage["tenure_years"] * 12
                    emi = mortgage["principal"] * (r_m * (1+r_m)**N) / ((1+r_m)**N - 1)
                    
                    active_loans.append({
                        "name": mortgage["name"],
                        "balance": np.where(mortgage["active_sims"], mortgage["principal"], 0.0),
                        "interest_rate": mortgage["interest_rate"],
                        "tenure_years": mortgage["tenure_years"],
                        "start_age": mortgage["start_age"],
                        "emi": emi,
                        "prepayment_monthly": mortgage["prepayment_monthly"],
                        "variable_rate_vol": 0.0,
                        "active_sims": mortgage["active_sims"]
                    })
            # Clear injected mortgages that have been initialized
            injected_mortgages = [m for m in injected_mortgages if m["start_age"] > age]

            # --- Debt Amortization monthly loop ---
            annual_emi_payments = np.zeros(n_sims)
            for loan in active_loans:
                # Check if loan is active for this year
                if age >= loan["start_age"] and age < loan["start_age"] + loan["tenure_years"]:
                    for month in range(12):
                        # Variable rate check
                        if loan["variable_rate_vol"] > 0:
                            shock = self.rng.normal(0, loan["variable_rate_vol"] / np.sqrt(12.0), size=n_sims)
                            rate_m = (loan["interest_rate"] + shock) / 12.0
                            rate_m = np.maximum(rate_m, 0.0)
                        else:
                            r_val = loan["interest_rate"]
                            rate_m = np.full(n_sims, r_val / 12.0)

                        interest = loan["balance"] * rate_m
                        # Payment capped by principal balance + interest accrued
                        payment = np.minimum(loan["emi"] + loan["prepayment_monthly"], loan["balance"] + interest)
                        
                        # Apply path validation: payment only occurs if loan has balance and is active
                        payment = np.where(loan["balance"] > 0, payment, 0.0)
                        loan["balance"] = loan["balance"] + interest - payment
                        annual_emi_payments += payment

            # --- Income and expenses update ---
            if age < p.retirement_age:
                # Accumulation Phase
                annual_income = annual_income * (1.0 + income_growth[:, t]) * income_mult[:, t]
                annual_expenses = annual_expenses * (1.0 + inflation[:, t]) + extra_expense[:, t]

                # Cash flow and investments
                available_cashflow = np.maximum(annual_income - annual_expenses - annual_emi_payments, 0.0)
                contribution = np.minimum(annual_sip, available_cashflow)
                
                wealth[:, t + 1] = (
                    wealth[:, t] * (1.0 + portfolio_returns[:, t])
                    + contribution
                    - lump_sum_hit[:, t]
                )
            else:
                # Decumulation Phase (Retirement)
                # Salary is zero
                annual_income = np.zeros(n_sims)
                
                # Base withdrawal target
                if t == 0 or age == p.retirement_age:
                    decumulation_withdrawals = np.full(n_sims, base_retirement_expense)

                # Inflation-adjusted decumulation
                annual_expenses = annual_expenses * (1.0 + inflation[:, t]) + extra_expense[:, t]

                # Decumulation Strategy selections
                if self.config.decumulation_strategy == DecumulationStrategy.PERCENTAGE:
                    # Constant % of portfolio
                    withdrawal = wealth[:, t] * initial_withdrawal_rate
                elif self.config.decumulation_strategy == DecumulationStrategy.GUYTON_KLINGER:
                    # Guardrails Strategy
                    base_wd = decumulation_withdrawals * (1.0 + inflation[:, t])
                    current_rate = np.divide(base_wd, wealth[:, t], out=np.zeros_like(base_wd), where=wealth[:, t] > 0)
                    
                    # Capital preservation and prosperity rules (20% threshold, 10% adjustments)
                    reduce_cond = (current_rate > initial_withdrawal_rate * 1.2)
                    increase_cond = (current_rate < initial_withdrawal_rate * 0.8) & (wealth[:, t] > 0)

                    withdrawal = base_wd.copy()
                    withdrawal[reduce_cond] *= 0.9
                    withdrawal[increase_cond] *= 1.1
                    decumulation_withdrawals = withdrawal.copy()
                else:
                    # Default: Inflation adjusted
                    withdrawal = base_retirement_expense * np.prod(1.0 + inflation[:, :t+1], axis=1)
                
                # Total decumulation hit (expenses + EMIs if loan tenure runs into retirement)
                total_outflow = withdrawal + annual_emi_payments + lump_sum_hit[:, t]

                wealth[:, t + 1] = wealth[:, t] * (1.0 + portfolio_returns[:, t]) - total_outflow

            # Floor wealth at zero (ruin)
            ruin_cond = (wealth[:, t + 1] <= 0.0)
            wealth[:, t + 1] = np.maximum(wealth[:, t + 1], 0.0)
            
            # Record ruin age
            new_ruin = ruin_cond & (ruin_years == -1)
            ruin_years[new_ruin] = age

        # --- Aggregate Risk Metrics (Phase 8) ---
        percentiles = {
            "p5": np.percentile(wealth, 5, axis=0).tolist(),
            "p10": np.percentile(wealth, 10, axis=0).tolist(),
            "p25": np.percentile(wealth, 25, axis=0).tolist(),
            "p50": np.percentile(wealth, 50, axis=0).tolist(),
            "p75": np.percentile(wealth, 75, axis=0).tolist(),
            "p90": np.percentile(wealth, 90, axis=0).tolist(),
            "p95": np.percentile(wealth, 95, axis=0).tolist(),
        }
        mean_wealth = wealth.mean(axis=0).tolist()

        terminal = wealth[:, -1]
        terminal_median = float(np.median(terminal))
        
        # 95% Value-at-Risk (Median vs 5th percentile loss)
        var_95_threshold = float(np.percentile(terminal, 5))
        var_95 = float(np.maximum(terminal_median - var_95_threshold, 0.0))
        
        # 95% CVaR / Expected Shortfall (Average of worst 5% paths)
        cvar_95 = float(terminal[terminal <= var_95_threshold].mean()) if (terminal <= var_95_threshold).any() else var_95_threshold

        # Drawdowns
        running_max = np.maximum.accumulate(wealth, axis=1)
        drawdowns = np.divide(
            running_max - wealth, running_max,
            out=np.zeros_like(wealth), where=running_max > 0,
        )
        max_drawdown_per_path = drawdowns.max(axis=1)
        max_drawdown_p50 = float(np.median(max_drawdown_per_path))

        # Ruin analytics
        ruined_paths = (ruin_years >= 0)
        ruin_probability = float(ruined_paths.mean())
        median_depletion_age = float(np.median(ruin_years[ruined_paths])) if ruined_paths.any() else None

        # Retirement survival probability
        ret_index = max(p.retirement_age - p.current_age, 0)
        ret_index = min(ret_index, n_years)
        ruined_post_retirement = (ruin_years >= p.retirement_age)
        if ruined_paths.any():
            ret_survival = 1.0 - float(ruined_post_retirement.sum() / max(n_sims - (ruin_years < p.retirement_age).sum(), 1.0))
        else:
            ret_survival = 1.0

        # Goals Evaluation
        goal_results = []
        for g in goals:
            g_idx = g.target_age - p.current_age
            g_idx = min(max(g_idx, 0), n_years)
            wealth_at_target = wealth[:, g_idx]
            success_prob = float((wealth_at_target >= g.target_amount).mean())
            goal_results.append(GoalResult(
                name=g.name,
                target_amount=g.target_amount,
                target_age=g.target_age,
                success_probability=round(success_prob, 4),
                wealth_at_target_p5=float(np.percentile(wealth_at_target, 5)),
                wealth_at_target_p50=float(np.percentile(wealth_at_target, 50)),
                wealth_at_target_p95=float(np.percentile(wealth_at_target, 95)),
            ))

        sample_idx = self.rng.choice(n_sims, size=min(30, n_sims), replace=False)

        return SimulationResult(
            ages=ages.tolist(),
            percentiles=percentiles,
            mean_wealth=mean_wealth,
            terminal_wealth_mean=float(terminal.mean()),
            terminal_wealth_median=terminal_median,
            var_95=round(var_95, 2),
            cvar_95=round(cvar_95, 2),
            max_drawdown_p50=round(max_drawdown_p50, 4),
            ruin_probability=round(ruin_probability, 4),
            median_depletion_age=median_depletion_age,
            retirement_survival_probability=round(ret_survival, 4),
            goals=goal_results,
            n_simulations=n_sims,
            wealth_paths_sample=wealth[sample_idx].tolist(),
        )


# --- Sanity check ---
if __name__ == "__main__":
    profile = UserProfile(21, 50000, 30000, 10000, 100000, retirement_age=55)
    assets = [AssetClass("Equity", 0.60, 0.12, 0.18), AssetClass("Debt", 0.40, 0.07, 0.05)]
    liabilities = [Liability("Car loan", 300000, 0.08, 5, 22, 6000)]
    engine = MonteCarloEngine(profile, assets, liabilities=liabilities)
    res = engine.run(goals=[Goal("Retirement", 10000000, 55)])
    print(f"Ruin Probability: {res.ruin_probability:.2%}")
    print(f"Retirement Survival Probability: {res.retirement_survival_probability:.2%}")