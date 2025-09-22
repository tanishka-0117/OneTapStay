@echo off
echo Starting OneTapStay Backend Server...
cd /d "C:\Users\saxen\OneDrive\Documents\OneTapStay\onetapstay\backend"
echo Current directory: %CD%
echo.
echo Starting server with ts-node...
npx ts-node src/index.ts
pause