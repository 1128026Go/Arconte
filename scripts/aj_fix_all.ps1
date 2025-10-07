$ErrorActionPreference = "Stop"
$Root = "C:\Users\User\Herd\Aplicacion Juridica"
$Api  = "$Root\apps\api_php"
$Web  = "$Root\apps\web"

# Hash antes
function Hash-IfExists($p){ if(Test-Path $p){ (Get-FileHash $p -Algorithm SHA256).Hash } else { "" } }
$hEnvBefore   = Hash-IfExists (Join-Path $Api ".env")
$hCorsBefore  = Hash-IfExists (Join-Path $Api "config\cors.php")
$hSqliteBefore= Hash-IfExists (Join-Path $Api "database\database.sqlite")
$changed = $false

# .env
cd $Api
if (-not (Test-Path ".env") -and (Test-Path ".env.example")) { Copy-Item .env.example .env -Force }
if (Test-Path ".env") {
  ((Get-Content .env) `
    -replace '^APP_URL=.*','APP_URL=https://api-juridica.test' `
    -replace '^DB_CONNECTION=.*','DB_CONNECTION=sqlite' `
    -replace '^DB_DATABASE=.*','DB_DATABASE=database/database.sqlite' `
    -replace '^INGEST_BASE_URL=.*','INGEST_BASE_URL=http://localhost:8000') | Set-Content .env
}
New-Item -Type Directory -Path ".\database" -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType File -Path ".\database\database.sqlite" -Force | Out-Null
php artisan key:generate | Out-Null
php artisan config:clear | Out-Null

# cors.php
if (-not (Test-Path ".\config\cors.php")) {
@'
<?php
return [
    "paths" => ["api/*", "sanctum/csrf-cookie"],
    "allowed_methods" => ["*"],
    "allowed_origins" => ["https://api-juridica.test","http://localhost:3000","http://localhost:3001"],
    "allowed_origins_patterns" => [],
    "allowed_headers" => ["*"],
    "exposed_headers" => [],
    "max_age" => 0,
    "supports_credentials" => false,
];
'@ | Set-Content .\config\cors.php -Encoding UTF8
}
composer require laravel/sanctum guzzlehttp/guzzle | Out-Null
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force | Out-Null
php artisan migrate | Out-Null
php artisan route:clear | Out-Null

# Hash después
$hEnvAfter    = Hash-IfExists (Join-Path $Api ".env")
$hCorsAfter   = Hash-IfExists (Join-Path $Api "config\cors.php")
$hSqliteAfter = Hash-IfExists (Join-Path $Api "database\database.sqlite")

if ($hEnvBefore -ne $hEnvAfter -or $hCorsBefore -ne $hCorsAfter -or $hSqliteBefore -ne $hSqliteAfter) {
  $changed = $true
}

# Frontend .env.local
cd $Web
@'
VITE_API_URL=https://api-juridica.test/api
'@ | Set-Content .\.env.local -Encoding UTF8
npm install | Out-Null

# Verificaciones
$apiResp  = cmd /c 'curl.exe -s -o NUL -w "%{http_code}" https://api-juridica.test/api'
$fastResp = cmd /c 'curl.exe -s -o NUL -w "%{http_code}" http://localhost:8000/healthz'
cd $Api
$routes = php artisan route:list | Select-Object -First 12

# Backup si hubo cambios
if ($changed) {
  & "$Root\scripts\aj_backup.ps1" -Root $Root -Api $Api -Dest "$Root\backups"
}

Write-Host "HTTP api-juridica.test/api:" $apiResp
Write-Host "HTTP FastAPI /healthz:" $fastResp
$routes