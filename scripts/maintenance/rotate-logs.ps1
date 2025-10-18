# Log Rotation - Laravel logs (Windows PowerShell)
# Ejecutar diariamente con Task Scheduler: 3:00 AM

# ========================================
# Configuración
# ========================================
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$LOG_DIR = "$PROJECT_ROOT\apps\api_php\storage\logs"

# Retención de logs (días)
$RETENTION_DAYS = if ($env:LOG_RETENTION_DAYS) { [int]$env:LOG_RETENTION_DAYS } else { 30 }

# Archivos de log a rotar
$LARAVEL_LOG = "$LOG_DIR\laravel.log"
$ROTATED_PREFIX = "laravel"

# ========================================
# Verificar directorio de logs
# ========================================
if (-not (Test-Path $LOG_DIR)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "$timestamp : ❌ Directorio de logs no existe: $LOG_DIR"
    exit 1
}

# ========================================
# Rotar log de Laravel
# ========================================
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Iniciando rotación de logs..."

if (Test-Path $LARAVEL_LOG) {
    $LogFile = Get-Item $LARAVEL_LOG
    $LOG_SIZE_MB = [math]::Round($LogFile.Length / 1MB, 2)
    $LOG_LINES = (Get-Content $LARAVEL_LOG | Measure-Object -Line).Lines

    Write-Host "$timestamp : Laravel log actual: $LOG_SIZE_MB MB ($LOG_LINES líneas)"

    # Solo rotar si el log tiene contenido significativo (>1MB o >10000 líneas)
    if ($LogFile.Length -gt 1048576 -or $LOG_LINES -gt 10000) {
        # Generar nombre con timestamp
        $DATE = Get-Date -Format "yyyyMMdd_HHmmss"
        $ROTATED_FILE = "$LOG_DIR\${ROTATED_PREFIX}_${DATE}.log"

        # Copiar log actual a archivo rotado
        Copy-Item $LARAVEL_LOG -Destination $ROTATED_FILE

        # Comprimir log rotado
        if (Get-Command "7z.exe" -ErrorAction SilentlyContinue) {
            & 7z a -tgzip "$ROTATED_FILE.gz" $ROTATED_FILE
            Remove-Item $ROTATED_FILE
        } else {
            Compress-Archive -Path $ROTATED_FILE -DestinationPath "$ROTATED_FILE.zip"
            Remove-Item $ROTATED_FILE
        }

        # Truncar log actual (no borrar, para mantener permisos)
        Clear-Content $LARAVEL_LOG

        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "$timestamp : ✅ Log rotado: ${ROTATED_PREFIX}_${DATE}.log.gz"
    } else {
        Write-Host "$timestamp : Log pequeño, no se rota ($LOG_SIZE_MB MB)"
    }
} else {
    Write-Host "$timestamp : No existe $LARAVEL_LOG"
}

# ========================================
# Limpiar logs antiguos
# ========================================
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Limpiando logs antiguos (>$RETENTION_DAYS días)..."

# Borrar logs rotados antiguos (comprimidos y sin comprimir)
$CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)

Get-ChildItem -Path $LOG_DIR -Filter "${ROTATED_PREFIX}_*.log.gz" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $CutoffDate } |
    Remove-Item -Force

Get-ChildItem -Path $LOG_DIR -Filter "${ROTATED_PREFIX}_*.log.zip" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $CutoffDate } |
    Remove-Item -Force

Get-ChildItem -Path $LOG_DIR -Filter "${ROTATED_PREFIX}_*.log" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $CutoffDate } |
    Remove-Item -Force

$REMAINING_LOGS = (Get-ChildItem -Path $LOG_DIR -Filter "${ROTATED_PREFIX}_*" -ErrorAction SilentlyContinue).Count
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Logs rotados restantes: $REMAINING_LOGS"

# ========================================
# Rotar logs de Ingest Service (Python)
# ========================================
$INGEST_LOG_DIR = "$PROJECT_ROOT\apps\ingest_py\logs"

if (Test-Path $INGEST_LOG_DIR) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "$timestamp : Rotando logs de Ingest Service..."

    Get-ChildItem -Path $INGEST_LOG_DIR -Filter "*.log" | ForEach-Object {
        $LogFile = $_
        $LOG_NAME = $LogFile.BaseName
        $LOG_SIZE = $LogFile.Length

        if ($LOG_SIZE -gt 1048576) {
            $DATE = Get-Date -Format "yyyyMMdd_HHmmss"
            $ROTATED_FILE = "$INGEST_LOG_DIR\${LOG_NAME}_${DATE}.log"

            Move-Item $LogFile.FullName -Destination $ROTATED_FILE

            # Comprimir
            if (Get-Command "7z.exe" -ErrorAction SilentlyContinue) {
                & 7z a -tgzip "$ROTATED_FILE.gz" $ROTATED_FILE
                Remove-Item $ROTATED_FILE
            } else {
                Compress-Archive -Path $ROTATED_FILE -DestinationPath "$ROTATED_FILE.zip"
                Remove-Item $ROTATED_FILE
            }

            # Crear nuevo log vacío
            New-Item -ItemType File -Path $LogFile.FullName | Out-Null

            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "$timestamp : ✅ Ingest log rotado: ${LOG_NAME}_${DATE}.log.gz"
        }
    }

    # Limpiar logs antiguos de Ingest
    Get-ChildItem -Path $INGEST_LOG_DIR -Filter "*.log.gz" -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt $CutoffDate } |
        Remove-Item -Force

    Get-ChildItem -Path $INGEST_LOG_DIR -Filter "*.log.zip" -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt $CutoffDate } |
        Remove-Item -Force
}

# ========================================
# Resumen
# ========================================
$TOTAL_LOG_SIZE = (Get-ChildItem -Path $LOG_DIR -Recurse -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum / 1MB

$TOTAL_LOG_SIZE_STR = "{0:N2} MB" -f $TOTAL_LOG_SIZE

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Tamaño total de logs: $TOTAL_LOG_SIZE_STR"
Write-Host "$timestamp : Rotación de logs completada"

exit 0
