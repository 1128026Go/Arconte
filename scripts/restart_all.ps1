# Reinicia todos los servicios
Write-Host "=== REINICIANDO APLICACION JURIDICA ===" -ForegroundColor Yellow

# Detener servicios
& "$PSScriptRoot\stop_all.ps1"

Start-Sleep -Seconds 2

# Iniciar servicios
& "$PSScriptRoot\start_all_enhanced.ps1" -NoBuild

Write-Host "=== REINICIO COMPLETADO ===" -ForegroundColor Green