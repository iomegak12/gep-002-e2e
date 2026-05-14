#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Runs the GEP-SCM Playwright UI test suite in tests/ui.

.DESCRIPTION
    * Auto-installs npm deps (and the Chromium browser binary) on first run.
    * Verifies the web app is reachable before launching tests.
    * Forwards Playwright flags via parameters.
    * Optionally opens the HTML report after the run.

.PARAMETER Suite
    all (default) | login | suppliers | pos

.PARAMETER Headed
    Run the browser visibly (default: headless).

.PARAMETER Debug
    Run in Playwright debug/inspector mode.

.PARAMETER OpenReport
    Open the HTML report (playwright-report/index.html) after the run.

.PARAMETER Help
    Show this help.
#>

param(
    [ValidateSet('all','login','suppliers','pos')]
    [string]$Suite = 'all',
    [switch]$Headed,
    [switch]$Debug,
    [switch]$OpenReport,
    [Alias('h','?')]
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Get-Help -Detailed $PSCommandPath
    exit 0
}

$RepoRoot = Split-Path $PSScriptRoot -Parent
$UiDir    = Join-Path $RepoRoot 'tests\ui'
$WebUrl   = $env:WEB_URL; if ([string]::IsNullOrWhiteSpace($WebUrl)) { $WebUrl = 'http://localhost:8080' }

function Write-Phase { param($Msg) Write-Host ""; Write-Host "==> $Msg" -ForegroundColor Cyan }
function Write-OK    { param($Msg) Write-Host "    [OK] $Msg" -ForegroundColor Green }
function Write-Warn  { param($Msg) Write-Host "    [!]  $Msg" -ForegroundColor Yellow }
function Write-Fail  { param($Msg) Write-Host "    [X]  $Msg" -ForegroundColor Red }

function Write-Banner {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Magenta
    Write-Host "         GEP-SCM UI TEST RUNNER  (Playwright / chromium)       " -ForegroundColor Magenta
    Write-Host "===============================================================" -ForegroundColor Magenta
    Write-Host (" Suite      : {0}" -f $Suite)              -ForegroundColor Gray
    Write-Host (" Web URL    : {0}" -f $WebUrl)             -ForegroundColor Gray
    if ($Headed)     { Write-Host  " Headed     : on (browser will be visible)" -ForegroundColor Gray }
    if ($Debug)      { Write-Host  " Debug      : on (Playwright inspector)"    -ForegroundColor Gray }
    if ($OpenReport) { Write-Host  " OpenReport : on (HTML report after run)"   -ForegroundColor Gray }
    Write-Host "===============================================================" -ForegroundColor Magenta
}

function Assert-WebReachable {
    Write-Phase "Checking web app is reachable ..."
    try {
        $r = Invoke-WebRequest -Uri $WebUrl -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -ne 200) { throw "non-200 ($($r.StatusCode))" }
        Write-OK ("Web app responded 200 at {0}" -f $WebUrl)
    } catch {
        Write-Fail "Web app not reachable at $WebUrl"
        Write-Host ""
        Write-Host "Start the stack first:" -ForegroundColor Yellow
        Write-Host "  docker compose up -d"  -ForegroundColor Yellow
        exit 3
    }
}

function Get-PlaywrightBin {
    $pwCmd = Join-Path $UiDir 'node_modules\.bin\playwright.cmd'
    $pwSh  = Join-Path $UiDir 'node_modules\.bin\playwright'
    if (Test-Path $pwCmd) { return $pwCmd }
    if (Test-Path $pwSh)  { return $pwSh }
    return $null
}

function Install-IfNeeded {
    $nm = Join-Path $UiDir 'node_modules'

    if (-not (Test-Path $nm) -or -not (Get-PlaywrightBin)) {
        Write-Phase "Installing Playwright deps (first run) ..."
        Push-Location $UiDir
        try {
            & npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Warn "npm install failed, retrying with --legacy-peer-deps ..."
                & npm install --legacy-peer-deps
                if ($LASTEXITCODE -ne 0) {
                    Write-Fail "'npm install' in tests/ui failed (exit $LASTEXITCODE)."
                    Write-Host "    Reproduce manually:" -ForegroundColor Yellow
                    Write-Host "      cd tests\ui"        -ForegroundColor Yellow
                    Write-Host "      npm install"        -ForegroundColor Yellow
                    throw "Cannot continue without installed test dependencies."
                }
            }
        } finally { Pop-Location }
        Write-OK "npm deps installed."
    }

    $pwBin = Get-PlaywrightBin
    if (-not $pwBin) {
        throw "Playwright CLI not found in tests/ui/node_modules/.bin/ after install."
    }

    # Marker file avoids re-running the browser install on every run.
    # Browsers themselves live in %USERPROFILE%\AppData\Local\ms-playwright.
    $marker = Join-Path $UiDir 'node_modules\.playwright-chromium-installed'
    if (-not (Test-Path $marker)) {
        Write-Phase "Installing Chromium browser for Playwright ..."
        & $pwBin install chromium
        if ($LASTEXITCODE -ne 0) { throw "'playwright install chromium' failed (exit $LASTEXITCODE)" }
        New-Item -ItemType File -Path $marker -Force | Out-Null
        Write-OK "Chromium installed."
    }
}

function Get-PlaywrightFilter {
    switch ($Suite) {
        'login'     { return '01-login-logout' }
        'suppliers' { return '02-suppliers' }
        'pos'       { return '03-purchase-orders' }
        default     { return $null }
    }
}

# ---- main ---------------------------------------------------------------
Write-Banner
Assert-WebReachable
Install-IfNeeded

Push-Location $UiDir
try {
    $pwBin = Get-PlaywrightBin
    $pwArgs = @('test')
    $filter = Get-PlaywrightFilter
    if ($filter)    { $pwArgs += $filter }
    if ($Headed)    { $pwArgs += '--headed' }
    if ($Debug)     { $pwArgs += '--debug' }

    Write-Phase ("Running Playwright ({0} {1}) ..." -f (Split-Path $pwBin -Leaf), ($pwArgs -join ' '))
    & $pwBin @pwArgs
    $exitCode = $LASTEXITCODE

    if ($OpenReport) {
        $report = Join-Path $UiDir 'playwright-report\index.html'
        if (Test-Path $report) {
            Write-Phase ("Opening HTML report: {0}" -f $report)
            try { Start-Process $report | Out-Null }
            catch { Write-Warn "Could not auto-open. Open manually: $report" }
        } else {
            Write-Warn "playwright-report/index.html was not generated."
        }
    }
} finally { Pop-Location }

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "==> UI tests FAILED." -ForegroundColor Yellow
    exit $exitCode
}
Write-Host ""
Write-Host "==> UI tests PASSED." -ForegroundColor Green
exit 0
