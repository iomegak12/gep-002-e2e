[CmdletBinding()]
param(
    [string]$DockerHubPAT = $env:DOCKERHUB_PAT,
    [string]$DockerHubUser = "iomega",
    [int[]]$Services,
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$Force,
    [Alias('h','?')]
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# ---------- Colorful output helpers ----------
function Write-Banner {
    param([string]$Text)
    $line = ('=' * 72)
    Write-Host ""
    Write-Host $line -ForegroundColor DarkCyan
    Write-Host ("  " + $Text) -ForegroundColor White -BackgroundColor DarkCyan
    Write-Host $line -ForegroundColor DarkCyan
}
function Write-Step    { param([string]$m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Write-Info    { param([string]$m) Write-Host "  [i] $m"  -ForegroundColor Gray }
function Write-Ok      { param([string]$m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn    { param([string]$m) Write-Host "  [!] $m"  -ForegroundColor Yellow }
function Write-ErrLine { param([string]$m) Write-Host "  [X] $m"  -ForegroundColor Red }
function Write-Action  { param([string]$m) Write-Host "  -> $m"   -ForegroundColor Magenta }
function Write-Kv {
    param([string]$Key, [string]$Value)
    Write-Host ("  {0,-14}: " -f $Key) -ForegroundColor DarkGray -NoNewline
    Write-Host $Value -ForegroundColor Yellow
}

function Show-Help {
    Write-Banner "build-push-run.ps1 - Help"
    @"
Build, push and run the GEP docker stack.

USAGE
  ./build-push-run.ps1 [-DockerHubPAT <token>] [-DockerHubUser <user>]
                       [-SkipBuild] [-SkipPush] [-Help]

PARAMETERS
  -DockerHubPAT <token>   Docker Hub Personal Access Token. Falls back to
                          environment variable DOCKERHUB_PAT. Required unless
                          -SkipPush is passed.
  -DockerHubUser <user>   Docker Hub username / namespace. Default: 'iomega'.
  -SkipBuild              Do not run 'docker compose build'. Use when images
                          already exist locally or will be pulled from the
                          registry.
  -SkipPush               Do not log in or push images to Docker Hub. PAT is
                          not required in this mode.
  -Services <int[]>       Comma-separated service codes to act on. Codes:
                            1 = IAM       2 = Supplier  3 = PO
                            4 = Seed      5 = Web       6 = All (default)
                          Example: -Services 1,5 (IAM + Web).
                          If '6' appears, All is selected.
                          When omitted, behaves as 6 (full stack).
                          Subset selection skips 'compose down' and runs
                          'compose up -d --force-recreate <services>',
                          which auto-starts depends_on services.
  -Force                  Force a clean rebuild of all images (passes
                          --no-cache --pull to 'docker compose build').
                          Applies only to the build step; ignored when
                          -SkipBuild is set.
  -Help, -h, -?           Show this help and exit.

BEHAVIOUR
  1. (push only) docker login as `$DockerHubUser using the PAT.
  2. (unless -SkipBuild) docker compose -f docker-compose.yml build
  3. (unless -SkipPush)  docker push iomega/gep-{iam,supplier-service,
                                          po-service,seed,web}:latest
  4. docker compose -f docker-compose-prod.yml down
  5. docker compose -f docker-compose-prod.yml up -d
  6. docker logout (only if logged in)

EXAMPLES
  # Full pipeline using PAT from environment
  `$env:DOCKERHUB_PAT = 'dckr_pat_xxx'
  ./build-push-run.ps1

  # Pass PAT explicitly
  ./build-push-run.ps1 -DockerHubPAT 'dckr_pat_xxx'

  # Local build only, no push, then start prod stack
  ./build-push-run.ps1 -SkipPush

  # Pull-from-registry path: skip build and push, just run prod
  ./build-push-run.ps1 -SkipBuild -SkipPush

  # Use a different Docker Hub namespace
  ./build-push-run.ps1 -DockerHubUser myorg

  # Build, push and recreate only the PO service
  ./build-push-run.ps1 -Services 3

  # IAM + Web only, skip push
  ./build-push-run.ps1 -Services 1,5 -SkipPush

  # Force clean rebuild of Seed, push, recreate Seed
  ./build-push-run.ps1 -Services 4 -Force
"@ | Write-Host -ForegroundColor Gray
}

if ($Help) {
    Show-Help
    return
}

$RepoRoot    = Split-Path $PSScriptRoot -Parent
$DevCompose  = Join-Path $RepoRoot 'docker-compose.yml'
$ProdCompose = Join-Path $RepoRoot 'docker-compose-prod.yml'

# Service registry: code -> { Name, Compose service id, Image tag }
# NOTE: must be a regular hashtable, NOT [ordered]. OrderedDictionary indexes
# integers as POSITIONS, not keys, which silently returns wrong items.
$ServiceRegistry = @{
    1 = @{ Name = 'IAM';      Compose = 'iam';              Image = 'iomega/gep-iam:latest' }
    2 = @{ Name = 'Supplier'; Compose = 'supplier-service'; Image = 'iomega/gep-supplier-service:latest' }
    3 = @{ Name = 'PO';       Compose = 'po-service';       Image = 'iomega/gep-po-service:latest' }
    4 = @{ Name = 'Seed';     Compose = 'seed';             Image = 'iomega/gep-seed:latest' }
    5 = @{ Name = 'Web';      Compose = 'web';              Image = 'iomega/gep-web:latest' }
}
$AllCodes = @(1, 2, 3, 4, 5)

# Resolve -Services selection
$AllSelected = $false
if (-not $Services -or $Services.Count -eq 0) {
    $AllSelected = $true
    $SelectedCodes = $AllCodes
} elseif ($Services -contains 6) {
    $AllSelected = $true
    $SelectedCodes = $AllCodes
} else {
    $invalid = $Services | Where-Object { $_ -lt 1 -or $_ -gt 6 }
    if ($invalid) {
        throw "Invalid -Services value(s): $($invalid -join ', '). Valid codes: 1=IAM, 2=Supplier, 3=PO, 4=Seed, 5=Web, 6=All."
    }
    $SelectedCodes = $Services | Sort-Object -Unique
}

$SelectedCompose = @($SelectedCodes | ForEach-Object { $ServiceRegistry[[int]$_].Compose })
$SelectedImages  = @($SelectedCodes | ForEach-Object { $ServiceRegistry[[int]$_].Image })
$SelectedNames   = @($SelectedCodes | ForEach-Object { $ServiceRegistry[[int]$_].Name })

function Assert-LastExit($what) {
    if ($LASTEXITCODE -ne 0) {
        Write-ErrLine "$what failed with exit code $LASTEXITCODE"
        throw "$what failed with exit code $LASTEXITCODE"
    }
}

$LoggedIn = $false
$StartedAt = Get-Date

try {
    Write-Banner "GEP :: build-push-run pipeline"
    Write-Kv "DockerHub user" $DockerHubUser
    Write-Kv "Services"       ($(if ($AllSelected) { "ALL ($($SelectedNames -join ', '))" } else { $SelectedNames -join ', ' }))
    Write-Kv "Skip build"    $SkipBuild
    Write-Kv "Skip push"     $SkipPush
    Write-Kv "Force build"   $Force
    Write-Kv "Dev compose"   $DevCompose
    Write-Kv "Prod compose"  $ProdCompose
    Write-Kv "Started at"    ($StartedAt.ToString('yyyy-MM-dd HH:mm:ss'))

    if (-not $SkipPush) {
        Write-Step "Step 1/5 : Docker Hub login"
        if ([string]::IsNullOrWhiteSpace($DockerHubPAT)) {
            Write-ErrLine "Docker Hub PAT not provided."
            throw "Docker Hub PAT required for push. Provide via -DockerHubPAT or `$env:DOCKERHUB_PAT, or pass -SkipPush."
        }
        Write-Action "docker login -u $DockerHubUser"
        $DockerHubPAT | docker login -u $DockerHubUser --password-stdin
        Assert-LastExit "docker login"
        $LoggedIn = $true
        Write-Ok "Logged in to Docker Hub"
    } else {
        Write-Step "Step 1/5 : Docker Hub login"
        Write-Warn "Skipping login (-SkipPush)"
    }

    if (-not $SkipBuild) {
        Write-Step ("Step 2/5 : Build images ({0})" -f ($SelectedNames -join ', '))
        $buildArgs = @('compose', '-f', $DevCompose, 'build')
        if ($Force) {
            $buildArgs += @('--no-cache', '--pull')
            Write-Warn "Force rebuild enabled (--no-cache --pull)"
        }
        if (-not $AllSelected) { $buildArgs += $SelectedCompose }
        Write-Action ("docker " + ($buildArgs -join ' '))
        & docker @buildArgs
        Assert-LastExit "docker compose build"
        Write-Ok "Build complete"
    } else {
        Write-Step "Step 2/5 : Build images"
        Write-Warn "Skipping build (-SkipBuild)"
        if ($Force) {
            Write-Warn "-Force ignored because -SkipBuild is set"
        }
    }

    if (-not $SkipPush) {
        Write-Step ("Step 3/5 : Push images to Docker Hub ({0})" -f ($SelectedNames -join ', '))
        $i = 0
        foreach ($img in $SelectedImages) {
            $i++
            Write-Action ("[{0}/{1}] pushing {2}" -f $i, $SelectedImages.Count, $img)
            docker push $img
            Assert-LastExit "docker push $img"
            Write-Ok "Pushed $img"
        }
    } else {
        Write-Step "Step 3/5 : Push images to Docker Hub"
        Write-Warn "Skipping push (-SkipPush)"
    }

    if ($AllSelected) {
        Write-Step "Step 4/5 : Tear down existing prod stack"
        Write-Action "docker compose -f $ProdCompose down"
        docker compose -f $ProdCompose down
        Assert-LastExit "docker compose down"
        Write-Ok "Existing stack stopped"

        Write-Step "Step 5/5 : Start prod stack (all services)"
        Write-Action "docker compose -f $ProdCompose up -d"
        docker compose -f $ProdCompose up -d
        Assert-LastExit "docker compose up"
        Write-Ok "Stack is up"
    } else {
        Write-Step "Step 4/5 : Tear down (skipped for subset selection)"
        Write-Info "Other running services are preserved."

        Write-Step ("Step 5/5 : Recreate selected services ({0})" -f ($SelectedNames -join ', '))
        $upArgs = @('compose', '-f', $ProdCompose, 'up', '-d', '--force-recreate') + $SelectedCompose
        Write-Action ("docker " + ($upArgs -join ' '))
        & docker @upArgs
        Assert-LastExit "docker compose up"
        Write-Ok ("Recreated: {0}" -f ($SelectedCompose -join ', '))
    }

    $Elapsed = (Get-Date) - $StartedAt
    Write-Banner ("SUCCESS in {0:mm}m {0:ss}s" -f $Elapsed)
    Write-Host "  Service endpoints:" -ForegroundColor Green
    Write-Kv "Web UI"        "http://localhost:8080"
    Write-Kv "IAM API"       "http://localhost:3001"
    Write-Kv "Supplier API"  "http://localhost:3002"
    Write-Kv "PO API"        "http://localhost:3003"
    Write-Kv "CloudBeaver"   "http://localhost:8978"
    Write-Kv "Mongo Express" "http://localhost:8081"
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Banner "FAILED"
    Write-ErrLine $_.Exception.Message
    throw
}
finally {
    if ($LoggedIn) {
        Write-Step "Cleanup : Docker Hub logout"
        docker logout | Out-Null
        Write-Ok "Logged out"
    }
}
