#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GEP-SCM DevOps Control Center -- interactive menu for build / deploy / test.

.DESCRIPTION
    Single entry point that dispatches to:
      * scripts/build-push-run.ps1  -- build Docker images, push, run prod stack
      * scripts/test-safe.ps1       -- run API tests with DB backup + restore

    Run without arguments and pick from a numbered menu.

.EXAMPLE
    ./devops.ps1
#>

$ErrorActionPreference = 'Stop'

$RepoRoot     = $PSScriptRoot
$ScriptsDir   = Join-Path $RepoRoot 'scripts'
$BuildScript  = Join-Path $ScriptsDir 'build-push-run.ps1'
$TestScript   = Join-Path $ScriptsDir 'test-safe.ps1'
$UiTestScript = Join-Path $ScriptsDir 'test-ui.ps1'
$IacScript    = Join-Path $ScriptsDir 'iac.ps1'
$ObsTestScript = Join-Path $ScriptsDir 'test-observability.ps1'

# ---- pretty printers ----------------------------------------------------
function Write-MainBanner {
    Clear-Host
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor DarkCyan
    Write-Host "  " -NoNewline
    Write-Host "          GEP-SCM  ::  DEVOPS CONTROL CENTER                   " -ForegroundColor White -BackgroundColor DarkCyan
    Write-Host "  ================================================================" -ForegroundColor DarkCyan
}

function Write-Heading { param($Msg) Write-Host ""; Write-Host "  $Msg" -ForegroundColor Cyan; Write-Host ("  " + ('-' * $Msg.Length)) -ForegroundColor DarkCyan }
function Write-Prompt  { param($Msg) Write-Host "  $Msg" -ForegroundColor Yellow -NoNewline }
function Write-Info    { param($Msg) Write-Host "  [i]  $Msg" -ForegroundColor Gray }
function Write-OK      { param($Msg) Write-Host "  [OK] $Msg" -ForegroundColor Green }
function Write-Warn    { param($Msg) Write-Host "  [!]  $Msg" -ForegroundColor Yellow }
function Write-Fail    { param($Msg) Write-Host "  [X]  $Msg" -ForegroundColor Red }

# ---- prompt helpers -----------------------------------------------------
function Read-YesNo {
    param([string]$Question, [bool]$DefaultYes = $false)
    $suffix = if ($DefaultYes) { '[Y/n]' } else { '[y/N]' }
    Write-Prompt "$Question $suffix "
    $a = (Read-Host).Trim().ToLower()
    if ([string]::IsNullOrEmpty($a)) { return $DefaultYes }
    return $a -in @('y','yes')
}

function Read-Choice {
    param([string]$Question, [string[]]$Choices, [string]$Default)
    $shown = $Choices | ForEach-Object { if ($_ -eq $Default) { "$_ [default]" } else { $_ } }
    Write-Prompt "$Question  ($($shown -join ' / ')) "
    $a = (Read-Host).Trim().ToLower()
    if ([string]::IsNullOrEmpty($a)) { return $Default }
    if ($a -in $Choices) { return $a }
    Write-Warn "Invalid choice '$a' -- using default '$Default'"
    return $Default
}

function Pause-ForMenu {
    Write-Host ""
    Write-Prompt "Press Enter to return to the menu ..."
    [void](Read-Host)
}

# ---- menu options -------------------------------------------------------
function Show-Menu {
    Write-MainBanner
    Write-Host ""
    Write-Host "    1) Build & Deploy stack       " -NoNewline -ForegroundColor White
    Write-Host "(scripts/build-push-run.ps1)" -ForegroundColor DarkGray
    Write-Host "    2) Run API Tests (safe mode)  " -NoNewline -ForegroundColor White
    Write-Host "(scripts/test-safe.ps1)" -ForegroundColor DarkGray
    Write-Host "    3) Run UI Tests (Playwright)  " -NoNewline -ForegroundColor White
    Write-Host "(scripts/test-ui.ps1)" -ForegroundColor DarkGray
    Write-Host "    4) Help / About               " -ForegroundColor White
    Write-Host "    5) Provision / Deploy on Azure (Terraform IaC)  " -NoNewline -ForegroundColor White
    Write-Host "(scripts/iac.ps1)" -ForegroundColor DarkGray
    Write-Host "    6) Run Observability Smoke Tests " -NoNewline -ForegroundColor White
    Write-Host "(scripts/test-observability.ps1)" -ForegroundColor DarkGray
    Write-Host "    0) Exit                       " -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Prompt "Choose an option [0-6]: "
    return (Read-Host).Trim()
}

