from sqlalchemy.orm import Session
from app import models, schemas

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    from app.repositories import financial_repository

    if user.profile:
        financial_repository.create_user_profile(db, db_user.id, user.profile)
    if user.assets:
        for asset in user.assets:
            financial_repository.create_user_asset(db, db_user.id, asset)
    if user.goals:
        for goal in user.goals:
            financial_repository.create_user_goal(db, db_user.id, goal)
    if user.life_events:
        for event in user.life_events:
            financial_repository.create_user_life_event(db, db_user.id, event)
    if user.liabilities:
        for liability in user.liabilities:
            financial_repository.create_user_liability(db, db_user.id, liability)

    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
