#!/bin/bash
export CELERY_TASK_ALWAYS_EAGER=True
export CELERY_TASK_STORE_EAGER_RESULT=True
export DATABASE_URL="sqlite:///./fintwin.db"
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
