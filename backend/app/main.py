import sys
import os
<<<<<<< HEAD
from pathlib import Path
from typing import List, Optional, Dict, Any
=======
from typing import List, Optional
>>>>>>> e4b5d74 (feat: refactor backend architecture with improved configuration, schema aliases, and support for retirement age and user-friendly chat input.)
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

# backend/ and repo root so `app.*` and `engine.*` both resolve
_APP_DIR = os.path.abspath(os.path.dirname(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_APP_DIR, ".."))
_REPO_ROOT = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
for _p in (_BACKEND_DIR, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.append(_p)

from app import models, schemas, crud, optimizer, copilot
<<<<<<< HEAD
from app.database import engine, get_db
from engine.simulation import MonteCarloEngine, UserProfile, AssetClass, LifeEvent, Goal, SimulationConfig, Liability
=======
from app.database import engine, get_db, ensure_schema
from engine.simluation import MonteCarloEngine, UserProfile, AssetClass, LifeEvent, Goal, SimulationConfig, Liability
>>>>>>> e4b5d74 (feat: refactor backend architecture with improved configuration, schema aliases, and support for retirement age and user-friendly chat input.)

# Initialize database tables
models.Base.metadata.create_all(bind=engine)
ensure_schema()

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


def _sim_config_from_schema(config: Optional[schemas.SimulationConfigSchema]) -> SimulationConfig:
    market = MARKET_MODEL_ALIASES.get(
        (config.market_model if config else "parametric").lower(),
        config.market_model if config else "parametric",
    )
    decum = DECUMULATION_ALIASES.get(
        (config.decumulation_strategy if config else "inflation_adjusted").lower(),
        config.decumulation_strategy if config else "inflation_adjusted",
    )
    return SimulationConfig(
        n_simulations=config.n_simulations if config else 10000,
        horizon_years=config.horizon_years if config else 30,
        random_seed=config.random_seed if config else 42,
        market_model=market,
        decumulation_strategy=decum,
    )

app = FastAPI(
    title="FinTwin Backend API",
    description="REST API & Quantitative Simulation Engine for Personal Financial Digital Twin",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# Mount static files using project-relative path (gracefully skip if not built)
_BASE_DIR = Path(__file__).resolve().parents[2]  # Projects/
_FRONTEND_OUT = _BASE_DIR / "frontend" / "out"
if _FRONTEND_OUT.is_dir():
    app.mount("/static", StaticFiles(directory=str(_FRONTEND_OUT), html=True), name="static")
=======
_FRONTEND_OUT = os.path.join(_REPO_ROOT, "frontend", "out")
>>>>>>> e4b5d74 (feat: refactor backend architecture with improved configuration, schema aliases, and support for retirement age and user-friendly chat input.)

# --- Helper to map DB models to Sim Engine dataclasses ---
def get_sim_inputs(db_user: models.User):
    if not db_user.profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have a financial profile configured."
        )
    
    # 1. Profile
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

    # 2. Assets
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
        # Default fallback asset allocation if none is configured
        assets = [
            AssetClass("Equity", weight=0.60, expected_return=0.12, volatility=0.18),
            AssetClass("Debt", weight=0.25, expected_return=0.07, volatility=0.05),
            AssetClass("Gold", weight=0.10, expected_return=0.08, volatility=0.15),
            AssetClass("Cash", weight=0.05, expected_return=0.04, volatility=0.01),
        ]

    # 3. Goals
    goals = [
        Goal(name=g.name, target_amount=g.target_amount, target_age=g.target_age)
        for g in db_user.goals
    ]

    # 4. Life Events
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

    # 5. Liabilities
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


# --- User Endpoints ---
@app.post("/api/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)

@app.get("/api/users/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/api/users", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    if not crud.delete_user(db, user_id=user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}


# --- Digital Twin Config Endpoints ---
@app.put("/api/users/{user_id}/profile", response_model=schemas.UserProfileResponse)
def update_profile(user_id: int, profile: schemas.UserProfileCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user_profile(db, user_id=user_id, profile=profile)

@app.put("/api/users/{user_id}/assets", response_model=List[schemas.AssetClassResponse])
def update_assets(user_id: int, assets: List[schemas.AssetClassCreate], db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.set_user_assets(db, user_id=user_id, assets=assets)

@app.put("/api/users/{user_id}/goals", response_model=List[schemas.GoalResponse])
def update_goals(user_id: int, goals: List[schemas.GoalCreate], db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.set_user_goals(db, user_id=user_id, goals=goals)

@app.put("/api/users/{user_id}/life-events", response_model=List[schemas.LifeEventResponse])
def update_life_events(user_id: int, events: List[schemas.LifeEventCreate], db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.set_user_life_events(db, user_id=user_id, events=events)


@app.put("/api/users/{user_id}/liabilities", response_model=List[schemas.LiabilityResponse])
def update_liabilities(user_id: int, liabilities: List[schemas.LiabilityCreate], db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.set_user_liabilities(db, user_id=user_id, liabilities=liabilities)


# --- Simulation Endpoints ---
@app.post("/api/users/{user_id}/simulate", response_model=schemas.SimulationResponse)
def simulate_user(
    user_id: int,
    config: Optional[schemas.SimulationConfigSchema] = None,
    db: Session = Depends(get_db)
):
    """
    Runs Monte Carlo simulation for the specified User's Financial Digital Twin config.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
    
    sim_config = _sim_config_from_schema(config)

    try:
        engine = MonteCarloEngine(
            profile=profile,
            assets=assets,
            config=sim_config,
            life_events=life_events,
            liabilities=liabilities
        )
        result = engine.run(goals=goals)
        
        # Serialize simulation result matching schemas.SimulationResponse
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@app.post("/api/simulate", response_model=schemas.SimulationResponse)
def simulate_adhoc(
    profile: schemas.UserProfileBase,
    assets: List[schemas.AssetClassBase],
    goals: List[schemas.GoalBase],
    life_events: List[schemas.LifeEventBase],
    config: Optional[schemas.SimulationConfigSchema] = None
):
    """
    Runs a simulation with ad-hoc input data directly, bypassing the database completely.
    """
    try:
        import numpy as np
        sim_profile = UserProfile(**profile.model_dump())
        sim_assets = [AssetClass(**a.model_dump()) for a in assets]
        sim_goals = [Goal(**g.model_dump()) for g in goals]
        sim_events = [LifeEvent(**e.model_dump()) for e in life_events]
        
        sim_config = _sim_config_from_schema(config)
        
        engine = MonteCarloEngine(
            profile=sim_profile,
            assets=sim_assets,
            config=sim_config,
            life_events=sim_events
        )
        result = engine.run(goals=sim_goals)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ad-hoc simulation failed: {str(e)}")


# --- Optimization (Reverse Planning) ---
@app.post("/api/users/{user_id}/optimize/{goal_id}", response_model=schemas.OptimizationResponse)
def optimize_user_goal(
    user_id: int,
    goal_id: int,
    target_probability: float = 0.80,
    db: Session = Depends(get_db)
):
    """
    Run reverse-planning optimization searches for the selected goal.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_goal = db.query(models.GoalModel).filter(models.GoalModel.id == goal_id, models.GoalModel.user_id == user_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    profile, assets, _, life_events, liabilities = get_sim_inputs(db_user)
    goal = Goal(name=db_goal.name, target_amount=db_goal.target_amount, target_age=db_goal.target_age)
    
    try:
        opt_results = optimizer.optimize_goal(
            profile=profile,
            assets=assets,
            life_events=life_events,
            goal=goal,
            target_probability=target_probability,
            liabilities=liabilities
        )
        return opt_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


# --- AI Financial Copilot ---
@app.post("/api/users/{user_id}/copilot", response_model=schemas.ChatResponse)
def query_copilot(
    user_id: int,
    request: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Query the AI Copilot to analyze results or perform natural language twin configuration.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current digital twin state
    try:
        profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
    except HTTPException:
        # Fallback profile if user hasn't created one yet
        profile = UserProfile(30, 50000, 30000, 10000, 100000, retirement_age=55)
        assets = [AssetClass("Equity", 1.0, 0.12, 0.18)]
        goals = []
        life_events = []
        liabilities = []

    profile_dict = profile.__dict__
    goals_list = [g.__dict__ for g in goals]
    events_list = [e.__dict__ for e in life_events]
    liabilities_list = [l.__dict__ for l in liabilities]
    
    # Optionally compute latest simulation to feed to copilot context
    latest_sim = None
    if db_user.profile:
        try:
            import numpy as np
            n_assets = len(assets)
            correlation_matrix = np.full((n_assets, n_assets), 0.2)
            np.fill_diagonal(correlation_matrix, 1.0)
            engine = MonteCarloEngine(
                profile=profile,
                assets=assets,
                config=SimulationConfig(n_simulations=1000, horizon_years=30, random_seed=42),
                life_events=life_events,
                correlation_matrix=correlation_matrix,
                liabilities=liabilities
            )
            latest_sim = engine.run(goals=goals)
            # convert simulation output to simple dict for JSON serialization compatibility
            latest_sim = {
                "terminal_wealth_mean": latest_sim.terminal_wealth_mean,
                "terminal_wealth_median": latest_sim.terminal_wealth_median,
                "var_95": latest_sim.var_95,
                "cvar_95": latest_sim.cvar_95,
                "max_drawdown_p50": latest_sim.max_drawdown_p50,
                "ruin_probability": latest_sim.ruin_probability,
                "retirement_survival": latest_sim.retirement_survival_probability,
                "goals": [g.__dict__ for g in latest_sim.goals]
            }
        except Exception as e:
            # Swallow simulation calculation errors for copilot fallback
            pass

    # Map message list to simple role/content dictionaries
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    if request.message:
        messages.append({"role": "user", "content": request.message})
    
    copilot_result = copilot.chat_with_copilot(
        user_id=user_id,
        db=db,
        messages=messages,
        profile_data=profile_dict,
        goals_data=goals_list,
        life_events_data=events_list,
        latest_sim_results=latest_sim,
        liabilities_data=liabilities_list
    )
    
    # If the copilot extracted structural parameter modifications, we can optionally apply them
    # to the database or send them back in the response for the frontend to confirm.
    # We will return the extracted action in the response so the UI can prompt the user to apply it.
    
    return schemas.ChatResponse(
        reply=copilot_result["reply"],
        extracted_action={
            "action_type": copilot_result["action_type"],
            "parameters": copilot_result["parameters"]
        }
    )


# --- Sensitivity Analysis Route ---
@app.get("/api/users/{user_id}/goals/{goal_id}/sensitivity", response_model=schemas.SensitivityAnalysisResponse)
def get_goal_sensitivity(
    user_id: int,
    goal_id: int,
    db: Session = Depends(get_db)
):
    """
    Analyzes sensitivity of goal success probability to shifts in SIP, market return, inflation, and expenses.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_goal = db.query(models.GoalModel).filter(models.GoalModel.id == goal_id, models.GoalModel.user_id == user_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    profile, assets, _, life_events, liabilities = get_sim_inputs(db_user)
    goal = Goal(name=db_goal.name, target_amount=db_goal.target_amount, target_age=db_goal.target_age)
    
    try:
        sensitivity_results = optimizer.analyze_sensitivity(
            profile=profile,
            assets=assets,
            life_events=life_events,
            goal=goal,
            liabilities=liabilities
        )
        return sensitivity_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensitivity analysis failed: {str(e)}")


# --- Stress Testing Route ---
@app.post("/api/users/{user_id}/stress-test", response_model=schemas.StressTestResponse)
def run_user_stress_test(
    user_id: int,
    request: schemas.StressTestRequest,
    db: Session = Depends(get_db)
):
    """
    Runs a stressed Monte Carlo simulation (Market Crash, Hyperinflation, Stagflation, Career Disruption)
    and compares it to the baseline results.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
    
    try:
        stress_results = optimizer.run_stress_test(
            profile=profile,
            assets=assets,
            life_events=life_events,
            goals=goals,
            scenario_type=STRESS_ALIASES.get(request.scenario_type, request.scenario_type),
            liabilities=liabilities
        )
        return stress_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stress testing failed: {str(e)}")


# --- Multi-Objective Optimization Endpoint ---
@app.post("/api/users/{user_id}/optimize-multi-objective", response_model=schemas.MultiObjectiveResponse)
def optimize_user_multi_objective(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Run Pareto-style multi-objective strategy optimization for Safe, Balanced, and Aggressive profiles.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
    
    try:
        opt_results = optimizer.optimize_multi_objective(
            profile=profile,
            assets=assets,
            life_events=life_events,
            goals=goals,
            liabilities=liabilities
        )
        return opt_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-objective optimization failed: {str(e)}")


if os.path.isdir(_FRONTEND_OUT):
    app.mount("/", StaticFiles(directory=_FRONTEND_OUT, html=True), name="frontend")
