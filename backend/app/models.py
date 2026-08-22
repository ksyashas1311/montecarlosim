from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("UserProfileModel", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assets = relationship("AssetAllocationModel", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("GoalModel", back_populates="user", cascade="all, delete-orphan")
    life_events = relationship("LifeEventModel", back_populates="user", cascade="all, delete-orphan")
    liabilities = relationship("LiabilityModel", back_populates="user", cascade="all, delete-orphan")
    simulation_runs = relationship("SimulationRunModel", back_populates="user", cascade="all, delete-orphan")



class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    current_age = Column(Integer, nullable=False)
    monthly_income = Column(Float, nullable=False)
    monthly_expenses = Column(Float, nullable=False)
    monthly_sip = Column(Float, nullable=False)
    current_wealth = Column(Float, nullable=False)
    retirement_age = Column(Integer, default=55)
    income_growth_mean = Column(Float, default=0.08)
    income_growth_vol = Column(Float, default=0.03)
    inflation_mean = Column(Float, default=0.06)
    inflation_vol = Column(Float, default=0.015)

    user = relationship("User", back_populates="profile")


class AssetAllocationModel(Base):
    __tablename__ = "asset_allocations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    weight = Column(Float, nullable=False)              # fraction, e.g. 0.60 for 60%
    expected_return = Column(Float, nullable=False)     # annual rate, e.g. 0.12 for 12%
    volatility = Column(Float, nullable=False)          # annual volatility, e.g. 0.18 for 18%

    user = relationship("User", back_populates="assets")


class GoalModel(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_age = Column(Integer, nullable=False)

    user = relationship("User", back_populates="goals")


class LifeEventModel(Base):
    __tablename__ = "life_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)               # lump_sum_expense, recurring_expense, job_loss, income_boost
    age = Column(Integer, nullable=False)
    amount = Column(Float, default=0.0)
    duration_years = Column(Integer, default=0)
    probability = Column(Float, default=1.0)
    income_factor = Column(Float, default=0.0)

    user = relationship("User", back_populates="life_events")


class LiabilityModel(Base):
    __tablename__ = "liabilities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    principal = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    tenure_years = Column(Integer, nullable=False)
    start_age = Column(Integer, nullable=False)
    emi = Column(Float, nullable=False)
    prepayment_monthly = Column(Float, default=0.0)
    variable_rate_vol = Column(Float, default=0.0)

    user = relationship("User", back_populates="liabilities")


class SimulationRunModel(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(String, index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="SUCCESS")
    
    # Store key metrics directly for easy querying
    terminal_wealth_mean = Column(Float, nullable=True)
    terminal_wealth_median = Column(Float, nullable=True)
    ruin_probability = Column(Float, nullable=True)
    max_drawdown_p50 = Column(Float, nullable=True)
    
    result_data = Column(JSON, nullable=True)

    user = relationship("User", back_populates="simulation_runs")

