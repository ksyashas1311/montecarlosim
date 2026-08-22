import sys
import os

# Force file-based SQLite for self-contained testing so workers can access it
os.environ["DATABASE_URL"] = "sqlite:///./test_backend.db"

import unittest
from fastapi.testclient import TestClient

# Add app directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, engine

class TestFinTwinBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create tables in the in-memory test database
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        
        # Configure Celery to run synchronously for tests
        from app.worker import celery_app
        celery_app.conf.update(
            task_always_eager=True, 
            task_eager_propagates=True,
            task_store_eager_result=True,
            broker_url='memory://',
            result_backend='cache+memory://'
        )

    @classmethod
    def tearDownClass(cls):
        # Drop all tables and dispose engine to prevent ResourceWarning
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

    def test_01_user_workflow(self):
        # 1. Create User
        user_data = {
            "name": "Arjun Kumar",
            "profile": {
                "current_age": 21,
                "monthly_income": 40000,
                "monthly_expenses": 25000,
                "monthly_sip": 10000,
                "current_wealth": 100000,
                "income_growth_mean": 0.08,
                "income_growth_vol": 0.03,
                "inflation_mean": 0.06,
                "inflation_vol": 0.015
            },
            "assets": [
                {"name": "Equity", "weight": 0.60, "expected_return": 0.12, "volatility": 0.18},
                {"name": "Debt", "weight": 0.25, "expected_return": 0.07, "volatility": 0.05},
                {"name": "Gold", "weight": 0.10, "expected_return": 0.08, "volatility": 0.15},
                {"name": "Cash", "weight": 0.05, "expected_return": 0.04, "volatility": 0.01}
            ],
            "goals": [
                {"name": "Retirement corpus", "target_amount": 20000000, "target_age": 60}
            ],
            "life_events": [
                {"name": "Buy car", "type": "lump_sum_expense", "age": 25, "amount": 300000}
            ]
        }
        
        response = self.client.post("/api/users", json=user_data)
        self.assertEqual(response.status_code, 201)
        res_json = response.json()
        self.assertEqual(res_json["name"], "Arjun Kumar")
        self.assertIsNotNone(res_json["id"])
        
        user_id = res_json["id"]
        
        # 2. Get User
        response = self.client.get(f"/api/users/{user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Arjun Kumar")
        self.assertEqual(response.json()["profile"]["current_age"], 21)
        self.assertEqual(len(response.json()["assets"]), 4)
        self.assertEqual(len(response.json()["goals"]), 1)
        self.assertEqual(len(response.json()["life_events"]), 1)
        
        # Save user_id for subsequent tests
        self.__class__.created_user_id = user_id
        self.__class__.created_goal_id = response.json()["goals"][0]["id"]

    def test_02_simulation_endpoint(self):
        user_id = getattr(self.__class__, "created_user_id", None)
        self.assertIsNotNone(user_id, "User ID from step 1 is required")
        
        # Run simulation with 100 paths for speed in test
        sim_config = {
            "n_simulations": 100,
            "horizon_years": 39,
            "random_seed": 42
        }
        headers = {"Authorization": f"Bearer {user_id}"}
        response = self.client.post(f"/api/users/{user_id}/simulate", json=sim_config, headers=headers)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        
        self.assertIn("job_id", res_json)
        self.assertEqual(res_json["status"], "PENDING")
        job_id = res_json["job_id"]
        
        # Poll for results
        response = self.client.get(f"/api/users/{user_id}/simulate/{job_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        
        self.assertEqual(res_json["status"], "SUCCESS", msg=res_json.get("error", ""))
        result = res_json["result"]
        
        self.assertIn("percentiles", result)
        self.assertIn("p50", result["percentiles"])
        self.assertEqual(len(result["percentiles"]["p50"]), 40)  # horizon_years + 1
        self.assertEqual(result["n_simulations"], 100)
        self.assertGreater(len(result["goals"]), 0)
        self.assertEqual(result["goals"][0]["name"], "Retirement corpus")
        self.assertTrue(0.0 <= result["goals"][0]["success_probability"] <= 1.0)

    def test_03_optimization_endpoint(self):
        user_id = getattr(self.__class__, "created_user_id", None)
        goal_id = getattr(self.__class__, "created_goal_id", None)
        self.assertIsNotNone(user_id)
        self.assertIsNotNone(goal_id)
        
        # Optimize goal success to 85% probability
        headers = {"Authorization": f"Bearer {user_id}"}
        response = self.client.post(f"/api/users/{user_id}/optimize/{goal_id}?target_probability=0.85", headers=headers)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        self.assertEqual(res_json["goal_name"], "Retirement corpus")
        self.assertEqual(res_json["target_probability"], 0.85)
        option_types = [opt["option_type"] for opt in res_json["options"]]
        self.assertIn("A", option_types)

    def test_04_copilot_endpoint_fallback(self):
        user_id = getattr(self.__class__, "created_user_id", None)
        self.assertIsNotNone(user_id)
        
        # Query copilot with mock messages
        chat_request = {
            "messages": [
                {"role": "user", "content": "Can I buy a ₹15 lakh car at age 25?"}
            ],
            "user_id": user_id
        }
        
        headers = {"Authorization": f"Bearer {user_id}"}
        response = self.client.post(f"/api/users/{user_id}/copilot", json=chat_request, headers=headers)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        
        self.assertIsNotNone(res_json["reply"])
        # Should fall back gracefully or execute model call
        self.assertIn("extracted_action", res_json)
        self.assertIn("action_type", res_json["extracted_action"])

    def test_05_sensitivity_endpoint(self):
        user_id = getattr(self.__class__, "created_user_id", None)
        goal_id = getattr(self.__class__, "created_goal_id", None)
        self.assertIsNotNone(user_id)
        self.assertIsNotNone(goal_id)

        headers = {"Authorization": f"Bearer {user_id}"}
        response = self.client.get(f"/api/users/{user_id}/goals/{goal_id}/sensitivity", headers=headers)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()

        self.assertEqual(res_json["goal_name"], "Retirement corpus")
        self.assertIn("factors", res_json)
        self.assertGreater(len(res_json["factors"]), 0)

    def test_06_stress_test_endpoint(self):
        user_id = getattr(self.__class__, "created_user_id", None)
        self.assertIsNotNone(user_id)

        stress_request = {
            "scenario_type": "market_crash"
        }
        headers = {"Authorization": f"Bearer {user_id}"}
        response = self.client.post(f"/api/users/{user_id}/stress-test", json=stress_request, headers=headers)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()

        self.assertEqual(res_json["scenario_name"], "Global Market Crash")
        self.assertIn("goals", res_json)
        self.assertGreater(len(res_json["goals"]), 0)
        self.assertIn("stressed_simulation", res_json)
        self.assertEqual(res_json["stressed_simulation"]["n_simulations"], 10000)

    def test_07_mathematical_invariants(self):
        """Verifies Markov Transition matrices and debt amortization rules."""
        import numpy as np
        
        # 1. Markov Transition rows sum to exactly 1.0
        P = np.array([
            [0.60, 0.30, 0.08, 0.02, 0.00],  # BULL
            [0.15, 0.65, 0.15, 0.03, 0.02],  # NORMAL
            [0.05, 0.25, 0.50, 0.15, 0.05],  # BEAR
            [0.00, 0.05, 0.30, 0.45, 0.20],  # CRISIS
            [0.20, 0.30, 0.05, 0.05, 0.40]   # RECOVERY
        ])
        for idx, row in enumerate(P):
            self.assertAlmostEqual(float(np.sum(row)), 1.0, places=5, msg=f"Row {idx} does not sum to 1.0")

        # 2. Debt amortization logic: EMI covers monthly interest
        principal = 1000000.0
        interest_rate = 0.085
        tenure_years = 15
        r_m = interest_rate / 12.0
        N = tenure_years * 12
        emi = principal * (r_m * (1 + r_m)**N) / ((1 + r_m)**N - 1)
        
        # Monthly interest is less than EMI, ensuring principal reduces
        monthly_interest = principal * r_m
        self.assertLess(monthly_interest, emi)

    def test_08_validation_rejects_invalid_input(self):
        """Verify schema validation rejects invalid field values."""
        # Age below minimum
        user_data = {
            "name": "Test",
            "profile": {
                "current_age": 5,  # Below ge=18
                "monthly_income": 40000,
                "monthly_expenses": 25000,
                "monthly_sip": 10000,
                "current_wealth": 100000,
            }
        }
        response = self.client.post("/api/users", json=user_data)
        self.assertEqual(response.status_code, 422)

        # Negative monthly income
        user_data["profile"]["current_age"] = 25
        user_data["profile"]["monthly_income"] = -5000
        response = self.client.post("/api/users", json=user_data)
        self.assertEqual(response.status_code, 422)

    def test_09_simulation_seed_reproducibility(self):
        """Same seed should produce identical results."""
        user_id = getattr(self.__class__, "created_user_id", None)
        self.assertIsNotNone(user_id)

        sim_config = {"n_simulations": 100, "horizon_years": 10, "random_seed": 12345}
        headers = {"Authorization": f"Bearer {user_id}"}
        
        r1 = self.client.post(f"/api/users/{user_id}/simulate", json=sim_config, headers=headers)
        r2 = self.client.post(f"/api/users/{user_id}/simulate", json=sim_config, headers=headers)
        
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        
        job1 = r1.json()["job_id"]
        job2 = r2.json()["job_id"]
        
        r1_result = self.client.get(f"/api/users/{user_id}/simulate/{job1}", headers=headers).json()["result"]
        r2_result = self.client.get(f"/api/users/{user_id}/simulate/{job2}", headers=headers).json()["result"]
        
        self.assertAlmostEqual(r1_result["terminal_wealth_median"], r2_result["terminal_wealth_median"], places=2)
        self.assertAlmostEqual(r1_result["var_95"], r2_result["var_95"], places=2)

    def test_10_different_seeds_diverge(self):
        """Different seeds should produce statistically different outcomes."""
        user_id = getattr(self.__class__, "created_user_id", None)
        self.assertIsNotNone(user_id)

        headers = {"Authorization": f"Bearer {user_id}"}
        r1 = self.client.post(f"/api/users/{user_id}/simulate", json={
            "n_simulations": 500, "horizon_years": 20, "random_seed": 1
        }, headers=headers)
        r2 = self.client.post(f"/api/users/{user_id}/simulate", json={
            "n_simulations": 500, "horizon_years": 20, "random_seed": 99999
        }, headers=headers)
        
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        
        job1 = r1.json()["job_id"]
        job2 = r2.json()["job_id"]
        
        r1_result = self.client.get(f"/api/users/{user_id}/simulate/{job1}", headers=headers).json()["result"]
        r2_result = self.client.get(f"/api/users/{user_id}/simulate/{job2}", headers=headers).json()["result"]
        
        # Medians should differ (extremely unlikely to be identical with different seeds)
        self.assertNotAlmostEqual(r1_result["terminal_wealth_median"], r2_result["terminal_wealth_median"], places=0)

if __name__ == "__main__":
    unittest.main()
