#!/usr/bin/env pwsh
# scripts/maintenance/cleanup.ps1 - Limpieza del proyecto Arconte
param(
    [switch]$Deep,
    [switch]$DryRun
)

$ErrorActionPreference = "SilentlyContinue"

# Cargar utilidades comunes
. (Join-Path $PSScriptRoot "..\lib\common.ps1")

$ROOT = Get-ProjectRoot -StartPath $PSScriptRoot
Write-Host "=== LIMPIEZA DEL PROYECTO ARCONTE ===" -ForegroundColor Cyan

$cleanupItems = @{
    "Cache Python" = @("**/__pycache__", "**/*.pyc", "**/*.pyo")
    "Cache Node" = @("**/node_modules/.cache", "**/.npm")
    "Archivos temporales" = @("**/*.tmp", "**/*.temp", "**/.DS_Store", "**/Thumbs.db")
    "Logs de debug" = @("**/debug.log", "**/error.log", "**/*.log")
    "Build artifacts" = @("**/dist", "**/build")
}

if ($Deep) {
    $cleanupItems["Node modules"] = @("**/node_modules")
    $cleanupItems["Virtual envs"] = @("**/.venv", "**/venv")
}

function Remove-ProjectFiles {
    param($patterns, $category)
    Write-Host "Limpiando: $category" -ForegroundColor Yellow
    $found = $false

    foreach ($pattern in $patterns) {
        $items = Get-ChildItem -Path $ROOT -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
            $_.FullName -like "*$($pattern.Replace('**/', '').Replace('*', '*'))*"
        }
        foreach ($item in $items) {
            $found = $true
            $relativePath = $item.FullName.Replace($ROOT, "").TrimStart('\\')
            if ($DryRun) {
                Write-Host "  [DRY] $relativePath" -ForegroundColor Gray
            } else {
                try {
                    if ($item.PSIsContainer) {
                        Remove-Item $item.FullName -Recurse -Force
                    } else {
                        Remove-Item $item.FullName -Force
                    }
                    Write-Host "  ✔ $relativePath" -ForegroundColor Green
                } catch {
                    Write-Host "  ✖ $relativePath (Error: $($_.Exception.Message))" -ForegroundColor Red
                }
            }
        }
    }

    if (-not $found) { Write-Host "  (Nada que limpiar)" -ForegroundColor Gray }
}

if ($DryRun) {
    Write-Host "MODO DRY RUN - No se eliminará nada" -ForegroundColor Yellow
    Write-Host ""
}

foreach ($category in $cleanupItems.GetEnumerator()) {
    Remove-ProjectFiles -patterns $category.Value -category $category.Key
}

Write-Host "Limpieza específica Arconte..." -ForegroundColor Yellow

$arconteCleanup = @(
    "CLEANUP_REPORT.md",
    "temp/**",
    "backups/**",
    "*.bak",
    "test_*.js"
)

$found = $false
foreach ($pattern in $arconteCleanup) {
    $items = Get-ChildItem -Path $ROOT -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $pattern -or $_.FullName -like "*\$pattern"
    }
    foreach ($item in $items) {
        $found = $true
        $relativePath = $item.FullName.Replace($ROOT, "").TrimStart('\\')
        if ($DryRun) {
            Write-Host "  [DRY] $relativePath" -ForegroundColor Gray
        } else {
            try {
                if ($item.PSIsContainer) { Remove-Item $item.FullName -Recurse -Force } else { Remove-Item $item.FullName -Force }
                Write-Host "  ✔ $relativePath" -ForegroundColor Green
            } catch {
                Write-Host "  ✖ $relativePath" -ForegroundColor Red
            }
        }
    }
}

if (-not $found) { Write-Host "  (Nada que limpiar)" -ForegroundColor Gray }

Write-Host ""
if ($DryRun) {
    Write-Host "=== VISTA PREVIA COMPLETADA ===" -ForegroundColor Cyan
    Write-Host "Ejecuta sin -DryRun para realizar la limpieza" -ForegroundColor White
} else {
    Write-Host "=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
    if ($Deep) {
        Write-Host "Reinstala dependencias con:" -ForegroundColor Yellow
        Write-Host "  cd apps/web && npm install" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Opciones disponibles:" -ForegroundColor Cyan
Write-Host "  .\scripts\maintenance\cleanup.ps1                # Limpieza básica" -ForegroundColor White
Write-Host "  .\scripts\maintenance\cleanup.ps1 -Deep          # Limpieza profunda" -ForegroundColor White
Write-Host "  .\scripts\maintenance\cleanup.ps1 -DryRun        # Vista previa" -ForegroundColor White

