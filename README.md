# 🔮 FinTwin — Your Financial Future, Simulated

FinTwin is a sophisticated, probabilistic **Personal Financial Digital Twin** and **Monte Carlo Engine** designed to replace deterministic financial planning. Instead of predicting a single linear trajectory, FinTwin simulates thousands of possible futures, mapping out risk boundaries, Value-at-Risk (VaR), Conditional Value-at-Risk (CVaR), and retirement ruin probabilities with production-grade user authentication and data isolation.

---

## 1. Authentication & Security Architecture

FinTwin includes a production-quality, cookie-based authentication system:

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                       │
│  - AuthContext (useAuth): user, isAuthenticated, isLoading   │
│  - AuthModal: Sign In, Register, Continue with Google       │
│  - Centralized API client (fetch with credentials: include, │
│    automatic 401 refresh token interceptor)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Cookies: access_token, refresh_token
                               │ credentials: "include"
┌──────────────────────────────▼──────────────────────────────┐
│                     FastAPI Backend                         │
│  - /auth/register, /auth/login, /auth/refresh, /auth/logout │
│  - /auth/me, /auth/google/login, /auth/google/callback      │
│  - Dependency: get_current_user (reads cookie, verifies JWT)│
│  - User Data Isolation: all DB queries filtered by user_id  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    SQLAlchemy / Database                    │
│  - User Model: id, email, hashed_password, google_id,       │
│    name, avatar_url, is_active, created_at                  │
│  - Foreign Keys: user_profiles, asset_allocations, goals,   │
│    life_events, liabilities, simulation_runs                │
└─────────────────────────────────────────────────────────────┘
```

### Security Measures
- **httpOnly Cookies**: Access (`15 min`) and Refresh (`7 days`) JWT tokens are stored exclusively in `HttpOnly`, `SameSite=Lax` cookies. Tokens are **never** returned in JSON or stored in JavaScript storage (`localStorage`/`sessionStorage`).
- **Strict Data Isolation**: Every database query establishes authenticated ownership (`user_id == current_user.id`), preventing IDOR vulnerabilities, cross-user data leakage, or tampering.
- **Password Security**: Passwords are securely hashed using `bcrypt` (never stored in plaintext).
- **Google OAuth 2.0**: Implements state-based CSRF protection, verified email verification, and automatic account linking.

---

## 2. Authentication API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register with name, email & password (sets httpOnly cookies) | No |
| `POST` | `/auth/login` | Login with email & password (sets httpOnly cookies) | No |
| `POST` | `/auth/refresh` | Rotate access & refresh tokens from httpOnly cookie | No (Cookie) |
| `POST` | `/auth/logout` | Clear access & refresh cookies | No |
| `GET` | `/auth/me` | Retrieve authenticated user's profile | **Yes** |
| `GET` | `/auth/google/login` | Initiate Google OAuth 2.0 flow with state protection | No |
| `GET` | `/auth/google/callback` | Google OAuth callback handler & token exchange | No |

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the root and configure your values:

```env
# Database configuration (PostgreSQL or SQLite)
DATABASE_URL=sqlite:///./fintwin.db

# Environment mode (development / production)
ENVIRONMENT=development

# JWT Authentication
JWT_SECRET=fintwin-super-secret-jwt-key-change-in-production-1234567890
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Cookie Settings
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Optional: Gemini API Key for Copilot AI chat
GEMINI_API_KEY=
```

---

## 4. Google Cloud OAuth 2.0 Setup Guide

To enable Google login:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `FinTwin`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - Select **External** and click **Create**.
   - Fill in **App name** (`FinTwin`), **User support email**, and **Developer contact information**.
   - Add scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `FinTwin Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/auth/google/callback`
5. Copy the **Client ID** and **Client Secret** into your `.env` file (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).

---

## 5. Mathematical Simulation Engine

FinTwin supports three distinct multivariate market models and four decumulation rules:

### A. Market Return Models
1. **Parametric Monte Carlo**:
   Generates joint log-normal asset returns using the Cholesky decomposition of the covariance matrix:
   $$\mathbf{R}_t = \boldsymbol{\mu} + \mathbf{L} \mathbf{Z}_t$$
   where $\boldsymbol{\mu}$ is the expected returns vector, $\mathbf{L}$ is the lower triangular Cholesky factor of the correlation matrix ($\mathbf{\Sigma} = \mathbf{L}\mathbf{L}^T$), and $\mathbf{Z}_t \sim \mathcal{N}(0, \mathbf{I})$ is a vector of independent standard normals.
   
2. **Historical Bootstrap**:
   Resamples vector return observations directly from the joint Indian market dataset (Nifty 50, Gold, Debt, FD) spanning 2010–2024. This preserves the non-normal skewness, kurtosis, and empirical correlations without making parametric assumptions.

3. **Markov Regime-Switching**:
   Transitions the market state through five distinct regimes: $\mathcal{S}_t \in \{\text{BULL}, \text{NORMAL}, \text{BEAR}, \text{CRISIS}, \text{RECOVERY}\}$ using a transition probability matrix $\mathbf{P}$.

### B. Decumulation & Withdrawal Guardrails
- **Fixed & Inflation-Adjusted**: Withdrawals grow strictly by the simulated annual inflation rate.
- **Percentage (4% Rule)**: Fixed percentage of the portfolio value is withdrawn annually.
- **Guyton-Klinger Guardrails**: Dynamic rules-based withdrawal adjustment with Capital Preservation and Prosperity rules.

---

## 6. Running Locally

### Backend Setup
1. Navigate to backend and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Run database migrations:
   ```bash
   alembic upgrade head
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
4. Start the Celery worker (optional, for async simulation runs):
   ```bash
   celery -A app.worker.celery_app worker --loglevel=info
   ```

### Frontend Setup
1. Navigate to frontend and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Running Automated Tests

Run the complete test suite (Authentication + Data Isolation + Monte Carlo Verification):
```bash
pytest backend/tests/ -v
```
