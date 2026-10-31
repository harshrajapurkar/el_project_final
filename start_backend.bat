@echo off
echo =====================================================================
echo  Sem-EL Project: Starting FastAPI Python Backend (Port 8000)
echo =====================================================================

cd backend

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: Check/create virtual environment
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate

echo [INFO] Installing / verifying dependencies from requirements.txt...
pip install -r requirements.txt

echo [INFO] Starting Uvicorn FastAPI Server on http://127.0.0.1:8000 ...
echo [INFO] Swagger API Documentation available at http://127.0.0.1:8000/docs
uvicorn main:app --reload --host 127.0.0.1 --port 8000

pause
