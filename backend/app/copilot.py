import os
import json
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

# Response schema matching what we want from the model
class CopilotResponseSchema(BaseModel):
    reply: str
    action_type: Optional[str] = None  # "add_life_event", "change_sip", "change_retirement_age", "none"
    parameters: Optional[Dict[str, Any]] = None  # e.g., {"name": "Car", "amount": 1500000, "age": 25}

def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Error initializing Gemini client: {e}")
        return None

def chat_with_copilot(
    user_id: int,
    db: Any,
    messages: List[Dict[str, str]],
    profile_data: Dict[str, Any],
    goals_data: List[Dict[str, Any]],
    life_events_data: List[Dict[str, Any]],
    latest_sim_results: Optional[Dict[str, Any]] = None,
    liabilities_data: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Sends the chat history and current Financial Digital Twin state to Gemini.
    Utilizes tool calling to fetch actual simulation and stress test calculations from the python engine.
    """
    client = get_gemini_client()

    # Compile financial context
    financial_context = {
        "profile": {
            "current_age": profile_data.get("current_age"),
            "monthly_income": profile_data.get("monthly_income"),
            "monthly_expenses": profile_data.get("monthly_expenses"),
            "monthly_sip": profile_data.get("monthly_sip"),
            "current_wealth": profile_data.get("current_wealth"),
        },
        "goals": [
            {"name": g.get("name"), "target_amount": g.get("target_amount"), "target_age": g.get("target_age")}
            for g in goals_data
        ],
        "life_events": [
            {
                "name": e.get("name"),
                "type": e.get("type"),
                "age": e.get("age"),
                "amount": e.get("amount"),
                "duration_years": e.get("duration_years"),
                "probability": e.get("probability")
            }
            for e in life_events_data
        ],
        "liabilities": [
            {
                "name": l.get("name"),
                "principal": l.get("principal"),
                "interest_rate": l.get("interest_rate"),
                "tenure_years": l.get("tenure_years"),
                "start_age": l.get("start_age"),
                "emi": l.get("emi")
            }
            for l in (liabilities_data or [])
        ]
    }

    if latest_sim_results:
        financial_context["latest_simulation"] = {
            "terminal_wealth_mean": latest_sim_results.get("terminal_wealth_mean"),
            "terminal_wealth_median": latest_sim_results.get("terminal_wealth_median"),
            "var_95": latest_sim_results.get("var_95"),
            "cvar_95": latest_sim_results.get("cvar_95"),
            "max_drawdown_p50": latest_sim_results.get("max_drawdown_p50"),
            "ruin_probability": latest_sim_results.get("ruin_probability"),
            "retirement_survival": latest_sim_results.get("retirement_survival"),
            "goals_success": [
                {"name": g.get("name"), "success_probability": g.get("success_probability")}
                for g in latest_sim_results.get("goals", [])
            ]
        }

    # Tool definitions
    def run_simulation_tool(market_model: str = "parametric", decumulation_strategy: str = "inflation_adjusted") -> str:
        """
        Runs the financial Monte Carlo simulation engine to project future wealth distributions.
        Returns summary metrics such as success rates, median terminal wealth, VaR, CVaR, and ruin probability.
        
        Args:
            market_model: The return model engine to use. Options: 'parametric', 'bootstrap', or 'regime_switching'.
            decumulation_strategy: The withdrawal logic model. Options: 'inflation_adjusted', 'fixed', 'percentage', or 'guyton_klinger'.
        """
        try:
            from app import crud
            from engine.simulation import MonteCarloEngine, SimulationConfig, MarketModel, DecumulationStrategy
            from app.main import get_sim_inputs
            import numpy as np

            db_user = crud.get_user(db, user_id=user_id)
            if not db_user:
                return json.dumps({"error": "User not found"})

            profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)

            sim_config = SimulationConfig(
                n_simulations=1000,
                horizon_years=35,
                random_seed=42,
                market_model=MarketModel(market_model.lower()),
                decumulation_strategy=DecumulationStrategy(decumulation_strategy.lower())
            )

            n_assets = len(assets)
            correlation_matrix = np.full((n_assets, n_assets), 0.2)
            np.fill_diagonal(correlation_matrix, 1.0)

            engine = MonteCarloEngine(
                profile=profile,
                assets=assets,
                config=sim_config,
                life_events=life_events,
                correlation_matrix=correlation_matrix,
                liabilities=liabilities
            )
            result = engine.run(goals=goals)

            summary = {
                "terminal_wealth_median": result.terminal_wealth_median,
                "var_95": result.var_95,
                "cvar_95": result.cvar_95,
                "max_drawdown_p50": result.max_drawdown_p50,
                "ruin_probability": result.ruin_probability,
                "retirement_survival_probability": result.retirement_survival_probability,
                "goals": [
                    {"name": g.name, "success_probability": g.success_probability}
                    for g in result.goals
                ]
            }
            return json.dumps(summary)
        except Exception as e:
            return json.dumps({"error": str(e)})

    def run_stress_test_tool(scenario_type: str) -> str:
        """
        Runs a macro crisis or job loss stress test scenario to assess impact on goals.
        Returns a dictionary containing stressed success probabilities, impact on wealth, and ruin risk.
        
        Args:
            scenario_type: The stress preset type. Options: 'market_crash', 'hyperinflation', 'stagflation', or 'career_disruption'.
        """
        try:
            from app import crud
            from app.optimizer import run_stress_test
            from app.main import get_sim_inputs
            
            db_user = crud.get_user(db, user_id=user_id)
            if not db_user:
                return json.dumps({"error": "User not found"})

            profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
                
            res = run_stress_test(
                profile=profile,
                assets=assets,
                life_events=life_events,
                goals=goals,
                scenario_type=scenario_type,
                liabilities=liabilities
            )
            summary = {
                "scenario_name": res["scenario_name"],
                "description": res["description"],
                "stressed_ruin_probability": res["stressed_simulation"].ruin_probability,
                "stressed_var_95": res["stressed_simulation"].var_95,
                "stressed_retirement_survival_probability": res["stressed_simulation"].retirement_survival_probability,
                "goals_impact": [
                    {
                        "name": g["name"],
                        "base_probability": g["base_probability"],
                        "stressed_probability": g["stressed_probability"],
                        "impact": g["impact"]
                    }
                    for g in res["goals"]
                ]
            }
            return json.dumps(summary)
        except Exception as e:
            return json.dumps({"error": str(e)})

    # Construct System Prompt
    system_instruction = f"""
You are the FinTwin AI Financial Copilot, an expert in quant finance and personal planning.
Your task is to:
1. Explain Monte Carlo simulation results (such as success probability, Value-at-Risk, CVaR, drawdowns) in plain, intuitive language.
2. Identify user requests to alter their financial digital twin (e.g., adding a car purchase, changing SIP, delaying retirement, losing a job, or comparing market models/decumulation strategies).
3. If you detect the user wants to test a scenario or edit a parameter, extract the action and output it in the structured schema.
4. Call your quantitative tools (run_simulation_tool, run_stress_test_tool) to fetch real numerical projections instead of fabricating numbers.

Action Types:
- 'add_life_event': When user wants to simulate a purchase, job loss, boost, or expense.
  Parameters must contain:
    - 'name': str (e.g., 'Car', 'House', 'Job Loss')
    - 'type': str ('lump_sum_expense', 'recurring_expense', 'job_loss', 'income_boost')
    - 'age': int
    - 'amount': float (lump sum or annual recurring/boost amount)
    - 'duration_years': int (for recurring expense/job loss/boost)
    - 'probability': float (optional, default 1.0)
    - 'income_factor': float (optional, default 0.0 for job loss)
- 'change_sip': When user says e.g., 'What if I invest 15k instead?'
  Parameters must contain:
    - 'monthly_sip': float
- 'change_retirement_age': When user says e.g., 'Can I retire at 55?' or 'Change retirement to 55'
  Parameters must contain:
    - 'target_age': int
- 'none': Default.

Current Financial Digital Twin State:
{json.dumps(financial_context, indent=2)}

Guidelines:
- DO NOT fabricate numbers. If the user asks about the impact of a market model change or a crisis, use your tools (run_simulation_tool, run_stress_test_tool) to get the math first!
- Use the contextual values provided in the state.
- Explain CVaR (Conditional VaR) simply: the average outcome in the worst-case 5% of simulated futures.
- Keep your tone supportive, analytical, and professional.
- Remember: All financial figures are in Indian Rupees (₹).
- ALWAYS end your reply with this exact disclaimer block:
  "Disclaimer: FinTwin simulations are based on probabilistic projections and historical asset returns. They do not constitute formal financial planning or guarantee future performance."
"""

    if not client:
        # Fallback response when Gemini API Key is not set
        fallback_reply = (
            "⚠️ **Gemini API Key is not configured.**\n\n"
            "To activate full AI Copilot advice, please set the `GEMINI_API_KEY` environment variable. "
            "Here is a mock analysis based on your numbers:\n"
        )
        if latest_sim_results:
            goal_summaries = [f"{g.get('name')}: {g.get('success_probability'):.1%}" for g in latest_sim_results.get('goals', [])]
            goal_str = ", ".join(goal_summaries) or "No goals configured"
            fallback_reply += (
                f"- **Goal Success rate**: {goal_str}\n"
                f"- **Median Net Worth**: ₹{latest_sim_results.get('terminal_wealth_median'):,.0f}\n"
                f"- **Value-at-Risk (95%)**: ₹{latest_sim_results.get('var_95'):,.0f} (maximum expected downside in 95% of cases)\n"
            )
        else:
            fallback_reply += f"- **Monthly Income**: ₹{financial_context['profile']['monthly_income']:,.0f}\n"
            fallback_reply += f"- **Current Wealth**: ₹{financial_context['profile']['current_wealth']:,.0f}\n"
        
        fallback_reply += (
            "\nDisclaimer: FinTwin simulations are based on probabilistic projections and historical asset returns. "
            "They do not constitute formal financial planning or guarantee future performance."
        )

        return {
            "reply": fallback_reply,
            "action_type": "none",
            "parameters": None
        }

    try:
        # Formulate contents matching the history
        contents = []
        for msg in messages:
            contents.append(
                types.Content(
                    role=msg["role"],
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CopilotResponseSchema,
            system_instruction=system_instruction,
            tools=[run_simulation_tool, run_stress_test_tool],
            temperature=0.2,
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=config
        )

        res_dict = json.loads(response.text)
        
        # Enforce disclaimer presence in case model skipped it in reply string
        reply_str = res_dict.get("reply", "")
        disclaimer = "Disclaimer: FinTwin simulations are based on probabilistic projections and historical asset returns. They do not constitute formal financial planning or guarantee future performance."
        if disclaimer.strip().lower() not in reply_str.strip().lower():
            reply_str += f"\n\n{disclaimer}"

        return {
            "reply": reply_str,
            "action_type": res_dict.get("action_type", "none"),
            "parameters": res_dict.get("parameters")
        }
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return {
            "reply": f"Sorry, I encountered an error communicating with the AI service: {str(e)}",
            "action_type": "none",
            "parameters": None
        }
