from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- Asset Allocation ---
class AssetClassBase(BaseModel):
    name: str
    weight: float = Field(..., description="Weight in portfolio, e.g. 0.60 for 60%. Sum of all weights must be 1.0")
    expected_return: float = Field(..., description="Expected annual return rate, e.g. 0.12")
    volatility: float = Field(..., description="Expected annual volatility, e.g. 0.18")

class AssetClassCreate(AssetClassBase):
    pass

class AssetClassResponse(AssetClassBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Goal ---
class GoalBase(BaseModel):
    name: str
    target_amount: float
    target_age: int

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Life Event ---
class LifeEventBase(BaseModel):
    name: str
    type: str = Field(..., description="lump_sum_expense, recurring_expense, job_loss, income_boost")
    age: int
    amount: float = 0.0
    duration_years: int = 0
    probability: float = 1.0
    income_factor: float = 0.0

class LifeEventCreate(LifeEventBase):
    pass

class LifeEventResponse(LifeEventBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# --- User Profile ---
class UserProfileBase(BaseModel):
    current_age: int
    monthly_income: float
    monthly_expenses: float
    monthly_sip: float
    current_wealth: float
    income_growth_mean: float = 0.08
    income_growth_vol: float = 0.03
    inflation_mean: float = 0.06
    inflation_vol: float = 0.015

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Liabilities (Debt) ---
class LiabilityBase(BaseModel):
    name: str
    principal: float = Field(..., description="Initial loan amount")
    interest_rate: float = Field(..., description="Base annual interest rate, e.g. 0.08 for 8%")
    tenure_years: int = Field(..., description="Tenure in years")
    start_age: int = Field(..., description="Trigger age when loan is taken")
    emi: float = Field(..., description="Monthly payment amount")
    prepayment_monthly: float = Field(0.0, description="Optional monthly prepayment amount")
    variable_rate_vol: float = Field(0.0, description="Annual standard deviation of variable rate shocks (0 = fixed)")

class LiabilityCreate(LiabilityBase):
    pass

class LiabilityResponse(LiabilityBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


# --- User ---
class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    profile: Optional[UserProfileCreate] = None
    assets: Optional[list[AssetClassCreate]] = None
    goals: Optional[list[GoalCreate]] = None
    life_events: Optional[list[LifeEventCreate]] = None
    liabilities: Optional[list[LiabilityCreate]] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    profile: Optional[UserProfileResponse] = None
    assets: list[AssetClassResponse] = []
    goals: list[GoalResponse] = []
    life_events: list[LifeEventResponse] = []
    liabilities: list[LiabilityResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- Simulation Run schemas ---
class SimulationConfigSchema(BaseModel):
    n_simulations: int = 10000
    horizon_years: int = 30
    random_seed: Optional[int] = 42
    market_model: str = "parametric"
    decumulation_strategy: str = "inflation_adjusted"

class GoalResultSchema(BaseModel):
    name: str
    target_amount: float
    target_age: int
    success_probability: float
    wealth_at_target_p5: float
    wealth_at_target_p50: float
    wealth_at_target_p95: float

class SimulationResponse(BaseModel):
    ages: list[int]
    percentiles: dict[str, list[float]]
    mean_wealth: list[float]
    terminal_wealth_mean: float
    terminal_wealth_median: float
    var_95: float
    cvar_95: float
    max_drawdown_p50: float
    ruin_probability: float = 0.0
    median_depletion_age: Optional[float] = None
    retirement_survival_probability: float = 1.0
    goals: list[GoalResultSchema]
    n_simulations: int
    wealth_paths_sample: list[list[float]]


# --- Optimization / Reverse Planning Response ---
class OptimizationOptionResponse(BaseModel):
    option_type: str  # "A" (Increase SIP), "B" (Retire Later), "C" (Optimal Asset Allocation)
    description: str
    success_probability: float
    parameters: dict  # e.g., {"monthly_sip": 15000} or {"retirement_age": 48}


class OptimizationResponse(BaseModel):
    goal_name: str
    target_amount: float
    target_age: int
    current_probability: float
    target_probability: float
    options: list[OptimizationOptionResponse]


# --- Copilot / Chat Schema ---
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    user_id: int

class ChatResponse(BaseModel):
    reply: str
    extracted_action: Optional[dict] = None  # Struct describing structural changes extracted from the message


# --- Sensitivity Analysis ---
class SensitivityFactorImpact(BaseModel):
    factor: str  # e.g., "Monthly SIP", "Asset Returns", "Inflation", "Monthly Expenses"
    impact_score: float  # Absolute change in success probability
    direction: str  # "positive" (higher parameter = higher success) or "negative"
    description: str

class SensitivityAnalysisResponse(BaseModel):
    goal_name: str
    base_probability: float
    factors: List[SensitivityFactorImpact]


# --- Stress Test ---
class StressTestRequest(BaseModel):
    scenario_type: str  # "market_crash", "hyperinflation", "stagflation", "career_disruption"

class StressGoalResult(BaseModel):
    name: str
    base_probability: float
    stressed_probability: float
    impact: float

class StressTestResponse(BaseModel):
    scenario_name: str
    description: str
    goals: List[StressGoalResult]
    stressed_simulation: SimulationResponse


# --- Multi-Objective Optimization ---
class StrategyMetricSchema(BaseModel):
    success_probability: float
    terminal_wealth_median: float
    max_drawdown: float
    ruin_probability: float
    retirement_survival: float

class StrategyProfileSchema(BaseModel):
    name: str
    allocation: dict[str, float]
    retirement_age: int
    sip_amount: float
    metrics: StrategyMetricSchema

class MultiObjectiveResponse(BaseModel):
    goal_name: str
    strategies: list[StrategyProfileSchema]
