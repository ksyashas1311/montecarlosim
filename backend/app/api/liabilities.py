from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.repositories import user_repository, financial_repository
from app.database import get_db

router = APIRouter(prefix="/api/users", tags=["Liabilities"])

@router.put("/{user_id}/liabilities", response_model=List[schemas.LiabilityResponse])
def update_liabilities(user_id: int, liabilities: List[schemas.LiabilityCreate], db: Session = Depends(get_db)):
    db_user = user_repository.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return financial_repository.set_user_liabilities(db, user_id=user_id, liabilities=liabilities)
