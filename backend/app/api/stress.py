from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.repositories import user_repository, financial_repository
from app import optimizer
from app.database import get_db
from app.services.simulation_service import get_sim_inputs, STRESS_ALIASES
from app.core.security import verify_user_ownership

router = APIRouter(prefix="/api/users", tags=["Stress Testing"])

@router.post("/{user_id}/stress-test", response_model=schemas.StressTestResponse)
def run_user_stress_test(
    user_id: int,
    request: schemas.StressTestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    db_user = user_repository.get_user(db, user_id=user_id)
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
