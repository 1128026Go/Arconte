param(
  [string]$Root = "C:\Users\User\Herd\Aplicacion Juridica",
  [string]$Api  = "$Root\apps\api_php",
  [string]$Dest = "$Root\backups"
)
$ts = (Get-Date -Format "yyyyMMdd-HHmmss")
$dir = Join-Path $Dest $ts
New-Item -Force -ItemType Directory -Path $dir | Out-Null

$items = @(
  Join-Path $Api ".env",
  Join-Path $Api "database\database.sqlite",
  Join-Path $Api "config\cors.php"
) | Where-Object { Test-Path $_ }

foreach($i in $items){
  Copy-Item $i $dir -Force
}

# ZIP
$zip = Join-Path $Dest ("backup-" + $ts + ".zip")
Compress-Archive -Path (Join-Path $dir "*") -DestinationPath $zip -Force | Out-Null

Write-Host "Backup creado:" $dir
Write-Host "ZIP:" $zip