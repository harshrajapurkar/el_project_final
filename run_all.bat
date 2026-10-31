@echo off
echo =====================================================================
echo  Sem-EL Integrated System Launcher (Frontend + Backend)
echo =====================================================================
echo Launching Python FastAPI Backend in a new window...
start "Sem-EL FastAPI Backend (Port 8000)" cmd /k call start_backend.bat

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo Launching React Frontend Application on Port 3000...
call start_frontend.bat
