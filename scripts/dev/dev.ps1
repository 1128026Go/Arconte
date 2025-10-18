# Arconte - Script de Desarrollo
param([switch]$StopAll, [switch]$Clean)

# Cargar utilidades comunes
. (Join-Path $PSScriptRoot "..\lib\common.ps1")

$ROOT = Get-ProjectRoot -StartPath $PSScriptRoot
$WEB_PATH = Join-Path $ROOT 'apps\web'

Write-Host "=== ARCONTE DESARROLLO ===" -ForegroundColor Cyan

if ($StopAll) {
    Write-Host "Deteniendo servicios..." -ForegroundColor Yellow
    $ports = @(3000, 5173, 8000, 8001)
    foreach ($port in $ports) {
        $procs = netstat -ano | findstr ":$port"
        if ($procs) {
            $pids = ($procs | ForEach-Object { ($_ -split '\s+')[-1] }) | Sort-Object -Unique
            foreach ($pid in $pids) {
                if ($pid -match '^\d+$') {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "Detenido proceso en puerto $port" -ForegroundColor Green
                }
            }
        }
    }
    Write-Host "SERVICIOS DETENIDOS" -ForegroundColor Green
    exit
}

if ($Clean) {
    Write-Host "Limpiando..." -ForegroundColor Yellow
    $ports = @(3000, 5173, 8000, 8001)
    foreach ($port in $ports) {
        $procs = netstat -ano | findstr ":$port"
        if ($procs) {
            $pids = ($procs | ForEach-Object { ($_ -split '\s+')[-1] }) | Sort-Object -Unique
            foreach ($pid in $pids) {
                if ($pid -match '^\d+$') {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    Start-Sleep 2
}

Write-Host "Verificando Laravel..." -ForegroundColor Cyan
try {
    $laravel = Invoke-WebRequest -Uri "http://public.test" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($laravel.StatusCode -eq 200) {
        Write-Host "Laravel OK: http://public.test" -ForegroundColor Green
    }
} catch {
    Write-Host "Laravel: Verificar Herd" -ForegroundColor Yellow
}

Write-Host "Iniciando Frontend..." -ForegroundColor Cyan
Set-Location $WEB_PATH

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install --silent
}

Write-Host "Iniciando dev server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WEB_PATH'; npm run dev"

Set-Location $ROOT
Start-Sleep 3

Write-Host ""
Write-Host "SERVICIOS INICIADOS:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Laravel: http://public.test/api" -ForegroundColor White
Write-Host ""
Write-Host "Para detener: npm run stop" -ForegroundColor Cyan
