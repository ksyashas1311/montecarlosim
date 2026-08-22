import os
from pathlib import Path
from typing import Optional, List
from dotenv import load_dotenv

# Search workspace root and backend directory for .env
_REPO_ROOT = Path(__file__).resolve().parents[3]
if (_REPO_ROOT / ".env").exists():
    load_dotenv(_REPO_ROOT / ".env", override=True)
load_dotenv(override=True)


def _normalize_database_url(url: str) -> str:
    """Normalize PostgreSQL URL schemes for SQLAlchemy compatibility.
    
    Render, Supabase, Neon, and Heroku often provide `postgres://` or `postgresql://`.
    SQLAlchemy 2.0+ requires `postgresql+psycopg2://` or `postgresql://`.
    """
    if not url:
        return "sqlite:///./fintwin.db"
    
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


class Settings:
    # Environment & Server
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database
    RAW_DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fintwin.db")
    DATABASE_URL: str = _normalize_database_url(RAW_DATABASE_URL)
    
    # AI Copilot
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "fintwin-super-secret-jwt-key-change-in-production-1234567890")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # Cookie Settings
    # In production (cross-domain Vercel -> Render), cookies require Secure=True and SameSite=None
    _is_prod: bool = os.getenv("ENVIRONMENT", "development").lower() == "production"
    _cookie_secure_env: Optional[str] = os.getenv("COOKIE_SECURE")
    COOKIE_SECURE: bool = (
        _cookie_secure_env.lower() in ("true", "1", "yes") 
        if _cookie_secure_env is not None 
        else _is_prod
    )
    
    COOKIE_SAMESITE: str = os.getenv(
        "COOKIE_SAMESITE", 
        "none" if COOKIE_SECURE else "lax"
    ).lower()
    
    COOKIE_DOMAIN: Optional[str] = os.getenv("COOKIE_DOMAIN", None)

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

    # Frontend URL & CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")

    @property
    def allowed_cors_origins(self) -> List[str]:
        """Compute list of unique, non-empty allowed CORS origins."""
        origins = {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        }
        if self.FRONTEND_URL:
            for u in self.FRONTEND_URL.split(","):
                u_clean = u.strip()
                if u_clean:
                    origins.add(u_clean)
        if self.CORS_ORIGINS:
            for u in self.CORS_ORIGINS.split(","):
                u_clean = u.strip()
                if u_clean:
                    origins.add(u_clean)
        return list(origins)


settings = Settings()
