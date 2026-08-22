from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.repositories import user_repository, financial_repository
from app import models
from app.database import get_db
from app.core.security import verify_user_ownership

router = APIRouter(prefix="/api/users", tags=["Assets"])

@router.put("/{user_id}/assets", response_model=List[schemas.AssetClassResponse])
def update_assets(
    user_id: int, 
    assets: List[schemas.AssetClassCreate], 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_user_ownership)
):
    db_user = user_repository.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return financial_repository.set_user_assets(db, user_id=user_id, assets=assets)
