import sys
import os
from unittest.mock import patch, MagicMock

# Force file-based SQLite for self-contained testing
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"

import unittest
from fastapi.testclient import TestClient

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import Base, engine, SessionLocal
from app import models
from app.core.security import verify_password, create_access_token, create_refresh_token

class TestAuthSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        
        # Configure Celery for tests
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
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

    # --- 1. Registration Tests ---

    def test_01_successful_registration(self):
        reg_data = {
            "email": "alice@example.com",
            "password": "Password123!",
            "name": "Alice Wonderland"
        }
        response = self.client.post("/auth/register", json=reg_data)
        self.assertEqual(response.status_code, 201)
        res_json = response.json()
        
        # Verify safe user response
        self.assertEqual(res_json["email"], "alice@example.com")
        self.assertEqual(res_json["name"], "Alice Wonderland")
        self.assertIn("id", res_json)
        self.assertTrue(res_json["is_active"])
        
        # Security assertion: tokens are NOT in JSON body
        self.assertNotIn("access_token", res_json)
        self.assertNotIn("refresh_token", res_json)
        self.assertNotIn("password", res_json)
        self.assertNotIn("hashed_password", res_json)
        
        # Security assertion: cookies are set
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        
        # Verify password is hashed in DB
        db = SessionLocal()
        user_in_db = db.query(models.User).filter(models.User.email == "alice@example.com").first()
        self.assertIsNotNone(user_in_db)
        self.assertNotEqual(user_in_db.hashed_password, "Password123!")
        self.assertTrue(verify_password("Password123!", user_in_db.hashed_password))
        db.close()

    def test_02_registration_duplicate_email(self):
        reg_data = {
            "email": "alice@example.com",
            "password": "AnotherPassword123!",
            "name": "Alice Duplicate"
        }
        response = self.client.post("/auth/register", json=reg_data)
        self.assertEqual(response.status_code, 409)
        self.assertIn("already exists", response.json()["detail"])

    def test_03_registration_validation(self):
        # Short password (< 8 characters)
        response = self.client.post("/auth/register", json={
            "email": "valid@example.com",
            "password": "short",
            "name": "Short Pass"
        })
        self.assertEqual(response.status_code, 422)

        # Invalid email format
        response = self.client.post("/auth/register", json={
            "email": "invalid-email-format",
            "password": "Password123!",
            "name": "Bad Email"
        })
        self.assertEqual(response.status_code, 422)

    # --- 2. Login Tests ---

    def test_04_successful_login(self):
        # Clear any cookies first
        self.client.cookies.clear()
        
        login_data = {
            "email": "alice@example.com",
            "password": "Password123!"
        }
        response = self.client.post("/auth/login", json=login_data)
        self.assertEqual(response.status_code, 200)
        res_json = response.json()
        
        self.assertEqual(res_json["email"], "alice@example.com")
        self.assertNotIn("access_token", res_json)
        self.assertNotIn("password", res_json)
        
        # Verify cookies
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)

    def test_05_login_invalid_credentials(self):
        # Wrong password
        response = self.client.post("/auth/login", json={
            "email": "alice@example.com",
            "password": "WrongPassword!"
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid email or password", response.json()["detail"])

        # Nonexistent email
        response = self.client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "Password123!"
        })
        self.assertEqual(response.status_code, 401)

    def test_06_login_inactive_user(self):
        db = SessionLocal()
        inactive_user = models.User(
            email="inactive@example.com",
            name="Inactive User",
            is_active=False
        )
        from app.core.security import get_password_hash
        inactive_user.hashed_password = get_password_hash("Password123!")
        db.add(inactive_user)
        db.commit()
        db.close()

        response = self.client.post("/auth/login", json={
            "email": "inactive@example.com",
            "password": "Password123!"
        })
        self.assertEqual(response.status_code, 403)
        self.assertIn("inactive", response.json()["detail"].lower())

    # --- 3. /auth/me Tests ---

    def test_07_auth_me_authenticated(self):
        # Login alice
        self.client.post("/auth/login", json={"email": "alice@example.com", "password": "Password123!"})
        
        response = self.client.get("/auth/me")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "alice@example.com")

    def test_08_auth_me_unauthenticated(self):
        # Clear cookies
        self.client.cookies.clear()
        response = self.client.get("/auth/me")
        self.assertEqual(response.status_code, 401)

    # --- 4. Refresh Token Tests ---

    def test_09_refresh_token_workflow(self):
        # Login alice to get fresh refresh_token
        login_res = self.client.post("/auth/login", json={"email": "alice@example.com", "password": "Password123!"})
        refresh_cookie = login_res.cookies.get("refresh_token")
        self.assertIsNotNone(refresh_cookie)
        
        # Clear access token to simulate expiry
        self.client.cookies.delete("access_token")
        
        # Call refresh endpoint with refresh cookie
        response = self.client.post("/auth/refresh")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        
        # Verify new access token allows /auth/me
        me_res = self.client.get("/auth/me")
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "alice@example.com")

    def test_10_refresh_missing_or_invalid_cookie(self):
        self.client.cookies.clear()
        response = self.client.post("/auth/refresh")
        self.assertEqual(response.status_code, 401)
        
        # Pass access token instead of refresh token
        bad_token = create_access_token(subject=999)
        self.client.cookies.set("refresh_token", bad_token)
        response = self.client.post("/auth/refresh")
        self.assertEqual(response.status_code, 401)

    # --- 5. Logout Tests ---

    def test_11_logout(self):
        self.client.post("/auth/login", json={"email": "alice@example.com", "password": "Password123!"})
        response = self.client.post("/auth/logout")
        self.assertEqual(response.status_code, 200)
        
        # After logout, accessing /auth/me should fail
        me_res = self.client.get("/auth/me")
        self.assertEqual(me_res.status_code, 401)

    # --- 6. User Data Isolation & IDOR Protection ---

    def test_12_cross_user_data_isolation(self):
        # 1. Register User A (Bob)
        res_bob = self.client.post("/auth/register", json={
            "email": "bob@example.com",
            "password": "Password123!",
            "name": "Bob Builder"
        })
        bob_id = res_bob.json()["id"]
        
        # Bob creates profile & goal
        self.client.put(f"/api/users/{bob_id}/profile", json={
            "current_age": 30,
            "monthly_income": 80000,
            "monthly_expenses": 40000,
            "monthly_sip": 20000,
            "current_wealth": 500000,
        })
        self.client.put(f"/api/users/{bob_id}/goals", json=[
            {"name": "Bob Retirement", "target_amount": 10000000, "target_age": 55}
        ])
        
        # 2. Register User B (Charlie)
        res_charlie = self.client.post("/auth/register", json={
            "email": "charlie@example.com",
            "password": "Password123!",
            "name": "Charlie Chaplin"
        })
        charlie_id = res_charlie.json()["id"]
        
        # Charlie is now the authenticated user in client cookies
        # Attempt to read Bob's user profile directly
        attack_res = self.client.get(f"/api/users/{bob_id}")
        self.assertEqual(attack_res.status_code, 403, "User B must not be able to view User A's data")
        
        # Attempt to update Bob's profile
        attack_update = self.client.put(f"/api/users/{bob_id}/profile", json={
            "current_age": 30,
            "monthly_income": 10000,
            "monthly_expenses": 10000,
            "monthly_sip": 0,
            "current_wealth": 0,
        })
        self.assertEqual(attack_update.status_code, 403, "User B must not be able to overwrite User A's profile")
        
        # Attempt to update Bob's liabilities
        attack_liab = self.client.put(f"/api/users/{bob_id}/liabilities", json=[])
        self.assertEqual(attack_liab.status_code, 403, "User B must not be able to wipe User A's liabilities")

        # Attempt to trigger simulation for Bob
        attack_sim = self.client.post(f"/api/users/{bob_id}/simulate", json={
            "n_simulations": 100,
            "horizon_years": 20
        })
        self.assertEqual(attack_sim.status_code, 403, "User B must not be able to trigger simulations for User A")

    # --- 7. Google OAuth Mocking Tests ---

    def test_13_google_oauth_login_redirect(self):
        response = self.client.get("/auth/google/login", follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        redirect_url = response.headers["location"]
        self.assertIn("accounts.google.com", redirect_url)
        self.assertIn("response_type=code", redirect_url)
        self.assertIn("oauth_state", response.cookies)

    @patch("httpx.AsyncClient.get")
    @patch("httpx.AsyncClient.post")
    def test_14_google_oauth_callback_new_user(self, mock_post, mock_get):
        # 1. Initiate login to get state cookie
        login_res = self.client.get("/auth/google/login", follow_redirects=False)
        state_cookie = login_res.cookies.get("oauth_state")
        self.assertIsNotNone(state_cookie)

        # 2. Mock Google token response
        mock_token_res = MagicMock()
        mock_token_res.status_code = 200
        mock_token_res.json.return_value = {"access_token": "mock-google-token-123"}
        mock_post.return_value = mock_token_res

        # 3. Mock Google userinfo response
        mock_userinfo_res = MagicMock()
        mock_userinfo_res.status_code = 200
        mock_userinfo_res.json.return_value = {
            "sub": "google-sub-123456",
            "email": "david.google@example.com",
            "email_verified": True,
            "name": "David Google",
            "picture": "https://lh3.googleusercontent.com/a/mockavatar"
        }
        mock_get.return_value = mock_userinfo_res

        # 4. Trigger callback
        callback_res = self.client.get(
            f"/auth/google/callback?code=mock_code_123&state={state_cookie}",
            follow_redirects=False
        )
        self.assertEqual(callback_res.status_code, 302)
        self.assertIn("access_token", callback_res.cookies)
        self.assertIn("refresh_token", callback_res.cookies)

        # 5. Verify user created in DB with google_id and null password
        db = SessionLocal()
        created_user = db.query(models.User).filter(models.User.email == "david.google@example.com").first()
        self.assertIsNotNone(created_user)
        self.assertEqual(created_user.google_id, "google-sub-123456")
        self.assertIsNone(created_user.hashed_password)
        self.assertEqual(created_user.name, "David Google")
        self.assertEqual(created_user.avatar_url, "https://lh3.googleusercontent.com/a/mockavatar")
        db.close()

    @patch("httpx.AsyncClient.get")
    @patch("httpx.AsyncClient.post")
    def test_15_google_oauth_callback_link_existing_email(self, mock_post, mock_get):
        # Alice already registered with password in test_01
        # Now Alice logs in via Google with the same email
        login_res = self.client.get("/auth/google/login", follow_redirects=False)
        state_cookie = login_res.cookies.get("oauth_state")

        mock_token_res = MagicMock()
        mock_token_res.status_code = 200
        mock_token_res.json.return_value = {"access_token": "mock-google-token-456"}
        mock_post.return_value = mock_token_res

        mock_userinfo_res = MagicMock()
        mock_userinfo_res.status_code = 200
        mock_userinfo_res.json.return_value = {
            "sub": "google-alice-sub-789",
            "email": "alice@example.com",
            "email_verified": True,
            "name": "Alice In Google",
            "picture": "https://lh3.googleusercontent.com/alice"
        }
        mock_get.return_value = mock_userinfo_res

        callback_res = self.client.get(
            f"/auth/google/callback?code=mock_code_456&state={state_cookie}",
            follow_redirects=False
        )
        self.assertEqual(callback_res.status_code, 302)

        # Verify Alice's existing account now has google_id linked
        db = SessionLocal()
        alice = db.query(models.User).filter(models.User.email == "alice@example.com").first()
        self.assertIsNotNone(alice)
        self.assertEqual(alice.google_id, "google-alice-sub-789")
        # Password should still exist!
        self.assertIsNotNone(alice.hashed_password)
        db.close()

    def test_16_google_oauth_invalid_state(self):
        response = self.client.get(
            "/auth/google/callback?code=mock_code&state=forged_state_value",
            follow_redirects=False
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn("auth_error=invalid_state", response.headers["location"])

if __name__ == "__main__":
    unittest.main()
