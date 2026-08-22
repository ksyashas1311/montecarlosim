from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.repositories import user_repository, financial_repository
from app.database import get_db

router = APIRouter(prefix="/api/users", tags=["Life Events"])

@router.put("/{user_id}/life-events", response_model=List[schemas.LifeEventResponse])
def update_life_events(user_id: int, events: List[schemas.LifeEventCreate], db: Session = Depends(get_db)):
    db_user = user_repository.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return financial_repository.set_user_life_events(db, user_id=user_id, events=events)
