@echo off
echo ========================================
echo    OneTapStay - Complete Server Startup
echo ========================================
echo.
echo This will start both Backend and Frontend servers
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Press any key to continue...
pause >nul

echo.
echo Starting Backend Server...
start "OneTapStay Backend" cmd /k "cd /d C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend && npm run dev"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "OneTapStay Frontend" cmd /k "cd /d C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\frontend && npm run dev"

echo.
echo ========================================
echo    Both servers are starting up!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001 (auto-switches from 3000)
echo.
echo Wait for both servers to fully load, then:
echo 1. Go to http://localhost:3001/admin to access admin dashboard
echo 2. Go to http://localhost:3001/auth/login for guest login
echo.
echo Press any key to exit...
pause >nul