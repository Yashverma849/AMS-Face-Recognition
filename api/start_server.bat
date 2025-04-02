@echo off
echo Starting Face Recognition API Server...
cd %~dp0
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload 