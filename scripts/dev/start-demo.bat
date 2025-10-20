@echo off
setlocal enabledelayedexpansion

REM ====================================================================
REM  ARCONTE - DEMO ENVIRONMENT STARTUP
REM  Inicia el ambiente de demo con datos precargados
REM ====================================================================

title Arconte - Demo Environment

color 0B
echo.
echo  ========================================
echo   ARCONTE - Demo Environment
echo  ========================================
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0\..\.."

REM Reset demo environment
echo [1/2] Resetting demo environment...
cd apps\api_php
php artisan demo:reset --fresh
cd ..\..

echo.
echo [2/2] Starting services...
call scripts\dev\start-all.bat

