@echo off
echo =====================================================================
echo  Sem-EL Project: Starting React/Vite Frontend Application (Port 3000)
echo =====================================================================

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    npm install
)

echo [INFO] Launching Development Server on http://localhost:3000 ...
npm run dev

pause
