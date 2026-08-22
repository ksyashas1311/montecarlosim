"""Quantitative Risk Profiling & Scoring Engine.

Deterministic, multi-dimensional risk evaluation combining:
1. Psychological Risk Tolerance (Willingness to endure volatility & losses)
2. Empirical Risk Capacity (Financial ability to absorb drawdown based on horizon, goals, buffer, and debt)
3. Goal-Specific Risk Posture & Educational Asset Allocation Recommendations
"""

from typing import Dict, Any, List, Optional, Tuple
import math

QUESTION_METADATA = [
    {
        "id": "market_decline",
        "title": "Reaction to Market Decline",
        "question": "If your investment portfolio lost 20% of its value during a market downturn over a few months, what would you most likely do?",
        "options": [
            {"value": 1, "label": "Sell all investments immediately to avoid further losses", "score": 10},
            {"value": 2, "label": "Sell some investments to reduce exposure and cut risk", "score": 30},
            {"value": 3, "label": "Hold and wait patiently for market recovery", "score": 55},
            {"value": 4, "label": "Continue investing normally according to schedule", "score": 80},
            {"value": 5, "label": "Invest significantly more to take advantage of lower prices", "score": 100},
        ],
        "weight": 0.30,
    },
    {
        "id": "investment_objective",
        "title": "Primary Investment Objective",
        "question": "What is your primary investment objective for your accumulated capital?",
        "options": [
            {"value": 1, "label": "Capital Preservation: Prevent nominal loss at all costs", "score": 10},
            {"value": 2, "label": "Stable Income: Regular cash flow with minimal capital fluctuation", "score": 30},
            {"value": 3, "label": "Balanced Growth: Moderate appreciation with downside protection", "score": 55},
            {"value": 4, "label": "Long-Term Growth: Outpace inflation through equity compounding", "score": 80},
            {"value": 5, "label": "Maximum Growth: Aggressive wealth accumulation over decades", "score": 100},
        ],
        "weight": 0.15,
    },
    {
        "id": "volatility_comfort",
        "title": "Comfort with Portfolio Fluctuations",
        "question": "How comfortable are you with seeing significant day-to-day or month-to-month fluctuations in your net worth?",
        "options": [
            {"value": 1, "label": "Very uncomfortable: Any loss causes anxiety", "score": 10},
            {"value": 2, "label": "Uncomfortable: Prefer predictable, steady growth", "score": 30},
            {"value": 3, "label": "Neutral: Accept moderate fluctuations as normal market behavior", "score": 55},
            {"value": 4, "label": "Comfortable: Understand that market volatility is the price of high returns", "score": 80},
            {"value": 5, "label": "Very comfortable: Actively embrace high volatility for superior alpha", "score": 100},
        ],
        "weight": 0.25,
    },
    {
        "id": "return_preference",
        "title": "Risk vs. Return Tradeoff",
        "question": "Which hypothetical 1-year portfolio outcome best matches your preference?",
        "options": [
            {"value": 1, "label": "Low Risk: +4% gain in good years, 0% drop in bad years", "score": 15},
            {"value": 2, "label": "Conservative: +8% gain in good years, -3% drop in bad years", "score": 35},
            {"value": 3, "label": "Balanced: +14% gain in good years, -8% drop in bad years", "score": 60},
            {"value": 4, "label": "Growth: +22% gain in good years, -16% drop in bad years", "score": 80},
            {"value": 5, "label": "Aggressive: +35% gain in good years, -28% drop in bad years", "score": 100},
        ],
        "weight": 0.20,
    },
    {
        "id": "financial_stability",
        "title": "Financial Stability & Security",
        "question": "How would you describe the stability of your ongoing income and living expenses?",
        "options": [
            {"value": 1, "label": "Unpredictable or highly variable earnings", "score": 15},
            {"value": 2, "label": "Somewhat stable, but with limited savings buffer", "score": 35},
            {"value": 3, "label": "Moderately stable with steady monthly income", "score": 60},
            {"value": 4, "label": "Very stable job / career with comfortable cash surplus", "score": 85},
            {"value": 5, "label": "Exceptional stability, recession-resilient income & deep safety net", "score": 100},
        ],
        "weight": 0.10,
    },
]

