<#
PowerShell script: move_images_from_db.ps1
Purpose: Read product image filenames from the MySQL DB and copy existing image files
into `src/main/resources/static/images/<category-path>/` preserving subfolders.

Usage examples (PowerShell):
.
# Dry run (no file changes) - you'll be prompted for DB password if omitted
PS> .\scripts\move_images_from_db.ps1 -DbUser root -DbName stepup_shoes -DryRun

# Real run (will copy files)
PS> .\scripts\move_images_from_db.ps1 -DbUser root -DbName stepup_shoes -DbPass 'yourpass'

Notes:
- This script requires the MySQL client (mysql.exe) to be available in PATH.
- It will COPY files (not move). Originals are left in place.
- It creates missing target directories under src/main/resources/static/images/.
- It writes a log file and a CSV of missing images in the scripts/ folder.
#>
param(
    [string]$DbHost = 'localhost',
    [int]$DbPort = 3306,
    [string]$DbName = 'stepup_shoes',
    [string]$DbUser = 'root',
    [string]$DbPass = '',
    [switch]$DryRun,
    [switch]$Move,
    [switch]$Force,
    [switch]$PreserveSubfolders
)

# Workspace root (assumes running from repo root)
$workspaceRoot = Resolve-Path .
$staticImagesRoot = Join-Path $workspaceRoot 'stepupshoes\src\main\resources\static\images'
$scriptsDir = Join-Path $workspaceRoot 'scripts'
$logFile = Join-Path $scriptsDir 'move_images_log.txt'
$missingCsv = Join-Path $scriptsDir 'missing_images.csv'

# Ensure scripts folder exists
if (-not (Test-Path $scriptsDir)) { New-Item -ItemType Directory -Path $scriptsDir | Out-Null }

# Clear log files
"Start: $(Get-Date)" | Out-File $logFile -Encoding utf8
"filename,producto_id,producto_nombre,category,proposed_target,found_source,action" | Out-File $missingCsv -Encoding utf8

# Check mysql availability
$mysql = Get-Command mysql.exe -ErrorAction SilentlyContinue
if (-not $mysql) {
    Write-Host "ERROR: mysql.exe not found in PATH. Install MySQL client or add mysql.exe to PATH." -ForegroundColor Red
    Add-Content $logFile "ERROR: mysql.exe not found in PATH."
    exit 1
}

# Query DB for products
$query = @"
SELECT p.id, p.nombre, COALESCE(c.nombre, '') as categoria, p.imagen_url
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.imagen_url IS NOT NULL AND p.imagen_url <> '';
"@

$escapedQuery = $query.Replace('"','\"')
$mysqlCmd = "mysql.exe --host=$DbHost --port=$DbPort --user=$DbUser --database=$DbName --batch --skip-column-names --raw -e \"$escapedQuery\""
if ($DbPass -ne '') {
    # Warning: passing password on command line is visible to other users on the system
    $mysqlCmd = "mysql.exe --host=$DbHost --port=$DbPort --user=$DbUser --password=$DbPass --database=$DbName --batch --skip-column-names --raw -e \"$escapedQuery\""
}

Write-Host "Running query against DB (this may ask for password if not provided)..."
Add-Content $logFile "Running mysql command: $mysqlCmd"

# Execute and capture
$results = & cmd /c $mysqlCmd 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "MySQL command failed:" -ForegroundColor Red
    Write-Host $results
    Add-Content $logFile "MySQL command failed: $results"
    exit 1
}

# results lines: fields separated by tabs
$lines = $results -split "`n" | Where-Object { $_ -ne '' }

Write-Host "Products found: $($lines.Count)"
Add-Content $logFile "Products found: $($lines.Count)"

$copied = 0
$missing = 0

