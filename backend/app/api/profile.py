from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.repositories import user_repository, financial_repository
from app import models
from app.database import get_db
from app.core.security import verify_user_ownership

router = APIRouter(prefix="/api/users", tags=["Profile"])

@router.put("/{user_id}/profile", response_model=schemas.UserProfileResponse)
def update_profile(
    user_id: int, 
    profile: schemas.UserProfileCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    db_user = user_repository.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return financial_repository.update_user_profile(db, user_id=user_id, profile=profile)
