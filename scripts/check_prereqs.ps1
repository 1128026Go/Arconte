# Comprobar prerequisitos (PowerShell)
# Ejecuta desde la raíz del proyecto: .\scripts\check_prereqs.ps1

function Check-Cmd($label, $cmdStr){
    Write-Host "---- $label ----" -ForegroundColor Cyan

    # Separar el ejecutable y sus argumentos
    $parts = $cmdStr -split ' '
    $exe = $parts[0]
    $args = @()
    if ($parts.Count -gt 1) { $args = $parts[1..($parts.Count - 1)] }

    $cmd = Get-Command $exe -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
        try {
            & $exe @args 2>&1 | ForEach-Object { Write-Host $_ }
        } catch {
            Write-Host ("Error al ejecutar {0}: {1}" -f $cmdStr, $_.Exception.Message) -ForegroundColor Yellow
        }
    } else {
        Write-Host "$exe no encontrado en PATH" -ForegroundColor Red
    }
    Write-Host ""
}

# Algunos comandos tienen nombres distintos en Windows (py)
Check-Cmd "Python (python)" "python --version"
Check-Cmd "Python launcher (py -3)" "py -3 --version"
Check-Cmd "Node" "node -v"
Check-Cmd "npm" "npm -v"
Check-Cmd "PHP" "php -v"
Check-Cmd "Composer" "composer --version"
Check-Cmd "Git" "git --version"

Write-Host "Comprueba también si tienes permisos para ejecutar scripts (Set-ExecutionPolicy)." -ForegroundColor Green
Write-Host "Si algún comando falta, instala la herramienta indicada antes de continuar." -ForegroundColor Green
