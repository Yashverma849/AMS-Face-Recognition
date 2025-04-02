@echo off
echo Starting BPIT Attendance System with Python Face Recognition...

REM Start Python backend in a separate window
start cmd /k "cd api && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak

REM Start frontend
echo Starting frontend...
npm run dev 