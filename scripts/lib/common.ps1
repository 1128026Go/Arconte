Set-StrictMode -Version Latest

function Get-ProjectRoot {
    param(
        [Parameter(Mandatory=$false)]
        [string]$StartPath
    )
    if (-not $StartPath) { $StartPath = $PSScriptRoot }
    $dir = Get-Item -LiteralPath $StartPath
    while ($null -ne $dir) {
        $pkg = Join-Path $dir.FullName 'package.json'
        $apps = Join-Path $dir.FullName 'apps'
        $hasPkg = Test-Path -LiteralPath $pkg -PathType Leaf -ErrorAction SilentlyContinue
        $hasApps = Test-Path -LiteralPath $apps -PathType Container -ErrorAction SilentlyContinue
        if ($hasPkg -and $hasApps) { return $dir.FullName }
        $dir = $dir.Parent
    }
    # Fallback: scripts/.. as root
    return (Split-Path -Parent $StartPath)
}

# Nota: si se importa como módulo, se puede exportar manualmente.
