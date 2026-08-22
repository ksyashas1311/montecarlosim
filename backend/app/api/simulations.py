from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas
from app.repositories import user_repository, financial_repository
from app import models
from app.database import get_db
from app.services.simulation_service import get_sim_inputs, sim_config_from_schema
from engine.simulation import MonteCarloEngine, UserProfile, AssetClass, Goal, LifeEvent
from app.core.security import verify_user_ownership

router = APIRouter(prefix="/api", tags=["Simulations"])

from app.worker import celery_app, run_simulation_task

@router.post("/users/{user_id}/simulate", response_model=schemas.SimulationJobResponse)
def simulate_user(
    user_id: int,
    config: Optional[schemas.SimulationConfigSchema] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    db_user = user_repository.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sim_config_dict = config.model_dump() if config else None
    
    # Dispatch task to Celery
    task = run_simulation_task.delay(user_id, sim_config_dict)
    
    return schemas.SimulationJobResponse(job_id=task.id, status="PENDING")

@router.get("/users/{user_id}/simulate/{job_id}", response_model=schemas.SimulationJobResult)
def get_simulation_status(
    user_id: int,
    job_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    from celery.result import AsyncResult
    task_result = AsyncResult(job_id, app=celery_app)
    
    if task_result.state == "PENDING":
        return schemas.SimulationJobResult(job_id=job_id, status="PENDING")
    elif task_result.state == "SUCCESS":
        result_data = task_result.result
        if "error" in result_data:
            return schemas.SimulationJobResult(job_id=job_id, status="FAILED", error=result_data["error"])
        return schemas.SimulationJobResult(job_id=job_id, status="SUCCESS", result=result_data)
    else:
        return schemas.SimulationJobResult(job_id=job_id, status=task_result.state)

@router.get("/users/{user_id}/simulate/history", response_model=List[dict])
def get_simulation_history(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    from app.models import SimulationRunModel
    runs = db.query(SimulationRunModel).filter(SimulationRunModel.user_id == user_id).order_by(SimulationRunModel.created_at.desc()).all()
    
    return [
        {
            "id": run.id,
            "job_id": run.job_id,
            "created_at": run.created_at,
            "status": run.status,
            "terminal_wealth_median": run.terminal_wealth_median,
            "ruin_probability": run.ruin_probability,
            "max_drawdown_p50": run.max_drawdown_p50
        }
        for run in runs
    ]

@router.post("/simulate", response_model=schemas.SimulationResponse)
def simulate_adhoc(
    profile: schemas.UserProfileBase,
    assets: List[schemas.AssetClassBase],
    goals: List[schemas.GoalBase],
    life_events: List[schemas.LifeEventBase],
    config: Optional[schemas.SimulationConfigSchema] = None
):
    try:
        sim_profile = UserProfile(**profile.model_dump())
        sim_assets = [AssetClass(**a.model_dump()) for a in assets]
        sim_goals = [Goal(**g.model_dump()) for g in goals]
        sim_events = [LifeEvent(**e.model_dump()) for e in life_events]
        
        sim_config = sim_config_from_schema(config)
        
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
