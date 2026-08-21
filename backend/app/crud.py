from sqlalchemy.orm import Session
from app import models, schemas

# --- User ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if user.profile:
        create_user_profile(db, db_user.id, user.profile)
    if user.assets:
        for asset in user.assets:
            create_user_asset(db, db_user.id, asset)
    if user.goals:
        for goal in user.goals:
            create_user_goal(db, db_user.id, goal)
    if user.life_events:
        for event in user.life_events:
            create_user_life_event(db, db_user.id, event)
    if user.liabilities:
        for liability in user.liabilities:
            create_user_liability(db, db_user.id, liability)

    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# --- Profile ---
def get_user_profile(db: Session, user_id: int):
    return db.query(models.UserProfileModel).filter(models.UserProfileModel.user_id == user_id).first()

def create_user_profile(db: Session, user_id: int, profile: schemas.UserProfileCreate):
    db_profile = models.UserProfileModel(**profile.model_dump(), user_id=user_id)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_user_profile(db: Session, user_id: int, profile: schemas.UserProfileCreate):
    db_profile = get_user_profile(db, user_id)
    if not db_profile:
        return create_user_profile(db, user_id, profile)
    
    for key, value in profile.model_dump().items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile


# --- Assets ---
def get_user_assets(db: Session, user_id: int):
    return db.query(models.AssetAllocationModel).filter(models.AssetAllocationModel.user_id == user_id).all()

def create_user_asset(db: Session, user_id: int, asset: schemas.AssetClassCreate):
    db_asset = models.AssetAllocationModel(**asset.model_dump(), user_id=user_id)
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def delete_user_assets(db: Session, user_id: int):
    db.query(models.AssetAllocationModel).filter(models.AssetAllocationModel.user_id == user_id).delete()
    db.commit()

def set_user_assets(db: Session, user_id: int, assets: list[schemas.AssetClassCreate]):
    # Replace all assets for this user
    delete_user_assets(db, user_id)
    db_assets = []
    for asset in assets:
        db_assets.append(create_user_asset(db, user_id, asset))
    return db_assets


# --- Goals ---
def get_user_goals(db: Session, user_id: int):
    return db.query(models.GoalModel).filter(models.GoalModel.user_id == user_id).all()

def create_user_goal(db: Session, user_id: int, goal: schemas.GoalCreate):
    db_goal = models.GoalModel(**goal.model_dump(), user_id=user_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, user_id: int, goal_id: int):
    db_goal = db.query(models.GoalModel).filter(models.GoalModel.id == goal_id, models.GoalModel.user_id == user_id).first()
    if db_goal:
        db.delete(db_goal)
        db.commit()
        return True
    return False

def set_user_goals(db: Session, user_id: int, goals: list[schemas.GoalCreate]):
    db.query(models.GoalModel).filter(models.GoalModel.user_id == user_id).delete()
    db.commit()
    db_goals = []
    for goal in goals:
        db_goals.append(create_user_goal(db, user_id, goal))
    return db_goals


# --- Life Events ---
def get_user_life_events(db: Session, user_id: int):
    return db.query(models.LifeEventModel).filter(models.LifeEventModel.user_id == user_id).all()

def create_user_life_event(db: Session, user_id: int, event: schemas.LifeEventCreate):
    db_event = models.LifeEventModel(**event.model_dump(), user_id=user_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_life_event(db: Session, user_id: int, event_id: int):
    db_event = db.query(models.LifeEventModel).filter(models.LifeEventModel.id == event_id, models.LifeEventModel.user_id == user_id).first()
    if db_event:
        db.delete(db_event)
        db.commit()
        return True
    return False

def set_user_life_events(db: Session, user_id: int, events: list[schemas.LifeEventCreate]):
    db.query(models.LifeEventModel).filter(models.LifeEventModel.user_id == user_id).delete()
    db.commit()
    db_events = []
    for event in events:
        db_events.append(create_user_life_event(db, user_id, event))
    return db_events


# --- Liabilities ---
def get_user_liabilities(db: Session, user_id: int):
    return db.query(models.LiabilityModel).filter(models.LiabilityModel.user_id == user_id).all()

def create_user_liability(db: Session, user_id: int, liability: schemas.LiabilityCreate):
    db_liability = models.LiabilityModel(**liability.model_dump(), user_id=user_id)
    db.add(db_liability)
    db.commit()
    db.refresh(db_liability)
    return db_liability

def delete_liability(db: Session, user_id: int, liability_id: int):
    db_liability = db.query(models.LiabilityModel).filter(
        models.LiabilityModel.id == liability_id,
        models.LiabilityModel.user_id == user_id
    ).first()
    if db_liability:
        db.delete(db_liability)
        db.commit()
        return True
    return False

def set_user_liabilities(db: Session, user_id: int, liabilities: list[schemas.LiabilityCreate]):
    db.query(models.LiabilityModel).filter(models.LiabilityModel.user_id == user_id).delete()
    db.commit()
    db_liabilities = []
    for liability in liabilities:
        db_liabilities.append(create_user_liability(db, user_id, liability))
    return db_liabilities
