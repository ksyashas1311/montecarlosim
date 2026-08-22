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
| `GET` | `/risk-profile/questions` | Retrieve questionnaire questions, options & weights | No |
| `GET` | `/risk-profile` | Get current user's risk assessment (scores, category, factors) | **Yes** |
| `POST` | `/risk-profile` | Submit questionnaire, compute multi-dimensional risk profile | **Yes** |
| `PUT` | `/risk-profile` | Update and recalculate risk assessment | **Yes** |

---

## 3. Quantitative Risk Profiling Engine

FinTwin includes a deterministic, multi-dimensional **Risk Profiling Engine** that differentiates **Psychological Risk Tolerance** (willingness) from **Empirical Risk Capacity** (financial ability):

- **Risk Tolerance Score ($0 - 100$)**: Weighted evaluation of psychological loss aversion (-20% drop reaction), investment objectives, volatility comfort, return/risk preference, and stability self-assessment.
- **Risk Capacity Score ($0 - 100$)**: Calculated from:
  - *Primary Investment Horizon* (40%): Years to retirement and target goals.
  - *Liquidity & Emergency Buffer* (25%): Existing wealth relative to monthly expenses.
  - *Debt-to-Income / EMI Burden* (15%): Total monthly debt payments relative to income.
  - *Goal Density Drag* (20%): Proximity of near-term high-priority cash outflows (<3 yrs).
- **Safety Bottleneck Guardrails**: Prevents aggressive classification when primary horizon is under 3 years, regardless of emotional appetite.
- **Risk Categories**:
  - `0–20`: Conservative
  - `21–40`: Moderately Conservative
  - `41–60`: Moderate
  - `61–80`: Moderately Aggressive
  - `81–100`: Aggressive
- **Goal-by-Goal Breakdown**: Recommends customized sub-horizon strategies for each registered financial goal.

---

## 4. Environment Variables Configuration

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

## 6. Production Deployment Guide

FinTwin is designed for modern cloud deployment:

```
┌─────────────────────────┐          ┌─────────────────────────┐
│     Vercel Frontend     │ ───────► │     Render Backend      │
│  (Next.js App Router)   │          │  (FastAPI + Uvicorn)    │
│  https://app.vercel.app │ ◄─────── │  https://api.render.com │
└─────────────────────────┘          └───────────┬─────────────┘
                                                 │
                                     ┌───────────▼─────────────┐
                                     │  Managed PostgreSQL DB  │
                                     │  (Render / Supabase)    │
                                     └─────────────────────────┘
```

---

### A. Backend Deployment (Render)

1. **Create Render Account & Connect Repository**:
   - Go to [render.com](https://render.com) and create an account.
   - Click **New +** → **Blueprint** (or **Web Service**).
   - Select your GitHub repository: `https://github.com/ksyashas1311/montecarlosim`.

2. **Blueprint Configuration (`render.yaml`)**:
   Render will automatically detect [`render.yaml`](file:///home/ksyash13/Projects/render.yaml) in the root directory:
   - **Service Name**: `fintwin-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Pre-Deploy Command (Migrations)**: `alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`

3. **Required Render Environment Variables**:

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Injected automatically from attached Render PostgreSQL |
| `ENVIRONMENT` | Application mode | `production` |
| `JWT_SECRET` | 256-bit secure secret key | Auto-generated by Render Blueprint or via `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `JWT_ALGORITHM` | Cryptographic algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifespan | `7` |
| `COOKIE_SECURE` | HTTPS cookie flag | `true` |
| `COOKIE_SAMESITE` | Cross-domain cookie policy | `none` (required for Vercel ↔ Render cross-domain requests) |
| `FRONTEND_URL` | Deployed Vercel URL | `https://your-fintwin-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Google OAuth Callback URL | `https://fintwin-backend.onrender.com/auth/google/callback` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini AI key | From Google AI Studio |

---

### B. Database Setup & Migrations (PostgreSQL)

1. **Create Managed PostgreSQL Database**:
   - In Render, click **New +** → **PostgreSQL**.
   - Set Name: `fintwin-db`, Database: `fintwin`, User: `fintwin_user`.
   - Copy the **Internal Database URL** into the backend service's `DATABASE_URL` (handled automatically if using `render.yaml`).
2. **Execute Migrations**:
   - Alembic migrations execute automatically on each deployment via the pre-deploy command:
     ```bash
     alembic upgrade head
     ```
   - To manually run migrations from local or CI:
     ```bash
     DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/fintwin" alembic upgrade head
     ```

---

### C. Frontend Deployment (Vercel)

1. **Import Project to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
   - Select your GitHub repository.
2. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `next build` (or `npm run build`)
   - **Output Directory**: `.next` (default)
3. **Configure Environment Variables in Vercel**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://fintwin-backend.onrender.com` | Your deployed Render backend URL (no trailing slash) |

4. **Deploy**:
   - Click **Deploy**. Vercel will build and assign a domain (e.g. `https://fintwin-xxxx.vercel.app`).
   - Copy this domain and paste it into your Render backend's `FRONTEND_URL` environment variable.

---

### D. Google Cloud OAuth 2.0 Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud project.
3. Navigate to **APIs & Services** → **OAuth consent screen**:
   - User Type: **External**
   - App Name: `FinTwin`
   - User support email & Developer contact info: your email.
   - Scopes: `openid`, `email`, `profile`.
4. Navigate to **APIs & Services** → **Credentials**:
   - Click **+ Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `FinTwin Web Client`.
   - **Authorized JavaScript origins**:
     - Local: `http://localhost:3000`
     - Production: `https://your-fintwin-app.vercel.app`
   - **Authorized redirect URIs**:
     - Local: `http://localhost:8000/auth/google/callback`
     - Production: `https://fintwin-backend.onrender.com/auth/google/callback`
5. Copy the **Client ID** and **Client Secret** into your Render environment variables (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).

---

### E. Cross-Domain Cookie Security & CORS

Because the frontend (`vercel.app`) and backend (`onrender.com`) are deployed on different top-level domains:
- All fetch requests in the frontend API client include `credentials: "include"`.
- The FastAPI backend sets `CORSMiddleware` with `allow_credentials=True` and explicitly whitelists the `FRONTEND_URL` (no wildcard `*`).
- Authentication cookies (`access_token`, `refresh_token`) are issued with:
  - `HttpOnly=True`: Immune to XSS / JavaScript extraction.
  - `Secure=True`: Enforced over HTTPS.
  - `SameSite=None`: Allows the browser to transmit the cookie in cross-origin fetch requests from Vercel to Render.

---

## 7. Running Locally

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

## 8. Running Automated Tests

Run the complete test suite (Authentication + Risk Profiling + Monte Carlo Verification):
```bash
pytest backend/tests/ -v
```
