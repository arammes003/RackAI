@echo off

echo Starting Client...
start "Client" cmd /k "cd app\client && npm run dev"

echo Starting Server...
start "Server" cmd /k "cd app\server && .venv\Scripts\activate && uvicorn main:app --reload"

echo App started!
