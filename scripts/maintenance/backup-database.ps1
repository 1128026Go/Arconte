#!/usr/bin/env pwsh
# Database Backup - PostgreSQL (Windows PowerShell)
# Ejecutar diariamente con Task Scheduler: 2:00 AM

# ========================================
# Configuración
# ========================================
# Cargar utilidades comunes
. (Join-Path $PSScriptRoot "..\lib\common.ps1")
$PROJECT_ROOT = Get-ProjectRoot -StartPath $PSScriptRoot

# Leer configuración desde .env
$ENV_FILE = "$PROJECT_ROOT\apps\api_php\.env"
if (Test-Path $ENV_FILE) {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Variables de backup
$BACKUP_DIR = if ($env:BACKUP_PATH) { $env:BACKUP_PATH } else { "$PROJECT_ROOT\backups" }
$RETENTION_DAYS = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 }
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "arconte_backup_$DATE.sql.gz"

# Credenciales de PostgreSQL
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_DATABASE) { $env:DB_DATABASE } else { "arconte" }
$DB_USER = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "arconte" }
$DB_PASSWORD = $env:DB_PASSWORD

# ========================================
# Crear directorio de backups
# ========================================
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# ========================================
# Realizar backup
# ========================================
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Iniciando backup de base de datos..."

# Configurar PGPASSWORD
$env:PGPASSWORD = $DB_PASSWORD

# Buscar pg_dump (puede estar en Docker o PostgreSQL instalado localmente)
$PG_DUMP = $null

# Opción 1: PostgreSQL instalado localmente
$LocalPgDump = "C:\\Program Files\\PostgreSQL\\*\\bin\\pg_dump.exe"
if (Test-Path $LocalPgDump) {
    $PG_DUMP = (Get-Item $LocalPgDump | Select-Object -First 1).FullName
}

# Opción 2: Usar Docker exec si no hay pg_dump local
if (-not $PG_DUMP) {
    Write-Host "pg_dump no encontrado localmente, usando Docker..."
    $BACKUP_PATH_FULL = "$BACKUP_DIR\$BACKUP_FILE"

    docker exec arconte_postgres pg_dump -h localhost -p 5432 -U $DB_USER -d $DB_NAME `
        --format=plain --no-owner --no-acl | Out-File -Encoding UTF8 "$BACKUP_DIR\arconte_backup_$DATE.sql"

    if (Get-Command "7z.exe" -ErrorAction SilentlyContinue) {
        & 7z a -tgzip "$BACKUP_DIR\$BACKUP_FILE" "$BACKUP_DIR\arconte_backup_$DATE.sql"
        Remove-Item "$BACKUP_DIR\arconte_backup_$DATE.sql"
    } else {
        Compress-Archive -Path "$BACKUP_DIR\arconte_backup_$DATE.sql" -DestinationPath "$BACKUP_DIR\arconte_backup_$DATE.zip"
        Remove-Item "$BACKUP_DIR\arconte_backup_$DATE.sql"
        $BACKUP_FILE = "arconte_backup_$DATE.zip"
    }
} else {
    # Usar pg_dump local
    & $PG_DUMP -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME `
        --format=plain --no-owner --no-acl | Out-File -Encoding UTF8 "$BACKUP_DIR\arconte_backup_$DATE.sql"

    if (Get-Command "7z.exe" -ErrorAction SilentlyContinue) {
        & 7z a -tgzip "$BACKUP_DIR\$BACKUP_FILE" "$BACKUP_DIR\arconte_backup_$DATE.sql"
        Remove-Item "$BACKUP_DIR\arconte_backup_$DATE.sql"
    } else {
        Compress-Archive -Path "$BACKUP_DIR\arconte_backup_$DATE.sql" -DestinationPath "$BACKUP_DIR\arconte_backup_$DATE.zip"
        Remove-Item "$BACKUP_DIR\arconte_backup_$DATE.sql"
        $BACKUP_FILE = "arconte_backup_$DATE.zip"
    }
}

# Limpiar password
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# ========================================
# Verificar resultado
# ========================================
$BACKUP_PATH_FULL = "$BACKUP_DIR\$BACKUP_FILE"
if (Test-Path $BACKUP_PATH_FULL) {
    $BACKUP_SIZE = (Get-Item $BACKUP_PATH_FULL).Length / 1MB
    $BACKUP_SIZE_STR = "{0:N2} MB" -f $BACKUP_SIZE
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "$timestamp : ✔ Backup completado: $BACKUP_FILE ($BACKUP_SIZE_STR)"

    Add-Content -Path "$BACKUP_DIR\backup.log" -Value "$timestamp : Backup exitoso - $BACKUP_FILE ($BACKUP_SIZE_STR)"
} else {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "$timestamp : ✖ Error en backup"
    Add-Content -Path "$BACKUP_DIR\backup.log" -Value "$timestamp : Error en backup"
    exit 1
}

# ========================================
# Limpiar backups antiguos
# ========================================
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Limpiando backups antiguos (>$RETENTION_DAYS días)..."

$CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
Get-ChildItem -Path $BACKUP_DIR -Filter "arconte_backup_*" |
    Where-Object { $_.LastWriteTime -lt $CutoffDate } |
    Remove-Item -Force

$REMAINING_BACKUPS = (Get-ChildItem -Path $BACKUP_DIR -Filter "arconte_backup_*").Count
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Backups restantes: $REMAINING_BACKUPS"

# ========================================
# Notificación opcional
# ========================================
if ($env:SLACK_WEBHOOK_URL -and -not (Test-Path $BACKUP_PATH_FULL)) {
    $body = @{ text = "✖ Arconte Backup Failed: $BACKUP_FILE" } | ConvertTo-Json
    try { Invoke-RestMethod -Uri $env:SLACK_WEBHOOK_URL -Method Post -Body $body -ContentType "application/json" | Out-Null } catch {}
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "$timestamp : Backup process completado"
exit 0