RISK_CATEGORIES = [
    {"min": 0.0, "max": 20.0, "name": "Conservative"},
    {"min": 20.01, "max": 40.0, "name": "Moderately Conservative"},
    {"min": 40.01, "max": 60.0, "name": "Moderate"},
    {"min": 60.01, "max": 80.0, "name": "Moderately Aggressive"},
    {"min": 80.01, "max": 100.0, "name": "Aggressive"},
]

RECOMMENDED_ALLOCATIONS = {
    "Conservative": {"equity": 15.0, "debt": 60.0, "gold": 15.0, "cash": 10.0},
    "Moderately Conservative": {"equity": 35.0, "debt": 45.0, "gold": 10.0, "cash": 10.0},
    "Moderate": {"equity": 55.0, "debt": 30.0, "gold": 10.0, "cash": 5.0},
    "Moderately Aggressive": {"equity": 70.0, "debt": 20.0, "gold": 5.0, "cash": 5.0},
    "Aggressive": {"equity": 85.0, "debt": 10.0, "gold": 5.0, "cash": 0.0},
}


def calculate_risk_tolerance(responses: Dict[str, int]) -> float:
    """Calculate psychological risk tolerance score (0 - 100) from questionnaire responses."""
    total_score = 0.0
    total_weight = 0.0

    score_lookup = {
        q["id"]: {opt["value"]: opt["score"] for opt in q["options"]}
        for q in QUESTION_METADATA
    }
    weight_lookup = {q["id"]: q["weight"] for q in QUESTION_METADATA}

    for q_id, val in responses.items():
        if q_id in score_lookup and val in score_lookup[q_id]:
            score = score_lookup[q_id][val]
            w = weight_lookup[q_id]
            total_score += score * w
            total_weight += w

    if total_weight == 0:
        return 50.0  # Default neutral

    normalized = total_score / total_weight
    return round(max(0.0, min(100.0, normalized)), 1)


def calculate_risk_capacity(
    current_age: int,
    retirement_age: int,
    current_wealth: float,
    monthly_income: float,
    monthly_expenses: float,
    goals: List[Any],
    liabilities: List[Any],
) -> Tuple[float, float, Dict[str, Any]]:
    """Calculate empirical risk capacity score (0 - 100) and primary investment horizon (years)."""
    # 1. Primary Horizon Calculation
    years_to_retirement = max(1.0, float(retirement_age - current_age))
    
    if goals:
        goal_horizons = [max(1.0, float(getattr(g, 'target_age', current_age + 10) - current_age)) for g in goals]
        # Primary horizon is weighted average of retirement and major goals
        primary_horizon = min(years_to_retirement, max(min(goal_horizons), (years_to_retirement + sum(goal_horizons) / len(goal_horizons)) / 2))
    else:
        primary_horizon = years_to_retirement

    # Horizon Score (40% Weight)
    if primary_horizon < 3.0:
        horizon_score = 20.0
    elif primary_horizon < 5.0:
        horizon_score = 45.0
    elif primary_horizon < 10.0:
        horizon_score = 68.0
    elif primary_horizon < 20.0:
        horizon_score = 88.0
    else:
        horizon_score = 100.0

    # 2. Emergency & Liquidity Buffer Score (25% Weight)
    exp = max(1000.0, monthly_expenses)
    months_buffer = current_wealth / exp if exp > 0 else 0.0

    if months_buffer >= 12.0:
        buffer_score = 100.0
    elif months_buffer >= 6.0:
        buffer_score = 85.0
    elif months_buffer >= 3.0:
        buffer_score = 60.0
    elif months_buffer >= 1.0:
        buffer_score = 35.0
    else:
        buffer_score = 15.0

    # 3. Debt Burden Score (15% Weight)
    total_monthly_emi = sum(getattr(l, 'emi', 0.0) for l in liabilities)
    inc = max(1000.0, monthly_income)
    dti_ratio = total_monthly_emi / inc

    if dti_ratio <= 0.05:
        debt_score = 100.0
    elif dti_ratio <= 0.20:
        debt_score = 85.0
    elif dti_ratio <= 0.35:
        debt_score = 65.0
    elif dti_ratio <= 0.50:
        debt_score = 40.0
    else:
        debt_score = 15.0

    # 4. Near-Term Goals Drag (20% Weight)
    near_term_goals = [
        g for g in goals 
        if (getattr(g, 'target_age', 999) - current_age) <= 3
    ]
    medium_term_goals = [
        g for g in goals 
        if 3 < (getattr(g, 'target_age', 999) - current_age) <= 5
    ]

    if near_term_goals:
        goal_drag_score = 30.0
    elif medium_term_goals:
        goal_drag_score = 60.0
    elif goals:
        goal_drag_score = 90.0
    else:
        goal_drag_score = 70.0  # Baseline when no goals are set

    # Combine capacity dimensions
    capacity_score = (
        0.40 * horizon_score +
        0.25 * buffer_score +
        0.15 * debt_score +
        0.20 * goal_drag_score
    )
    capacity_score = round(max(0.0, min(100.0, capacity_score)), 1)

    details = {
        "primary_horizon_years": primary_horizon,
        "horizon_score": horizon_score,
        "months_buffer": round(months_buffer, 1),
        "buffer_score": buffer_score,
        "dti_ratio": round(dti_ratio * 100, 1),
        "debt_score": debt_score,
        "near_term_goals_count": len(near_term_goals),
        "goal_drag_score": goal_drag_score,
    }

    return capacity_score, primary_horizon, details