function Invoke-BuildAndDeploy {
    Write-MainBanner
    Write-Heading "Build & Deploy"
    Write-Info "Service codes: 1=IAM  2=Supplier  3=PO  4=Seed  5=Web  6=All"
    Write-Prompt "Which services to build/push? (comma-separated, default 6=All) "
    $svcInput = (Read-Host).Trim()

    $splat = @{}
    if (-not [string]::IsNullOrEmpty($svcInput)) {
        $codes = @()
        foreach ($tok in ($svcInput -split ',')) {
            $t = $tok.Trim()
            if ($t -match '^[1-6]$') { $codes += [int]$t }
            else { Write-Warn "Ignoring invalid service code '$t'" }
        }
        if ($codes.Count -gt 0) { $splat.Services = $codes }
    }

    $skipBuild = Read-YesNo "Skip build step?" $false
    if ($skipBuild) { $splat.SkipBuild = $true }

    $skipPush = Read-YesNo "Skip Docker Hub push?" $false
    if ($skipPush) { $splat.SkipPush = $true }

    if (-not $skipPush -and [string]::IsNullOrWhiteSpace($env:DOCKERHUB_PAT)) {
        Write-Prompt "Docker Hub PAT (input hidden): "
        $secure = Read-Host -AsSecureString
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $env:DOCKERHUB_PAT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }

    if (-not $skipBuild) {
        $force = Read-YesNo "Force clean rebuild (--no-cache --pull)?" $false
        if ($force) { $splat.Force = $true }
    }

    $shown = $splat.Keys | ForEach-Object {
        if ($splat[$_] -is [bool]) { "-$_" }
        elseif ($splat[$_] -is [array]) { "-$_ $($splat[$_] -join ',')" }
        else { "-$_ $($splat[$_])" }
    }
    Write-Host ""
    Write-Info ("Launching: scripts\build-push-run.ps1 {0}" -f ($shown -join ' '))
    Write-Host ""
    & $BuildScript @splat
}

function Invoke-RunTests {
    Write-MainBanner
    Write-Heading "Run API Tests (safe mode)"

    $suite = Read-Choice "Which test suite?" @('all','iam','supplier','po','cross') 'all'

    $openReport = Read-YesNo "Open HTML report after the run?" $false
    $bail       = Read-YesNo "Stop on first failure (-Bail)?"   $false
    $noProtect  = Read-YesNo "Disable DB backup+restore for speed (-NoProtect)?" $false

    if ($noProtect) {
        Write-Host ""
        Write-Fail "-NoProtect is ON. DB will NOT be backed up or restored."
        Write-Warn "Tests may leave data in the database."
        if (-not (Read-YesNo "Continue anyway?" $false)) {
            Write-Info "Aborted."
            return
        }
    }

    $splat = @{ Suite = $suite }
    if ($openReport) { $splat.OpenReport = $true }
    if ($bail)       { $splat.Bail       = $true }
    if ($noProtect)  { $splat.NoProtect  = $true }

    $shown = @("-Suite $suite") + ($splat.Keys | Where-Object { $_ -ne 'Suite' } | ForEach-Object { "-$_" })
    Write-Host ""
    Write-Info ("Launching: scripts\test-safe.ps1 {0}" -f ($shown -join ' '))
    Write-Host ""
    & $TestScript @splat
}

