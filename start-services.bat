@echo off
echo Starting LegalAid Connect Services...
echo.

echo Starting Backend Server on port 5000...
start "Backend Server" cmd /k "npm run server:dev"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend on port 3000...
start "Frontend" cmd /k "npm run dev"

echo.
echo Services are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