def combine_risk_scores(
    tolerance_score: float,
    capacity_score: float,
    primary_horizon: float,
) -> float:
    """Combines psychological tolerance and financial capacity with safety guardrails."""
    # Balanced baseline average
    raw_score = 0.50 * tolerance_score + 0.50 * capacity_score

    # Capacity Guardrail: If horizon is very short (< 3 yrs) or capacity is critically low (< 35),
    # psychological aggression is strictly capped to protect capital.
    if primary_horizon < 3.0:
        max_allowed = min(40.0, capacity_score + 10.0)
        overall = min(raw_score, max_allowed)
    elif capacity_score < 35.0:
        max_allowed = capacity_score + 15.0
        overall = min(raw_score, max_allowed)
    elif tolerance_score < 30.0:
        # If user is highly risk-averse, do not force aggressive equity just because horizon is long
        max_allowed = tolerance_score + 20.0
        overall = min(raw_score, max_allowed)
    else:
        overall = raw_score

    return round(max(0.0, min(100.0, overall)), 1)


def determine_risk_category(score: float) -> str:
    """Map numeric score (0 - 100) to Risk Category."""
    for cat in RISK_CATEGORIES:
        if cat["min"] <= score <= cat["max"]:
            return cat["name"]
    return "Moderate"


def generate_risk_factors(
    responses: Dict[str, int],
    capacity_details: Dict[str, Any],
    tolerance_score: float,
    capacity_score: float,
    goals: List[Any],
    current_age: int,
) -> List[Dict[str, str]]:
    """Generate structured positive and caution/risk-reducing factors."""
    factors = []

    # Horizon factor
    horizon = capacity_details.get("primary_horizon_years", 10.0)
    if horizon >= 15.0:
        factors.append({
            "type": "positive",
            "title": f"Extensive Investment Horizon ({int(horizon)} years)",
            "description": "Your lengthy timeline allows your portfolio to ride out multiple market cycles and recover from temporary downturns.",
        })
    elif horizon >= 8.0:
        factors.append({
            "type": "positive",
            "title": f"Healthy Multi-Year Horizon ({int(horizon)} years)",
            "description": "You have sufficient time to benefit from compounding equity returns without immediate liquidation pressure.",
        })
    elif horizon <= 3.0:
        factors.append({
            "type": "negative",
            "title": f"Short Primary Horizon ({int(horizon)} years)",
            "description": "Imminent capital requirements drastically reduce your risk capacity. Market losses in the near term cannot be easily recouped.",
        })

    # Emergency buffer factor
    months_buffer = capacity_details.get("months_buffer", 0.0)
    if months_buffer >= 6.0:
        factors.append({
            "type": "positive",
            "title": f"Robust Liquidity Cushion ({months_buffer:.1f} months)",
            "description": "Your existing wealth covers more than 6 months of expenses, protecting you from having to liquidate equities in a downturn.",
        })
    elif months_buffer < 2.0:
        factors.append({
            "type": "negative",
            "title": "Thin Emergency Buffer (< 2 months)",
            "description": "Limited liquid reserves mean unplanned expenses could force distress selling of investments during market drawdowns.",
        })

    # Debt factor
    dti = capacity_details.get("dti_ratio", 0.0)
    if dti == 0.0:
        factors.append({
            "type": "positive",
            "title": "Debt-Free Cash Flow",
            "description": "Zero monthly EMI commitments maximize your surplus cash flow and ability to weather volatility.",
        })
    elif dti > 35.0:
        factors.append({
            "type": "negative",
            "title": f"Significant Debt Obligations ({dti:.0f}% DTI)",
            "description": "High monthly EMI commitments restrict discretionary flexibility and lower your financial resilience.",
        })

    # Goals factors
    near_term_count = capacity_details.get("near_term_goals_count", 0)
    if near_term_count > 0:
        factors.append({
            "type": "negative",
            "title": f"{near_term_count} Near-Term Goal(s) within 3 Years",
            "description": "High-priority capital outflows due soon require conservative allocation for those specific funds.",
        })
    elif not goals:
        factors.append({
            "type": "neutral",
            "title": "No Financial Goals Registered",
            "description": "Assessment uses baseline capacity assumptions. Add specific targets (e.g. House, Retirement) for higher precision.",
        })

    # Psychological attitude factor
    mkt_resp = responses.get("market_decline", 3)
    if mkt_resp >= 4:
        factors.append({
            "type": "positive",
            "title": "Opportunistic Market Attitude",
            "description": "You view market corrections as buying opportunities rather than panic triggers, supporting high-growth strategies.",
        })
    elif mkt_resp <= 2:
        factors.append({
            "type": "negative",
            "title": "High Loss Aversion",
            "description": "A 20% market dip would prompt you to reduce exposure, indicating that large drawdowns risk panic-selling at market bottoms.",
        })

    return factors


