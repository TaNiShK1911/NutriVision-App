@echo off
echo Starting NutriVision Backend Servers...
echo.

echo Starting Model Server (Port 5000)...
start "NutriVision Model Server" python backend/model_server.py

echo Starting Gemini Server (Port 5001)...
start "NutriVision Gemini Server" python backend/gemini_server.py

echo.
echo Servers are starting in separate windows.
echo Please wait a few seconds for them to initialize.
echo.
echo Once started, you can run: python backend/test_backend.py
pause
