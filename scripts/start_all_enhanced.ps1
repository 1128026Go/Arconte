param([switch]$NoBuild=$false)
# Start Laravel, FastAPI, Frontend en consolas separadas
$ROOT="C:\Users\User\Herd\Aplicacion Juridica"
$API ="$ROOT\apps\api_php"
$WEB ="$ROOT\apps\web"
$PY  ="$ROOT\apps\ingest_py"

Write-Host "=== INICIANDO APLICACION JURIDICA ENDURECIDA ===" -ForegroundColor Green

# Verificar si Laravel está en Herd
$herdRunning = $false
try {
    $response = Invoke-WebRequest -Uri "https://api-juridica.test/api" -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $herdRunning = $true
        Write-Host "OK Laravel API (Herd): FUNCIONANDO" -ForegroundColor Green
    }
} catch {
    Write-Host "WARN Laravel API (Herd): NO DISPONIBLE" -ForegroundColor Yellow
}

# FastAPI
$fastRunning = $null -ne (netstat -ano | findstr ":8001")
if (-not $fastRunning) {
    Write-Host "Iniciando FastAPI..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PY'; if (Test-Path .\.venv\Scripts\Activate.ps1){ & .\.venv\Scripts\Activate.ps1 }; python run_server_enhanced.py"
    Start-Sleep -Seconds 2
} else {
    Write-Host "OK FastAPI: YA EJECUTANDOSE" -ForegroundColor Green
}

# Frontend
$frontRunning = $null -ne (netstat -ano | findstr ":3000")
if (-not $frontRunning) {
    if (-not $NoBuild) {
        Write-Host "Construyendo Frontend..." -ForegroundColor Cyan
        Set-Location "$WEB"
        npm install --silent 2>$null
        npm run build 2>$null
    }
    Write-Host "Iniciando Frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$WEB'; npx serve dist -p 3000"
} else {
    Write-Host "OK Frontend: YA EJECUTANDOSE" -ForegroundColor Green
}

Start-Sleep -Seconds 3

# Verificación final
Write-Host "=== VERIFICACION FINAL ===" -ForegroundColor Yellow
$frontOk = try { (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch { $false }
$fastOk = try { (Invoke-WebRequest -Uri "http://127.0.0.1:8001/healthz" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch { $false }

if ($frontOk) { Write-Host "OK Frontend: http://localhost:3000" -ForegroundColor Green }
else { Write-Host "ERROR Frontend: FALLO" -ForegroundColor Red }

if ($herdRunning) { Write-Host "OK Laravel: https://api-juridica.test/api" -ForegroundColor Green }
else { Write-Host "ERROR Laravel: FALLO" -ForegroundColor Red }

if ($fastOk) { Write-Host "OK FastAPI: http://127.0.0.1:8001" -ForegroundColor Green }
else { Write-Host "ERROR FastAPI: FALLO" -ForegroundColor Red }

if ($frontOk -and $herdRunning -and $fastOk) {
    Write-Host "APLICACION 100% OPERATIVA" -ForegroundColor Green
    Start-Process "http://localhost:3000"
} else {
    Write-Host "Algunos servicios requieren atencion" -ForegroundColor Yellow
}