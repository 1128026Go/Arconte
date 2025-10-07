@echo off
for %%P in (3000 8000 8001) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
  )
)
