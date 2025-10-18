# scripts/stop_all.ps1 - Detiene todos los servicios de Arconte
Write-Host "=== DETENIENDO SERVICIOS ARCONTE ===" -ForegroundColor Yellow

$ports = @(3000, 5173, 8000, 8001)
$stoppedAny = $false

foreach ($port in $ports) {
    $processes = netstat -ano | findstr ":$port"
    if ($processes) {
        $processIds = ($processes | ForEach-Object { ($_ -split '\s+')[-1] }) | Sort-Object -Unique
        foreach ($processId in $processIds) {
            if ($processId -match '^\d+$') {
                try {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "✓ Detenido proceso en puerto $port (PID: $processId)" -ForegroundColor Green
                    $stoppedAny = $true
                } catch {
                    Write-Host "⚠ No se pudo detener PID $processId en puerto $port" -ForegroundColor Yellow
                }
            }
        }
    }
}

if (-not $stoppedAny) {
    Write-Host "ℹ No había servicios ejecutándose" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "=== TODOS LOS SERVICIOS DETENIDOS ===" -ForegroundColor Green
}

Write-Host ""
Write-Host "Para iniciar de nuevo: npm run dev" -ForegroundColor White