import sys
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

_APP_DIR = os.path.abspath(os.path.dirname(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_APP_DIR, ".."))
_REPO_ROOT = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
for _p in (_BACKEND_DIR, _REPO_ROOT):
    if _p not in sys.path:
        sys.path.append(_p)

from app import models
from app.database import engine, ensure_schema
from app.core.config import settings
from app.core.exceptions import FinTwinException, fintwin_exception_handler, generic_exception_handler
from app.api import (
    auth, users, profile, assets, goals, life_events, 
    liabilities, simulations, optimization, stress, copilot
)

models.Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(
    title="FinTwin Backend API",
    description="REST API & Quantitative Simulation Engine for Personal Financial Digital Twin with Production Authentication",
    version="1.0.0"
)

# CORS configuration with credentials support
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set([origin.strip() for origin in allowed_origins if origin])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(FinTwinException, fintwin_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include routers
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")
app.include_router(users.router)
app.include_router(profile.router)
app.include_router(assets.router)
app.include_router(goals.router)
app.include_router(life_events.router)
app.include_router(liabilities.router)
app.include_router(simulations.router)
app.include_router(optimization.router)
app.include_router(stress.router)
app.include_router(copilot.router)

_BASE_DIR = Path(__file__).resolve().parents[2]
_FRONTEND_OUT = _BASE_DIR / "frontend" / "out"
if _FRONTEND_OUT.is_dir():
    app.mount("/static", StaticFiles(directory=str(_FRONTEND_OUT), html=True), name="static")
    app.mount("/", StaticFiles(directory=str(_FRONTEND_OUT), html=True), name="frontend")
