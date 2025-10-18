#!/usr/bin/env pwsh
# scripts/dev/setup.ps1 - Configuración inicial del proyecto Arconte
param(
    [switch]$SkipHerd,
    [switch]$SkipFrontend,
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"

# Cargar utilidades comunes
. (Join-Path $PSScriptRoot "..\lib\common.ps1")

$ROOT = Get-ProjectRoot -StartPath $PSScriptRoot
$API_PATH = Join-Path $ROOT 'apps\api_php'
$WEB_PATH = Join-Path $ROOT 'apps\web'

Write-Host "=== CONFIGURACIÓN INICIAL - ARCONTE ===" -ForegroundColor Cyan
Write-Host "Directorio del proyecto: $ROOT" -ForegroundColor Gray

# === FUNCIÓN: VERIFICAR PRERREQUISITOS ===
function Test-Prerequisites {
    Write-Host "Verificando prerrequisitos..." -ForegroundColor Yellow

    $requirements = @{
        "Node.js" = "node --version"
        "NPM" = "npm --version"
        "PHP" = "php --version"
        "Composer" = "composer --version"
    }

    $allOk = $true
    foreach ($req in $requirements.GetEnumerator()) {
        try {
            $version = Invoke-Expression $req.Value 2>$null
            if ($version) {
                $versionStr = if ($version -is [array]) { $version[0] } else { $version }
                Write-Host "  ✔ $($req.Key): $versionStr" -ForegroundColor Green
            } else {
                Write-Host "  ✖ $($req.Key): No encontrado" -ForegroundColor Red
                $allOk = $false
            }
        } catch {
            Write-Host "  ✖ $($req.Key): No encontrado" -ForegroundColor Red
            $allOk = $false
        }
    }

    if (-not $allOk) {
        Write-Host "`nInstala los prerrequisitos faltantes antes de continuar." -ForegroundColor Red
        exit 1
    }
}

# === FUNCIÓN: CONFIGURAR HERD ===
function Setup-Herd {
    if ($SkipHerd) {
        Write-Host "Omitiendo verificación de Herd..." -ForegroundColor Yellow
        return
    }

    Write-Host "Configurando Laravel con Herd..." -ForegroundColor Yellow

    $herdProcess = Get-Process -Name "herd" -ErrorAction SilentlyContinue
    if (-not $herdProcess) {
        Write-Host "  ⚠ Herd no está ejecutándose" -ForegroundColor Yellow
        Write-Host "    Inicia Herd manualmente e intenta de nuevo" -ForegroundColor White
        return
    }

    try {
        $response = Invoke-WebRequest -Uri "http://public.test" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✔ Laravel funcionando en http://public.test" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠ Laravel no responde en http://public.test" -ForegroundColor Yellow
        Write-Host "    Configura el sitio 'public.test' en Herd apuntando a apps/api_php/public" -ForegroundColor White
    }
}

# === FUNCIÓN: CONFIGURAR BACKEND ===
function Setup-Backend {
    Write-Host "Configurando Backend (Laravel)..." -ForegroundColor Yellow

    Push-Location $API_PATH

    if ($Force -or -not (Test-Path "vendor")) {
        Write-Host "  Instalando dependencias de Composer..." -ForegroundColor Cyan
        composer install --no-dev --optimize-autoloader --quiet
    } else {
        Write-Host "  ✔ Dependencias de Composer ya instaladas" -ForegroundColor Green
    }

    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Write-Host "  Creando archivo .env desde .env.example..." -ForegroundColor Cyan
            Copy-Item ".env.example" ".env"
        } else {
            Write-Host "  ⚠ No se encontró .env.example" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✔ Archivo .env existe" -ForegroundColor Green
    }

    try {
        $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
        $hasKey = $envContent | Where-Object { $_ -match "APP_KEY=.+" }
        if (-not $hasKey) {
            Write-Host "  Generando clave de aplicación..." -ForegroundColor Cyan
            php artisan key:generate --force --quiet
        } else {
            Write-Host "  ✔ Clave de aplicación configurada" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠ No se pudo verificar/generar la clave de aplicación" -ForegroundColor Yellow
    }

    try {
        Write-Host "  Ejecutando migraciones..." -ForegroundColor Cyan
        php artisan migrate --force --quiet
        Write-Host "  ✔ Migraciones completadas" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Error en migraciones (normal en primera ejecución)" -ForegroundColor Yellow
    }

    Pop-Location
}

# === FUNCIÓN: CONFIGURAR FRONTEND ===
function Setup-Frontend {
    if ($SkipFrontend) {
        Write-Host "Omitiendo configuración de frontend..." -ForegroundColor Yellow
        return
    }

    Write-Host "Configurando Frontend (React)..." -ForegroundColor Yellow

    Push-Location $WEB_PATH

    if ($Force -or -not (Test-Path "node_modules")) {
        Write-Host "  Instalando dependencias de NPM..." -ForegroundColor Cyan
        npm install --silent
    } else {
        Write-Host "  ✔ Dependencias de NPM ya instaladas" -ForegroundColor Green
    }

    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Write-Host "  Creando archivo .env desde .env.example..." -ForegroundColor Cyan
            Copy-Item ".env.example" ".env"
        }
    } else {
        Write-Host "  ✔ Archivo .env existe" -ForegroundColor Green
    }

    Pop-Location
}

# === FUNCIÓN: PRUEBA RÁPIDA ===
function Test-Setup {
    Write-Host "Ejecutando prueba rápida..." -ForegroundColor Yellow

    Push-Location $WEB_PATH
    try {
        Write-Host "  Probando build del frontend..." -ForegroundColor Cyan
        npm run build --silent 2>$null
        Write-Host "  ✔ Frontend se construye correctamente" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Error en build del frontend" -ForegroundColor Yellow
    }
    Pop-Location
}

# === EJECUCIÓN PRINCIPAL ===
Test-Prerequisites
Setup-Herd
Setup-Backend
Setup-Frontend
Test-Setup

Write-Host "" 
Write-Host "=== CONFIGURACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "" 
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Configura las variables de entorno en apps/api_php/.env" -ForegroundColor White
Write-Host "  2. Asegúrate de que Herd esté configurado para public.test" -ForegroundColor White
Write-Host "  3. Ejecuta: npm run dev para iniciar desarrollo" -ForegroundColor White
Write-Host "" 
Write-Host "Comandos útiles:" -ForegroundColor Cyan
Write-Host "  npm run dev             # Iniciar desarrollo" -ForegroundColor White
Write-Host "  npm run stop            # Detener servicios" -ForegroundColor White
Write-Host "  npm run clean           # Limpiar proyecto" -ForegroundColor White
Write-Host "  npm run setup           # Reconfigurar" -ForegroundColor White

