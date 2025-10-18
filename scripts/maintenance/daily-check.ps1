#!/usr/bin/env pwsh
# Daily Health Check - Arconte (Windows PowerShell)
# Verifica que los servicios y la autenticación funcionen correctamente

$ErrorActionPreference = "Stop"

# Utilidades comunes
. (Join-Path $PSScriptRoot "..\lib\common.ps1")
$ROOT = Get-ProjectRoot -StartPath $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Arconte - Daily Health Check" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Servicios
Write-Host "Verificando servicios..." -ForegroundColor Yellow

# PostgreSQL (Docker)
try {
  $dockerPs = docker ps 2>$null | Select-String "arconte"
  if ($dockerPs) { Write-Host "✔ PostgreSQL (Docker) corriendo" -ForegroundColor Green }
  else { throw "PostgreSQL NO está corriendo" }
} catch {
  Write-Host "✖ PostgreSQL NO está corriendo" -ForegroundColor Red
  Write-Host "   Ejecuta: docker start arconte_postgres" -ForegroundColor Yellow
  exit 1
}

# Laravel API
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health/external" -UseBasicParsing -ErrorAction SilentlyContinue
  if ($response.StatusCode -in @(200, 503)) { Write-Host "✔ Laravel API (8000) respondiendo" -ForegroundColor Green }
  else { throw "Status code: $($response.StatusCode)" }
} catch {
  Write-Host "✖ Laravel API NO responde en puerto 8000" -ForegroundColor Red
  Write-Host "   Ejecuta: php artisan serve" -ForegroundColor Yellow
  exit 1
}

# Ingest Python
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/healthz" -UseBasicParsing -ErrorAction SilentlyContinue
  if ($response.StatusCode -eq 200) { Write-Host "✔ Ingest Python (8001) respondiendo" -ForegroundColor Green }
  else { throw "Status code: $($response.StatusCode)" }
} catch {
  Write-Host "✖ Ingest Python NO responde en puerto 8001" -ForegroundColor Red
  Write-Host "   Ejecuta: python apps/ingest_py/run_persistent.py" -ForegroundColor Yellow
  exit 1
}

# Queue Worker
$queueCount = (Get-Process -Name php -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*queue:work*" }).Count
if ($queueCount -gt 0) { Write-Host "✔ Queue Worker activo ($queueCount proceso(s))" -ForegroundColor Green }
else { Write-Host "⚠ Queue Worker NO está corriendo" -ForegroundColor Yellow; Write-Host "   Ejecuta: php artisan queue:work --tries=3 --timeout=120" -ForegroundColor Yellow }

Write-Host ""

# 2. Autenticación
Write-Host "Verificando autenticación..." -ForegroundColor Yellow

# CSRF Cookie
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/sanctum/csrf-cookie" -UseBasicParsing -ErrorAction Stop
  if ($response.StatusCode -eq 204) { Write-Host "✔ CSRF cookie endpoint OK (204)" -ForegroundColor Green }
} catch {
  Write-Host "✖ CSRF cookie endpoint falló" -ForegroundColor Red
  exit 1
}

# /auth/me headers (no-cache)
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/auth/me" -Method HEAD -UseBasicParsing -ErrorAction SilentlyContinue
  $cacheControl = $response.Headers["Cache-Control"]
  if ($cacheControl -like "*no-store*") { Write-Host "✔ /auth/me tiene headers no-cache" -ForegroundColor Green }
  else {
    Write-Host "✖ /auth/me NO tiene headers no-cache" -ForegroundColor Red
    Write-Host "   Verifica AuthController@me" -ForegroundColor Yellow
    exit 1
  }
} catch {
  if ($_.Exception.Response.StatusCode.Value__ -eq 401) { Write-Host "✔ /auth/me retorna 401 sin sesión (headers no verificados)" -ForegroundColor Green }
}

Write-Host ""

# 3. Frontend
Write-Host "Verificando frontend..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction Stop
  if ($response.StatusCode -eq 200) { Write-Host "✔ Frontend (3000) respondiendo" -ForegroundColor Green }
} catch {
  Write-Host "✖ Frontend NO responde en puerto 3000" -ForegroundColor Red
  Write-Host "   Ejecuta: cd apps/web && npm run dev" -ForegroundColor Yellow
  exit 1
}

Write-Host ""

# 4. Configuración crítica
Write-Host "Verificando configuración..." -ForegroundColor Yellow
Push-Location (Join-Path $ROOT 'apps\api_php')
$envContent = Get-Content .env -Raw
$hasSessionDriver = $envContent -match "SESSION_DRIVER=database"
$hasSessionDomain = $envContent -match "SESSION_DOMAIN=localhost"
$hasSanctum = $envContent -match "SANCTUM_STATEFUL_DOMAINS=localhost:3000"
if ($hasSessionDriver -and $hasSessionDomain -and $hasSanctum) { Write-Host "✔ Variables de sesión en .env OK" -ForegroundColor Green }
else {
  Write-Host "✖ Variables de sesión en .env incorrectas" -ForegroundColor Red
  Write-Host "   Revisa SESSION_DRIVER, SESSION_DOMAIN, SANCTUM_STATEFUL_DOMAINS" -ForegroundColor Yellow
  Pop-Location; exit 1
}
Pop-Location

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✔ Todos los checks pasaron" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios corriendo:"
Write-Host "  - PostgreSQL: docker ps | grep arconte"
Write-Host "  - Laravel API: http://127.0.0.1:8000"
Write-Host "  - Ingest Python: http://127.0.0.1:8001"
Write-Host "  - Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Para ejecutar con tests E2E: .\\scripts\\maintenance\\daily-check.ps1 --with-e2e"

