# Script para verificar y configurar Laravel con Herd
Write-Host "=== CONFIGURANDO LARAVEL CON HERD ===" -ForegroundColor Cyan

# Verificar si Herd está ejecutándose
$herdProcess = Get-Process -Name "herd" -ErrorAction SilentlyContinue
if (-not $herdProcess) {
    Write-Host "WARN: Herd no está ejecutándose" -ForegroundColor Yellow
    Write-Host "ACCION: Iniciando Herd..." -ForegroundColor Cyan
    
    # Buscar Herd en rutas comunes
    $herdPaths = @(
        "$env:LOCALAPPDATA\herd\herd.exe",
        "$env:PROGRAMFILES\Herd\herd.exe",
        "$env:PROGRAMFILES(X86)\Herd\herd.exe"
    )
    
    $herdFound = $false
    foreach ($path in $herdPaths) {
        if (Test-Path $path) {
            Start-Process $path
            $herdFound = $true
            Write-Host "OK: Herd iniciado desde $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $herdFound) {
        Write-Host "ERROR: No se encontró Herd instalado" -ForegroundColor Red
        Write-Host "SOLUCION: Instala Herd desde https://herd.laravel.com" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Esperando a que Herd se inicie..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
}

# Verificar sitio api-juridica.test
Write-Host "Verificando sitio api-juridica.test..." -ForegroundColor Cyan

$maxAttempts = 10
$attempt = 0
$apiReady = $false

while ($attempt -lt $maxAttempts -and -not $apiReady) {
    try {
        $response = Invoke-WebRequest -Uri "https://api-juridica.test/api" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            Write-Host "OK: Laravel API funcionando en https://api-juridica.test/api" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "Intento $attempt/$maxAttempts - Esperando Laravel..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $apiReady) {
    Write-Host "ERROR: Laravel API no responde después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "VERIFICA:" -ForegroundColor Yellow
    Write-Host "  1. Herd está ejecutándose" -ForegroundColor White
    Write-Host "  2. El sitio api-juridica.test está configurado en Herd" -ForegroundColor White
    Write-Host "  3. La carpeta apps/api_php está vinculada" -ForegroundColor White
    exit 1
}

Write-Host "=== LARAVEL CONFIGURADO CORRECTAMENTE ===" -ForegroundColor Green