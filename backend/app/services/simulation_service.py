from typing import Optional, Any
from fastapi import HTTPException, status
from app import schemas, models
from engine.simulation import SimulationConfig, UserProfile, AssetClass, Goal, LifeEvent, Liability

MARKET_MODEL_ALIASES = {
    "historical_bootstrap": "bootstrap",
    "bootstrap": "bootstrap",
    "parametric": "parametric",
    "regime_switching": "regime_switching",
}
DECUMULATION_ALIASES = {
    "constant_percent": "percentage",
    "percentage": "percentage",
    "fixed": "fixed",
    "inflation_adjusted": "inflation_adjusted",
    "guyton_klinger": "guyton_klinger",
}
STRESS_ALIASES = {
    "career_shock": "career_disruption",
    "career_disruption": "career_disruption",
    "market_crash": "market_crash",
    "hyperinflation": "hyperinflation",
    "stagflation": "stagflation",
}

def sim_config_from_schema(config: Optional[Any]) -> SimulationConfig:
    if isinstance(config, dict):
        market_model = config.get("market_model", "parametric")
        decumulation_strategy = config.get("decumulation_strategy", "inflation_adjusted")
        n_simulations = config.get("n_simulations", 10000)
        horizon_years = config.get("horizon_years", 30)
        random_seed = config.get("random_seed", 42)
    else:
        market_model = config.market_model if config else "parametric"
        decumulation_strategy = config.decumulation_strategy if config else "inflation_adjusted"
        n_simulations = config.n_simulations if config else 10000
        horizon_years = config.horizon_years if config else 30
        random_seed = config.random_seed if config else 42

    market = MARKET_MODEL_ALIASES.get(market_model.lower(), market_model)
    decum = DECUMULATION_ALIASES.get(decumulation_strategy.lower(), decumulation_strategy)
    
    return SimulationConfig(
        n_simulations=n_simulations,
        horizon_years=horizon_years,
        random_seed=random_seed,
        market_model=market,
        decumulation_strategy=decum,
    )

def get_sim_inputs(db_user: models.User):
    if not db_user.profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have a financial profile configured."
        )
    
    profile = UserProfile(
        current_age=db_user.profile.current_age,
        monthly_income=db_user.profile.monthly_income,
        monthly_expenses=db_user.profile.monthly_expenses,
        monthly_sip=db_user.profile.monthly_sip,
        current_wealth=db_user.profile.current_wealth,
        income_growth_mean=db_user.profile.income_growth_mean,
        income_growth_vol=db_user.profile.income_growth_vol,
        inflation_mean=db_user.profile.inflation_mean,
        inflation_vol=db_user.profile.inflation_vol,
        retirement_age=getattr(db_user.profile, "retirement_age", None) or 55,
    )

    assets = [
        AssetClass(
            name=a.name,
            weight=a.weight,
            expected_return=a.expected_return,
            volatility=a.volatility
        )
        for a in db_user.assets
    ]
    if not assets:
        assets = [
            AssetClass("Equity", weight=0.60, expected_return=0.12, volatility=0.18),
            AssetClass("Debt", weight=0.25, expected_return=0.07, volatility=0.05),
            AssetClass("Gold", weight=0.10, expected_return=0.08, volatility=0.15),
            AssetClass("Cash", weight=0.05, expected_return=0.04, volatility=0.01),
        ]

    goals = [
        Goal(name=g.name, target_amount=g.target_amount, target_age=g.target_age)
        for g in db_user.goals
    ]

    life_events = [
        LifeEvent(
            name=e.name,
            type=e.type,
            age=e.age,
            amount=e.amount,
            duration_years=e.duration_years,
            probability=e.probability,
            income_factor=e.income_factor
        )
        for e in db_user.life_events
    ]

    liabilities = [
        Liability(
            name=l.name,
            principal=l.principal,
            interest_rate=l.interest_rate,
            tenure_years=l.tenure_years,
            start_age=l.start_age,
            emi=l.emi,
            prepayment_monthly=l.prepayment_monthly,
            variable_rate_vol=l.variable_rate_vol
        )
        for l in db_user.liabilities
    ]

    return profile, assets, goals, life_events, liabilities
