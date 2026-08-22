from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app import schemas
from app.repositories import user_repository, financial_repository
from app import optimizer, models
from app.database import get_db
from app.services.simulation_service import get_sim_inputs
from engine.simulation import Goal

router = APIRouter(prefix="/api/users", tags=["Optimization"])

@router.post("/{user_id}/optimize/{goal_id}", response_model=schemas.OptimizationResponse)
def optimize_user_goal(
    user_id: int,
    goal_id: int,
    target_probability: float = 0.80,
    db: Session = Depends(get_db)
):
    db_user = user_repository.get_user(db, user_id=user_id)
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

@router.get("/{user_id}/goals/{goal_id}/sensitivity", response_model=schemas.SensitivityAnalysisResponse)
def get_goal_sensitivity(
    user_id: int,
    goal_id: int,
    db: Session = Depends(get_db)
):
    db_user = user_repository.get_user(db, user_id=user_id)
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

@router.post("/{user_id}/optimize-multi-objective", response_model=schemas.MultiObjectiveResponse)
def optimize_user_multi_objective(
    user_id: int,
    db: Session = Depends(get_db)
):
    db_user = user_repository.get_user(db, user_id=user_id)
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
