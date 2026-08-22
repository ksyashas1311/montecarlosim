from typing import Optional
from sqlalchemy.orm import Session
from app import models, schemas

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email.lower().strip()).first()

def get_user_by_google_id(db: Session, google_id: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.google_id == google_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_auth_user(
    db: Session,
    email: str,
    hashed_password: Optional[str] = None,
    name: Optional[str] = None,
    google_id: Optional[str] = None,
    avatar_url: Optional[str] = None
) -> models.User:
    db_user = models.User(
        email=email.lower().strip(),
        hashed_password=hashed_password,
        name=name,
        google_id=google_id,
        avatar_url=avatar_url,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_google_info(
    db: Session,
    user: models.User,
    google_id: str,
    avatar_url: Optional[str] = None,
    name: Optional[str] = None
) -> models.User:
    user.google_id = google_id
    if avatar_url and not user.avatar_url:
        user.avatar_url = avatar_url
    if name and not user.name:
        user.name = name
    db.commit()
    db.refresh(user)
    return user

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    email = (user.email or f"user_{id(user)}@example.com").lower().strip()
    db_user = models.User(
        name=user.name,
        email=email,
        is_active=True
    )
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

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
