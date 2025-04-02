@echo off
echo Starting BPIT Attendance System with Python Face Recognition...

REM Create necessary directories
if not exist data\faces mkdir data\faces
if not exist data\attendance mkdir data\attendance

REM Start Python backend in a separate window
echo Starting Python backend server...
start cmd /k "cd api && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak

REM Check if backend is running
powershell -Command "try { $null = New-Object System.Net.Sockets.TcpClient('localhost', 8000); Write-Host 'Backend started successfully!' -ForegroundColor Green } catch { Write-Host 'Warning: Backend may not have started properly. Check for errors.' -ForegroundColor Yellow }"

REM Start frontend
echo Starting frontend...
npm run dev 