foreach ($line in $lines) {
    $cols = $line -split "\t"
    if ($cols.Count -lt 4) { continue }
    $prodId = $cols[0].Trim()
    $prodNombre = $cols[1].Trim()
    $categoria = $cols[2].Trim().ToLower()
    $imagenVal = $cols[3].Trim()

    if ([string]::IsNullOrWhiteSpace($imagenVal)) { continue }

    # Normalize path similar to Producto.getRutaImagenCompleta logic
    $path = $imagenVal

    if ($path -match '/o/') {
        # firebase style: take after /o/
        $path = $path.Split('/o/')[1]
    } elseif ($path -match '://') {
        # remove scheme+host
        $after = $path.Split('://')[1]
        $firstSlash = $after.IndexOf('/')
        if ($firstSlash -ge 0) { $path = $after.Substring($firstSlash + 1) } else { $path = $after }
    }

    # decode percent-encoding
    try { $path = [System.Web.HttpUtility]::UrlDecode($path) } catch { }

    # strip query
    if ($path.Contains('?')) { $path = $path.Split('?')[0] }

    # remove leading slashes
    while ($path.StartsWith('/')) { $path = $path.Substring(1) }

    # prevent traversal
    $path = $path -replace '\.\.', ''

    # normalize spaces
    $path = $path -replace '\s+', '_'

    # if no extension, add .jpg
    $lastSeg = if ($path.Contains('/')) { $path.Split('/')[-1] } else { $path }
    if (-not $lastSeg.Contains('.')) { $path = "$path.jpg" }

    # Decide category folder mapping (same rules as SQL script)
    switch ($categoria) {
        'deportivas' { $folder = 'deportivas'; break }
        'running' { $folder = 'deportivas'; break }
        'basketball' { $folder = 'deportivas'; break }
        'casual' { $folder = 'casual'; break }
        'formal' { $folder = 'formal'; break }
        'botas' { $folder = 'formal'; break }
        default { $folder = 'otros' }
    }

    # If path already includes images/ prefix, remove it
    if ($path.StartsWith('images/')) { $path = $path.Substring(7) }
    if ($path.StartsWith('static/images/')) { $path = $path.Substring(13) }

    # Final target path
    if ($PreserveSubfolders) {
        $targetRelative = Join-Path $folder $path
        # Ensure no duplicate folder: if path already contains folder segments, don't duplicate
        if ($path.StartsWith($folder + '/')) { $targetRelative = $path }
    } else {
        # Flatten into single file under the category folder
        $targetRelative = Join-Path $folder $fileName
    }

    $targetFull = Join-Path $staticImagesRoot $targetRelative
    $targetDir = Split-Path $targetFull -Parent

    # Try to find source file in repo (case-insensitive)
    $fileName = Split-Path $path -Leaf
    $found = Get-ChildItem -Path $workspaceRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq $fileName }

    if ($found -and $found.Count -gt 0) {
        # choose first best candidate; prefer those under static/images
        $candidate = $found | Where-Object { $_.FullName -match '\\static\\images\\' } | Select-Object -First 1
        if (-not $candidate) { $candidate = $found | Select-Object -First 1 }

        $sourceFull = $candidate.FullName
        $op = $Move ? 'move' : 'copy'
        $logLine = "$fileName,$prodId,`"$prodNombre`",$categoria,$targetRelative,$sourceFull,$op"
        Add-Content $logFile $logLine

        if ($DryRun) {
            Write-Host "[DRY] Would $op: $sourceFull -> $targetFull"
        } else {
            if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

            $shouldPerform = $true
            if (Test-Path $targetFull) {
                if ($Force) {
                    $shouldPerform = $true
                } else {
                    $shouldPerform = $false
                }
            }

            if (-not $shouldPerform) {
                Write-Host "Skipped (exists): $targetFull" -ForegroundColor DarkYellow
                Add-Content $logFile "Skipped (exists): $targetFull"
            } else {
                try {
                    if ($Move) {
                        if ($Force) { Move-Item -Path $sourceFull -Destination $targetFull -Force -ErrorAction Stop } else { Move-Item -Path $sourceFull -Destination $targetFull -ErrorAction Stop }
                        Write-Host "Moved: $sourceFull -> $targetFull"
                        Add-Content $logFile "Moved: $sourceFull -> $targetFull"
                    } else {
                        if ($Force) { Copy-Item -Path $sourceFull -Destination $targetFull -Force -ErrorAction Stop } else { Copy-Item -Path $sourceFull -Destination $targetFull -ErrorAction Stop }
                        Write-Host "Copied: $sourceFull -> $targetFull"
                        Add-Content $logFile "Copied: $sourceFull -> $targetFull"
                    }
                    $copied++
                } catch {
                    Write-Host "ERROR performing $op for $sourceFull -> $targetFull : $_" -ForegroundColor Red
                    Add-Content $logFile "ERROR performing $op for $sourceFull -> $targetFull : $_"
                }
            }
        }
    } else {
        # Not found
        $action = 'missing'
        $logLine = "$fileName,$prodId,`"$prodNombre`",$categoria,$targetRelative,NOT_FOUND,$action"
        Add-Content $logFile $logLine
        Add-Content $missingCsv "$fileName,$prodId,`"$prodNombre`",$categoria,$targetRelative,NOT_FOUND"
        Write-Host "MISSING: $fileName for product $prodId - $prodNombre" -ForegroundColor Yellow
        $missing++
    }
}

Write-Host "\nSummary: Copied=$copied Missing=$missing"
Add-Content $logFile "Summary: Copied=$copied Missing=$missing"

if ($missing -gt 0) { Write-Host "See $missingCsv for missing files." }

# End
