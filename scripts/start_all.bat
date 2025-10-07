@echo off
setlocal
set SCRIPTS=%~dp0
start "FastAPI 8001"  cmd /k "%SCRIPTS%run_fastapi.bat"
start "Laravel 8000"  cmd /k "%SCRIPTS%run_laravel.bat"
start "Frontend 3000" cmd /k "%SCRIPTS%run_frontend.bat"