def assess_individual_goals(goals: List[Any], current_age: int) -> List[Dict[str, Any]]:
    """Generates goal-specific risk capacity and asset recommendations."""
    assessments = []
    for g in goals:
        name = getattr(g, "name", "Goal")
        target_amount = getattr(g, "target_amount", 0.0)
        target_age = getattr(g, "target_age", current_age + 5)
        category = getattr(g, "category", "custom")
        priority = getattr(g, "priority", "high")

        horizon = max(0.5, float(target_age - current_age))

        if horizon <= 2.0:
            posture = "Capital Preservation"
            suggested_equity = 0.0
            suggested_debt_cash = 100.0
            advice = "Keep funds in ultra-short debt / liquid funds and fixed deposits. Do not expose this capital to equity volatility."
        elif horizon <= 5.0:
            posture = "Conservative Growth"
            suggested_equity = 25.0
            suggested_debt_cash = 75.0
            advice = "Favor short-to-medium duration debt with a small conservative equity component (e.g. multi-asset or balanced funds)."
        elif horizon <= 10.0:
            posture = "Balanced Accumulation"
            suggested_equity = 60.0
            suggested_debt_cash = 40.0
            advice = "Balanced allocation across diversified equity indices and quality corporate debt."
        else:
            posture = "Aggressive Compounding"
            suggested_equity = 80.0
            suggested_debt_cash = 20.0
            advice = "Focus heavily on broad equity compounding. You have ample time to glide into debt as target age approaches."

        assessments.append({
            "name": name,
            "target_amount": target_amount,
            "target_age": target_age,
            "horizon_years": round(horizon, 1),
            "priority": priority,
            "category": category,
            "posture": posture,
            "suggested_equity_pct": suggested_equity,
            "suggested_debt_pct": suggested_debt_cash,
            "strategy_guidance": advice,
        })

    return assessments


