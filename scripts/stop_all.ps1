# Detiene procesos en puertos conocidos
$ports = @(3000, 8000, 8001)
Write-Host "=== DETENIENDO SERVICIOS ===" -ForegroundColor Yellow

foreach ($port in $ports) {
    $processes = netstat -ano | findstr ":$port"
    if ($processes) {
        $processIds = ($processes | ForEach-Object { ($_ -split '\s+')[-1] }) | Sort-Object -Unique
        foreach ($processId in $processIds) {
            if ($processId -match '^\d+$') {
                try {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "Detenido proceso en puerto $port (PID: $processId)" -ForegroundColor Cyan
                } catch {
                    Write-Host "No se pudo detener PID $processId" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "Puerto $port ya libre" -ForegroundColor Green
    }
}

Write-Host "=== SERVICIOS DETENIDOS ===" -ForegroundColor Green