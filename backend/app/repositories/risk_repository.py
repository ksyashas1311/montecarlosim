from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app import models

def get_risk_profile_by_user_id(db: Session, user_id: int) -> Optional[models.RiskProfileModel]:
    return db.query(models.RiskProfileModel).filter(models.RiskProfileModel.user_id == user_id).first()

def save_risk_profile(db: Session, user_id: int, profile_data: Dict[str, Any]) -> models.RiskProfileModel:
    db_profile = get_risk_profile_by_user_id(db, user_id)
    now = datetime.now(timezone.utc)
    
    if not db_profile:
        db_profile = models.RiskProfileModel(
            user_id=user_id,
            risk_tolerance_score=profile_data["risk_tolerance_score"],
            risk_capacity_score=profile_data["risk_capacity_score"],
            overall_score=profile_data["overall_score"],
            risk_category=profile_data["risk_category"],
            investment_horizon_years=profile_data["investment_horizon_years"],
            questionnaire_version=profile_data.get("questionnaire_version", "v1"),
            responses=profile_data["responses"],
            factors=profile_data["factors"],
            narrative=profile_data["narrative"],
            recommended_allocation=profile_data["recommended_allocation"],
            goal_assessments=profile_data.get("goal_assessments", []),
            created_at=now,
            updated_at=now,
        )
        db.add(db_profile)
    else:
        db_profile.risk_tolerance_score = profile_data["risk_tolerance_score"]
        db_profile.risk_capacity_score = profile_data["risk_capacity_score"]
        db_profile.overall_score = profile_data["overall_score"]
        db_profile.risk_category = profile_data["risk_category"]
        db_profile.investment_horizon_years = profile_data["investment_horizon_years"]
        db_profile.questionnaire_version = profile_data.get("questionnaire_version", "v1")
        db_profile.responses = profile_data["responses"]
        db_profile.factors = profile_data["factors"]
        db_profile.narrative = profile_data["narrative"]
        db_profile.recommended_allocation = profile_data["recommended_allocation"]
        db_profile.goal_assessments = profile_data.get("goal_assessments", [])
        db_profile.updated_at = now

    db.commit()
    db.refresh(db_profile)
    return db_profile
