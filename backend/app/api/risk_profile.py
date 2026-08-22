from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas, models
from app.database import get_db
from app.core.security import get_current_user, verify_user_ownership
from app.repositories import user_repository, financial_repository, risk_repository
from app.services import risk_scoring

router = APIRouter(tags=["Risk Profile"])

@router.get("/risk-profile/questions", response_model=schemas.QuestionnaireMetadataResponse)
@router.get("/api/risk-profile/questions", response_model=schemas.QuestionnaireMetadataResponse)
def get_questionnaire_metadata():
    """Retrieve questionnaire structure, questions, weights, and scoring definitions."""
    return {
        "version": "v1",
        "questions": risk_scoring.QUESTION_METADATA,
        "risk_categories": risk_scoring.RISK_CATEGORIES,
    }


@router.get("/risk-profile", response_model=schemas.RiskProfileResponse)
@router.get("/api/risk-profile", response_model=schemas.RiskProfileResponse)
def get_current_user_risk_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieve the authenticated user's current risk profile assessment."""
    db_profile = risk_repository.get_risk_profile_by_user_id(db, user_id=current_user.id)
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk profile assessment not found for this user. Please complete the questionnaire."
        )
    return db_profile


@router.get("/api/users/{user_id}/risk-profile", response_model=schemas.RiskProfileResponse)
def get_user_risk_profile_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    """Retrieve risk profile for a specific user ID (enforces authenticated ownership)."""
    db_profile = risk_repository.get_risk_profile_by_user_id(db, user_id=user_id)
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk profile assessment not found for this user."
        )
    return db_profile


@router.post("/risk-profile", response_model=schemas.RiskProfileResponse, status_code=status.HTTP_201_CREATED)
@router.post("/api/risk-profile", response_model=schemas.RiskProfileResponse, status_code=status.HTTP_201_CREATED)
def create_or_evaluate_risk_profile(
    request: schemas.RiskQuestionnaireRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit questionnaire responses, calculate multi-dimensional risk profile, and persist."""
    user_id = current_user.id
    profile = financial_repository.get_user_profile(db, user_id=user_id)
    goals = financial_repository.get_user_goals(db, user_id=user_id)
    liabilities = financial_repository.get_user_liabilities(db, user_id=user_id)

    # Defaults if profile is missing
    current_age = profile.current_age if profile else 25
    retirement_age = profile.retirement_age if profile else 55
    current_wealth = profile.current_wealth if profile else 850000.0
    monthly_income = profile.monthly_income if profile else 150000.0
    monthly_expenses = profile.monthly_expenses if profile else 65000.0

    eval_result = risk_scoring.evaluate_full_risk_profile(
        responses=request.model_dump(),
        current_age=current_age,
        retirement_age=retirement_age,
        current_wealth=current_wealth,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        goals=goals,
        liabilities=liabilities,
    )

    saved_profile = risk_repository.save_risk_profile(db, user_id=user_id, profile_data=eval_result)
    return saved_profile


@router.put("/risk-profile", response_model=schemas.RiskProfileResponse)
@router.put("/api/risk-profile", response_model=schemas.RiskProfileResponse)
@router.put("/api/users/{user_id}/risk-profile", response_model=schemas.RiskProfileResponse)
def update_risk_profile(
    request: schemas.RiskQuestionnaireRequest,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Recalculate and update the user's risk profile assessment."""
    target_user_id = user_id if user_id is not None else current_user.id
    if target_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify another user's risk profile."
        )

    profile = financial_repository.get_user_profile(db, user_id=target_user_id)
    goals = financial_repository.get_user_goals(db, user_id=target_user_id)
    liabilities = financial_repository.get_user_liabilities(db, user_id=target_user_id)

    current_age = profile.current_age if profile else 25
    retirement_age = profile.retirement_age if profile else 55
    current_wealth = profile.current_wealth if profile else 850000.0
    monthly_income = profile.monthly_income if profile else 150000.0
    monthly_expenses = profile.monthly_expenses if profile else 65000.0

    eval_result = risk_scoring.evaluate_full_risk_profile(
        responses=request.model_dump(),
        current_age=current_age,
        retirement_age=retirement_age,
        current_wealth=current_wealth,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        goals=goals,
        liabilities=liabilities,
    )

    saved_profile = risk_repository.save_risk_profile(db, user_id=target_user_id, profile_data=eval_result)
    return saved_profile
