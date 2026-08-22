from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.repositories import user_repository, financial_repository
from app import copilot
from app.database import get_db
from app.services.simulation_service import get_sim_inputs
from engine.simulation import UserProfile, AssetClass, SimulationConfig, MonteCarloEngine

router = APIRouter(prefix="/api/users", tags=["AI Copilot"])

@router.post("/{user_id}/copilot", response_model=schemas.ChatResponse)
def query_copilot(
    user_id: int,
    request: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    db_user = user_repository.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
    except HTTPException:
        profile = UserProfile(30, 50000, 30000, 10000, 100000, retirement_age=55)
        assets = [AssetClass("Equity", 1.0, 0.12, 0.18)]
        goals = []
        life_events = []
        liabilities = []

    profile_dict = profile.__dict__
    goals_list = [g.__dict__ for g in goals]
    events_list = [e.__dict__ for e in life_events]
    liabilities_list = [l.__dict__ for l in liabilities]
    
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
        except Exception:
            pass

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
    
    return schemas.ChatResponse(
        reply=copilot_result["reply"],
        extracted_action={
            "action_type": copilot_result["action_type"],
            "parameters": copilot_result["parameters"]
        }
    )
