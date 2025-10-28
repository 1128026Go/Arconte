@echo off
chcp 65001 >nul
cls

echo ════════════════════════════════════════════════════════════════
echo   ARCONTE - Iniciando Frontend React
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0Aplicacion Juridica\apps\web"

if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
)

echo.
echo 🚀 Iniciando Vite en puerto 3000...
echo.
npm run dev
