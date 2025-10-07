# scripts/dev-all.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Write-Host "Iniciando servicios de desarrollo..." -ForegroundColor Green

# ---- FastAPI ----
Write-Host "Configurando FastAPI..." -ForegroundColor Yellow
cd $root
if (-not (Test-Path ".venv")) { 
    Write-Host "Creando entorno virtual Python..." -ForegroundColor Cyan
    py -3 -m venv .venv 
}
. ".\.venv\Scripts\Activate.ps1"
pip install -q fastapi "uvicorn[standard]" httpx pydantic

$busy = (netstat -ano | findstr :8000) -ne $null
if (-not $busy) {
    Write-Host "Iniciando FastAPI en puerto 8000..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList '-NoExit','-Command',"cd `"$root`"; . .\.venv\Scripts\Activate.ps1; uvicorn apps.ingest_py.src.main:app --host 0.0.0.0 --port 8000 --reload"
} else {
    Write-Host "FastAPI ya está ejecutándose en puerto 8000" -ForegroundColor Yellow
}

# ---- Frontend (Vite) ----
Write-Host "Configurando Frontend..." -ForegroundColor Yellow
$web = Join-Path $root 'apps\web'
Push-Location $web
npm install --silent
Write-Host "Iniciando Vite dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd `"$web`"; npm run dev"
Pop-Location

Write-Host "`n=== SERVICIOS LISTOS ===" -ForegroundColor Green
Write-Host "FastAPI: http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Laravel API: https://api-juridica.test/api" -ForegroundColor White