def generate_narrative(
    category: str,
    overall_score: float,
    tolerance_score: float,
    capacity_score: float,
    primary_horizon: float,
    factors: List[Dict[str, str]],
) -> str:
    """Generate dynamic, multi-paragraph personalized assessment explanation."""
    intro = (
        f"Your personalized investment profile is **{category}** with an overall score of "
        f"**{overall_score:.0f}/100**. This assessment reflects a comprehensive evaluation of your psychological "
        f"risk tolerance (**{tolerance_score:.0f}/100**) paired with your empirical risk capacity (**{capacity_score:.0f}/100**) "
        f"across a primary horizon of **{primary_horizon:.1f} years**."
    )

    # Tension analysis between tolerance and capacity
    diff = tolerance_score - capacity_score
    if abs(diff) <= 12:
        alignment = (
            "Your psychological comfort with market volatility is well-aligned with your financial capacity. "
            "You can execute your investment strategy without significant conflict between emotional resilience and cash flow reality."
        )
    elif diff > 12:
        alignment = (
            f"**Important Observation:** Your psychological risk willingness ({tolerance_score:.0f}) is higher than your financial "
            f"risk capacity ({capacity_score:.0f}). While you may feel eager to chase aggressive equity returns, your near-term obligations "
            "or liquidity needs require disciplined downside protection to avoid distress selling."
        )
    else:
        alignment = (
            f"**Opportunity Observation:** Your financial risk capacity ({capacity_score:.0f}) exceeds your psychological risk tolerance "
            f"({tolerance_score:.0f}). Your strong financial foundation and long horizon could technically support higher equity exposure, "
            "but your portfolio should respect your peace of mind so you remain comfortably invested."
        )

    # Strategy advice based on category
    if category == "Conservative":
        strategy = (
            "**Recommended Strategy:** Prioritize capital preservation, high liquidity, and inflation-protected fixed income. "
            "Limit equity exposure to a minor allocation (10–20%) purely to defend against long-term purchasing power erosion."
        )
    elif category == "Moderately Conservative":
        strategy = (
            "**Recommended Strategy:** Focus on capital stability while incorporating a modest equity foundation (30–40%) to outpace "
            "inflation. Maintain the majority of your assets in high-quality debt and emergency reserves."
        )
    elif category == "Moderate":
        strategy = (
            "**Recommended Strategy:** Pursue a balanced 55/45 allocation between growth equities and fixed income/gold. This provides "
            "healthy long-term compounding while significantly muting severe market drawdowns."
        )
    elif category == "Moderately Aggressive":
        strategy = (
            "**Recommended Strategy:** Utilize a growth-oriented 70/30 allocation with substantial exposure to broad equity indices. "
            "Expect periodic 15–25% market corrections and use systematic SIP investments to compound capital."
        )
    else:  # Aggressive
        strategy = (
            "**Recommended Strategy:** Maximize long-term equity compounding (80–90% equity exposure). Your long timeline and high resilience "
            "allow you to embrace severe market swings in exchange for maximizing terminal wealth."
        )

    disclaimer = (
        "\n\n*Note: This risk assessment is designed for educational and planning purposes and provides quantitative guidelines for your "
        "digital twin simulations. It does not constitute formal fiduciary investment advice.*"
    )

    return f"{intro}\n\n{alignment}\n\n{strategy}{disclaimer}"


def evaluate_full_risk_profile(
    responses: Dict[str, int],
    current_age: int,
    retirement_age: int,
    current_wealth: float,
    monthly_income: float,
    monthly_expenses: float,
    goals: List[Any],
    liabilities: List[Any],
) -> Dict[str, Any]:
    """Execute complete risk profiling calculation pipeline."""
    tolerance_score = calculate_risk_tolerance(responses)
    capacity_score, primary_horizon, capacity_details = calculate_risk_capacity(
        current_age=current_age,
        retirement_age=retirement_age,
        current_wealth=current_wealth,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        goals=goals,
        liabilities=liabilities,
    )

    overall_score = combine_risk_scores(tolerance_score, capacity_score, primary_horizon)
    category = determine_risk_category(overall_score)
    recommended_alloc = RECOMMENDED_ALLOCATIONS.get(category, RECOMMENDED_ALLOCATIONS["Moderate"])
    factors = generate_risk_factors(responses, capacity_details, tolerance_score, capacity_score, goals, current_age)
    goal_assessments = assess_individual_goals(goals, current_age)
    narrative = generate_narrative(category, overall_score, tolerance_score, capacity_score, primary_horizon, factors)

    return {
        "risk_tolerance_score": tolerance_score,
        "risk_capacity_score": capacity_score,
        "overall_score": overall_score,
        "risk_category": category,
        "investment_horizon_years": round(primary_horizon, 1),
        "questionnaire_version": "v1",
        "responses": responses,
        "factors": factors,
        "narrative": narrative,
        "recommended_allocation": recommended_alloc,
        "goal_assessments": goal_assessments,
    }
