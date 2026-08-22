#!/usr/bin/env bash
set -e

echo "Starting FinTwin Development Servers..."

# Start Backend in background
cd backend
../engine/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start Frontend
cd frontend
npm run dev -- --port 3000 &
FRONTEND_PID=$!
cd ..

echo "Backend running on http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)"
echo "Frontend running on http://localhost:3000"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT
wait
