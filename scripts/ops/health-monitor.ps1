#!/usr/bin/env pwsh
# Health Monitor - Arconte (Windows PowerShell)
# Ejecutar cada 5 minutos con Task Scheduler

# Configuración común
. (Join-Path $PSScriptRoot "..\lib\common.ps1")
$ROOT = Get-ProjectRoot -StartPath $PSScriptRoot

$API_URL = if ($env:ARCONTE_API_URL) { $env:ARCONTE_API_URL } else { "http://127.0.0.1:8000" }
$INGEST_URL = if ($env:ARCONTE_INGEST_URL) { $env:ARCONTE_INGEST_URL } else { "http://127.0.0.1:8001" }
$SLACK_WEBHOOK = $env:SLACK_WEBHOOK_URL

# Archivos de estado
$STATE_DIR = Join-Path $env:TEMP 'arconte-health'
if (-not (Test-Path $STATE_DIR)) { New-Item -ItemType Directory -Path $STATE_DIR | Out-Null }
$API_STATE = Join-Path $STATE_DIR 'api_down.txt'
$INGEST_STATE = Join-Path $STATE_DIR 'ingest_down.txt'
$BREAKER_STATE = Join-Path $STATE_DIR 'breaker_open.txt'
$LOG_FILE = Join-Path $STATE_DIR 'health.log'

function Send-SlackAlert {
  param([string]$Message)
  if ($SLACK_WEBHOOK) {
    $body = @{ text = "[Arconte Alert] $Message" } | ConvertTo-Json
    try { Invoke-RestMethod -Uri $SLACK_WEBHOOK -Method Post -Body $body -ContentType 'application/json' | Out-Null } catch {}
  }
}

function Write-Log { param([string]$Message)
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -Path $LOG_FILE -Value "$timestamp : $Message"
}

function Check-API {
  try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/health/external" -UseBasicParsing -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
    if ($statusCode -notin @(200, 503)) { throw "HTTP $statusCode" }

    if (Test-Path $API_STATE) { Send-SlackAlert '✔ Laravel API recuperada'; Remove-Item $API_STATE; Write-Log 'API UP' }

    $body = $response.Content | ConvertFrom-Json
    if ($body.db_ok -eq $false) { Send-SlackAlert '⚠ PostgreSQL no responde correctamente' }
    if ($body.queue_ok -eq $false) { Send-SlackAlert '⚠ Queue no está operativa' }
    return $true
  } catch {
    if (-not (Test-Path $API_STATE)) { Send-SlackAlert 'Laravel API no responde'; New-Item -ItemType File -Path $API_STATE | Out-Null; Write-Log 'API DOWN' }
    return $false
  }
}

function Check-Ingest {
  try {
    $response = Invoke-WebRequest -Uri "$INGEST_URL/healthz" -UseBasicParsing -ErrorAction Stop
    if (Test-Path $INGEST_STATE) { Send-SlackAlert '✔ Ingest Service recuperado'; Remove-Item $INGEST_STATE; Write-Log 'INGEST UP' }
    return $true
  } catch {
    if (-not (Test-Path $INGEST_STATE)) { Send-SlackAlert 'Ingest Service no responde'; New-Item -ItemType File -Path $INGEST_STATE | Out-Null; Write-Log 'INGEST DOWN' }
    return $false
  }
}

function Check-CircuitBreaker {
  try {
    $response = Invoke-WebRequest -Uri "$INGEST_URL/metrics" -UseBasicParsing -ErrorAction Stop
    $metrics = $response.Content | ConvertFrom-Json
    if ($metrics.breaker_open -eq $true) {
      if (-not (Test-Path $BREAKER_STATE)) { Send-SlackAlert '⚠ Circuit Breaker ABIERTO - Rama Judicial no disponible'; New-Item -ItemType File -Path $BREAKER_STATE | Out-Null; Write-Log 'BREAKER OPEN' }
    } else {
      if (Test-Path $BREAKER_STATE) { Send-SlackAlert '✔ Circuit Breaker cerrado - Rama Judicial recuperada'; Remove-Item $BREAKER_STATE; Write-Log 'BREAKER CLOSED' }
    }
  } catch {}
}

Write-Log 'Health check iniciado'
$apiStatus = Check-API
$ingestStatus = Check-Ingest
Check-CircuitBreaker

if ($apiStatus -and $ingestStatus) { Write-Log '✔ All systems OK'; exit 0 } else { Write-Log '✖ Some systems DOWN'; exit 1 }

