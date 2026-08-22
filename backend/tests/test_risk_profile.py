import sys
import os
import unittest

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models
from app.services import risk_scoring
from app.worker import celery_app

celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
    task_store_eager_result=True,
    broker_url="memory://",
    result_backend="cache+memory://",
)


class TestRiskProfileSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def setUp(self):
        Base.metadata.create_all(bind=engine)
        # Clean users and risk profiles before each test
        db = SessionLocal()
        try:
            db.query(models.RiskProfileModel).delete()
            db.query(models.GoalModel).delete()
            db.query(models.LiabilityModel).delete()
            db.query(models.UserProfileModel).delete()
            db.query(models.User).delete()
            db.commit()
        finally:
            db.close()

    def _register_user(self, email: str, name: str, password: str = "Password123!"):
        res = self.client.post(
            "/auth/register",
            json={"email": email, "password": password, "name": name},
        )
        self.assertEqual(res.status_code, 201)
        return res.cookies

    # --- 1. Unit Scoring Tests ---

    def test_01_conservative_scoring(self):
        responses = {
            "market_decline": 1,
            "investment_objective": 1,
            "volatility_comfort": 1,
            "return_preference": 1,
            "financial_stability": 1,
        }
        tolerance = risk_scoring.calculate_risk_tolerance(responses)
        self.assertLessEqual(tolerance, 20.0)

        capacity, horizon, _ = risk_scoring.calculate_risk_capacity(
            current_age=52,
            retirement_age=55,
            current_wealth=100000.0,
            monthly_income=50000.0,
            monthly_expenses=45000.0,
            goals=[],
            liabilities=[],
        )
        overall = risk_scoring.combine_risk_scores(tolerance, capacity, horizon)
        category = risk_scoring.determine_risk_category(overall)
        self.assertIn(category, ("Conservative", "Moderately Conservative"))
        self.assertLessEqual(overall, 35.0)

    def test_02_aggressive_scoring(self):
        responses = {
            "market_decline": 5,
            "investment_objective": 5,
            "volatility_comfort": 5,
            "return_preference": 5,
            "financial_stability": 5,
        }
        tolerance = risk_scoring.calculate_risk_tolerance(responses)
        self.assertGreaterEqual(tolerance, 85.0)

        capacity, horizon, _ = risk_scoring.calculate_risk_capacity(
            current_age=25,
            retirement_age=60,
            current_wealth=2000000.0,
            monthly_income=200000.0,
            monthly_expenses=50000.0,
            goals=[],
            liabilities=[],
        )
        overall = risk_scoring.combine_risk_scores(tolerance, capacity, horizon)
        category = risk_scoring.determine_risk_category(overall)
        self.assertIn(category, ("Moderately Aggressive", "Aggressive"))
        self.assertGreaterEqual(overall, 80.0)

    def test_03_capacity_guardrail_short_horizon(self):
        """High tolerance + 2-year horizon must be capped by the capacity guardrail."""
        aggressive_responses = {
            "market_decline": 5,
            "investment_objective": 5,
            "volatility_comfort": 5,
            "return_preference": 5,
            "financial_stability": 5,
        }
        tolerance = risk_scoring.calculate_risk_tolerance(aggressive_responses)
        self.assertGreaterEqual(tolerance, 90.0)

        # Short horizon (2 years to retirement / goal)
        capacity, horizon, _ = risk_scoring.calculate_risk_capacity(
            current_age=58,
            retirement_age=60,
            current_wealth=500000.0,
            monthly_income=80000.0,
            monthly_expenses=50000.0,
            goals=[],
            liabilities=[],
        )
        self.assertEqual(horizon, 2.0)
        overall = risk_scoring.combine_risk_scores(tolerance, capacity, horizon)
        # Must be capped: cannot be aggressive when funds are needed in 2 years
        self.assertLessEqual(overall, 45.0)
        category = risk_scoring.determine_risk_category(overall)
        self.assertIn(category, ("Conservative", "Moderately Conservative", "Moderate"))

    def test_04_near_term_goals_reduce_capacity(self):
        """Near-term major goal reduces capacity score relative to distant goals only."""
        class MockGoal:
            def __init__(self, target_age, name):
                self.target_age = target_age
                self.name = name
                self.target_amount = 5000000.0

        # Case 1: distant retirement goal only
        cap_long, _, _ = risk_scoring.calculate_risk_capacity(
            current_age=25,
            retirement_age=55,
            current_wealth=1000000.0,
            monthly_income=150000.0,
            monthly_expenses=60000.0,
            goals=[MockGoal(55, "Retirement")],
            liabilities=[],
        )

        # Case 2: large house goal in 2 years
        cap_short, _, _ = risk_scoring.calculate_risk_capacity(
            current_age=25,
            retirement_age=55,
            current_wealth=1000000.0,
            monthly_income=150000.0,
            monthly_expenses=60000.0,
            goals=[MockGoal(27, "House Downpayment"), MockGoal(55, "Retirement")],
            liabilities=[],
        )

        self.assertLess(cap_short, cap_long)

    # --- 2. API & Security Tests ---

    def test_05_get_questions_metadata(self):
        res = self.client.get("/risk-profile/questions")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["version"], "v1")
        self.assertEqual(len(data["questions"]), 5)
        self.assertEqual(len(data["risk_categories"]), 5)

    def test_06_get_profile_unauthenticated(self):
        res = self.client.get("/risk-profile")
        self.assertEqual(res.status_code, 401)

    def test_07_get_profile_not_completed_returns_404(self):
        cookies = self._register_user("newuser@example.com", "New User")
        res = self.client.get("/risk-profile", cookies=cookies)
        self.assertEqual(res.status_code, 404)
        self.assertIn("not found", res.json()["detail"].lower())

    def test_08_create_and_get_risk_profile(self):
        cookies = self._register_user("aditi@example.com", "Aditi")
        payload = {
            "market_decline": 4,
            "investment_objective": 4,
            "volatility_comfort": 4,
            "return_preference": 4,
            "financial_stability": 4,
        }
        res_post = self.client.post("/risk-profile", json=payload, cookies=cookies)
        self.assertEqual(res_post.status_code, 201)
        data = res_post.json()

        self.assertIn("overall_score", data)
        self.assertIn("risk_tolerance_score", data)
        self.assertIn("risk_capacity_score", data)
        self.assertIn("risk_category", data)
        self.assertIn("recommended_allocation", data)
        self.assertIn("factors", data)
        self.assertIn("narrative", data)
        self.assertGreater(len(data["factors"]), 0)
        self.assertIn(data["risk_category"], ("Moderate", "Moderately Aggressive", "Aggressive"))

        # Query GET /risk-profile
        res_get = self.client.get("/risk-profile", cookies=cookies)
        self.assertEqual(res_get.status_code, 200)
        get_data = res_get.json()
        self.assertEqual(get_data["overall_score"], data["overall_score"])
        self.assertEqual(get_data["risk_category"], data["risk_category"])

    def test_09_update_risk_profile(self):
        cookies = self._register_user("user_update@example.com", "Updater")
        
        # Initial submission (conservative)
        self.client.post("/risk-profile", json={
            "market_decline": 1,
            "investment_objective": 1,
            "volatility_comfort": 1,
            "return_preference": 1,
            "financial_stability": 1,
        }, cookies=cookies)

        # Update to aggressive
        res_put = self.client.put("/risk-profile", json={
            "market_decline": 5,
            "investment_objective": 5,
            "volatility_comfort": 5,
            "return_preference": 5,
            "financial_stability": 5,
        }, cookies=cookies)
        self.assertEqual(res_put.status_code, 200)
        updated_data = res_put.json()
        self.assertGreaterEqual(updated_data["risk_tolerance_score"], 85.0)

    def test_10_multi_user_data_isolation(self):
        """User A cannot access or tamper with User B's risk profile."""
        cookies_a = self._register_user("usera@example.com", "User A")
        cookies_b = self._register_user("userb@example.com", "User B")

        # User A creates their profile
        self.client.post("/risk-profile", json={
            "market_decline": 4,
            "investment_objective": 4,
            "volatility_comfort": 4,
            "return_preference": 4,
            "financial_stability": 4,
        }, cookies=cookies_a)

        # Get User A's ID
        user_a_me = self.client.get("/auth/me", cookies=cookies_a).json()
        user_a_id = user_a_me["id"]

        # User B attempts to read User A's profile via direct user_id endpoint
        res_cross_read = self.client.get(f"/api/users/{user_a_id}/risk-profile", cookies=cookies_b)
        self.assertEqual(res_cross_read.status_code, 403)

        # User B attempts to overwrite User A's profile
        res_cross_write = self.client.put(f"/api/users/{user_a_id}/risk-profile", json={
            "market_decline": 1,
            "investment_objective": 1,
            "volatility_comfort": 1,
            "return_preference": 1,
            "financial_stability": 1,
        }, cookies=cookies_b)
        self.assertEqual(res_cross_write.status_code, 403)

    def test_11_validation_rejects_invalid_values(self):
        cookies = self._register_user("validation@example.com", "Val")
        # Value 0 is out of bounds (allowed: 1-5)
        res = self.client.post("/risk-profile", json={
            "market_decline": 0,
            "investment_objective": 4,
            "volatility_comfort": 4,
            "return_preference": 4,
            "financial_stability": 4,
        }, cookies=cookies)
        self.assertEqual(res.status_code, 422)

        # Value 6 is out of bounds
        res2 = self.client.post("/risk-profile", json={
            "market_decline": 6,
            "investment_objective": 4,
            "volatility_comfort": 4,
            "return_preference": 4,
            "financial_stability": 4,
        }, cookies=cookies)
        self.assertEqual(res2.status_code, 422)