function Invoke-RunUiTests {
    Write-MainBanner
    Write-Heading "Run UI Tests (Playwright)"

    $suite = Read-Choice "Which UI suite?" @('all','login','suppliers','pos') 'all'

    $headed     = Read-YesNo "Run with visible browser (-Headed)?" $false
    $openReport = Read-YesNo "Open HTML report after the run?"     $false

    $splat = @{ Suite = $suite }
    if ($headed)     { $splat.Headed     = $true }
    if ($openReport) { $splat.OpenReport = $true }

    $shown = @("-Suite $suite") + ($splat.Keys | Where-Object { $_ -ne 'Suite' } | ForEach-Object { "-$_" })
    Write-Host ""
    Write-Info ("Launching: scripts\test-ui.ps1 {0}" -f ($shown -join ' '))
    Write-Host ""
    & $UiTestScript @splat
}

function Invoke-IacDeploy {
    Write-MainBanner
    Write-Heading "Provision / Deploy on Azure (Terraform IaC)"
    Write-Info "Targets the modular stack under iac/ (resource group, VNet, NSG,"
    Write-Info "public IP + DNS, Ubuntu VM, cloud-init Docker + compose up)."
    Write-Host ""
    Write-Host "    1) init      -- download providers, set up modules" -ForegroundColor White
    Write-Host "    2) plan      -- preview changes (saves tf.plan)"    -ForegroundColor White
    Write-Host "    3) apply     -- create / update the Azure stack"    -ForegroundColor White
    Write-Host "    4) output    -- show ssh_command, web_url, fqdn"    -ForegroundColor White
    Write-Host "    5) ssh       -- connect to the VM using the output" -ForegroundColor White
    Write-Host "    6) destroy   -- tear down all Azure resources"      -ForegroundColor Red
    Write-Host "    0) back to main menu"                               -ForegroundColor DarkGray
    Write-Host ""
    Write-Prompt "Choose an action [0-6]: "
    $sub = (Read-Host).Trim()

    switch ($sub) {
        '1' { & $IacScript -Action init }
        '2' { & $IacScript -Action plan }
        '3' {
            $auto = Read-YesNo "Auto-approve apply (skip y/N prompt)?" $false
            if ($auto) { & $IacScript -Action apply -AutoApprove }
            else       { & $IacScript -Action apply }
        }
        '4' { & $IacScript -Action output }
        '5' { & $IacScript -Action ssh }
        '6' {
            Write-Fail "This will DESTROY the Azure resource group and all its contents."
            if (Read-YesNo "Are you absolutely sure?" $false) {
                $auto = Read-YesNo "Auto-approve destroy (skip y/N prompt)?" $false
                if ($auto) { & $IacScript -Action destroy -AutoApprove }
                else       { & $IacScript -Action destroy }
            }
            else { Write-Info "Aborted." }
        }
        '0' { return }
        default { Write-Warn "Invalid choice '$sub'." }
    }
}

function Invoke-RunObservabilityTests {
    Write-MainBanner
    Write-Heading "Run Observability Smoke Tests"
    Write-Info "Verifies OTel Collector, Prometheus, Grafana, Loki, Tempo,"
    Write-Info "Jaeger, Alloy/Faro, cAdvisor + node-exporter are all wired up,"
    Write-Info "and that metrics/traces/logs/RUM are flowing from the apps."

    $skipTraffic = Read-YesNo "Skip synthetic traffic generation (fast smoke)?" $false
    $openGrafana = Read-YesNo "Open Grafana in browser on success?" $true

    $splat = @{}
    if ($skipTraffic) { $splat.SkipTraffic = $true }
    if ($openGrafana) { $splat.OpenGrafana = $true }

    $shown = $splat.Keys | ForEach-Object { "-$_" }
    Write-Host ""
    Write-Info ("Launching: scripts\test-observability.ps1 {0}" -f ($shown -join ' '))
    Write-Host ""
    & $ObsTestScript @splat
}

function Show-HelpAbout {
    Write-MainBanner
    Write-Heading "Help / About"
    Write-Host ""
    Write-Host "  This control center dispatches to two underlying scripts:" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  scripts\build-push-run.ps1" -ForegroundColor Cyan
    Write-Host "    Builds Docker images for the GEP-SCM services, optionally" -ForegroundColor Gray
    Write-Host "    pushes them to Docker Hub, then brings the prod stack up via"  -ForegroundColor Gray
    Write-Host "    docker-compose-prod.yml. Supports per-service selection,"      -ForegroundColor Gray
    Write-Host "    skip-build, skip-push and force-rebuild modes."                -ForegroundColor Gray
    Write-Host "    Full help:  pwsh scripts\build-push-run.ps1 -Help"             -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  scripts\test-safe.ps1" -ForegroundColor Cyan
    Write-Host "    Runs the Jest E2E suite in tests/api against the live stack." -ForegroundColor Gray
    Write-Host "    By default it pg_dumps both Postgres DBs and mongodumps the"   -ForegroundColor Gray
    Write-Host "    Mongo DB BEFORE the tests run, and ALWAYS restores afterward" -ForegroundColor Gray
    Write-Host "    (success, failure, or Ctrl+C). Zero footprint on the DB."     -ForegroundColor Gray
    Write-Host "    Use -NoProtect to skip the backup/restore for fast iteration." -ForegroundColor Gray
    Write-Host "    Full help:  pwsh scripts\test-safe.ps1 -Help"                  -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  scripts\test-ui.ps1" -ForegroundColor Cyan
    Write-Host "    Runs the Playwright UI suite in tests/ui (chromium) against"   -ForegroundColor Gray
    Write-Host "    http://localhost:8080.  Data-driven: pos.txt + suppliers.txt"  -ForegroundColor Gray
    Write-Host "    under tests/ui/data/ drive the per-record test cases."         -ForegroundColor Gray
    Write-Host "    First run installs Playwright + Chromium automatically."       -ForegroundColor Gray
    Write-Host "    Full help:  pwsh scripts\test-ui.ps1 -Help"                    -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  scripts\iac.ps1" -ForegroundColor Cyan
    Write-Host "    Wraps `terraform` for the modular Azure IaC stack under iac/." -ForegroundColor Gray
    Write-Host "    Actions: init, plan, apply, destroy, output, ssh. Provisions"  -ForegroundColor Gray
    Write-Host "    a West US resource group, VNet, NSG (8080 public; SSH/DB/API"  -ForegroundColor Gray
    Write-Host "    locked to operator IP), Ubuntu 22.04 VM, public IP + DNS, and" -ForegroundColor Gray
    Write-Host "    cloud-init that installs Docker and runs the prod compose."    -ForegroundColor Gray
    Write-Host "    Full help:  pwsh scripts\iac.ps1 -Action plan  (uses -Help via Get-Help)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  scripts\test-observability.ps1" -ForegroundColor Cyan
    Write-Host "    End-to-end smoke test for the OTel + Prometheus + Grafana +" -ForegroundColor Gray
    Write-Host "    Loki + Tempo + Jaeger + Alloy/Faro stack. Checks container"   -ForegroundColor Gray
    Write-Host "    health, endpoints, Prom targets, generates traffic, then"    -ForegroundColor Gray
    Write-Host "    verifies metrics/traces/logs/RUM are flowing and Grafana"    -ForegroundColor Gray
    Write-Host "    datasources resolve. Exit code 0 only if every check passes." -ForegroundColor Gray
    Write-Host "    Full help:  pwsh scripts\test-observability.ps1 -Help"       -ForegroundColor DarkGray
}

# ---- main loop ----------------------------------------------------------
while ($true) {
    try {
        $choice = Show-Menu
        switch ($choice) {
            '1' { Invoke-BuildAndDeploy; Pause-ForMenu }
            '2' { Invoke-RunTests;       Pause-ForMenu }
            '3' { Invoke-RunUiTests;     Pause-ForMenu }
            '4' { Show-HelpAbout;        Pause-ForMenu }
            '5' { Invoke-IacDeploy;      Pause-ForMenu }
            '6' { Invoke-RunObservabilityTests; Pause-ForMenu }
            '0' {
                Write-Host ""
                Write-OK "Bye."
                Write-Host ""
                exit 0
            }
            default {
                Write-Warn "Invalid choice '$choice'. Pick 0, 1, 2, 3, 4, 5, or 6."
                Start-Sleep -Seconds 1
            }
        }
    } catch {
        Write-Host ""
        Write-Fail $_.Exception.Message
        Pause-ForMenu
    }
}
