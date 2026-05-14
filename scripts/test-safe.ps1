#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Runs the GEP-SCM API test suite with automatic DB backup + restore.

.DESCRIPTION
    Wraps `npm test` in tests/api with a pg_dump + mongodump of all three
    databases (Postgres `auth`, Postgres `po`, Mongo `suppliers`) before
    the run, and a guaranteed restore afterwards -- success, failure or
    Ctrl+C. Leaves zero footprint behind.

.PARAMETER Suite
    Which test suite to run.  all | iam | supplier | po | cross   (default: all)

.PARAMETER Bail
    Stop on the first failing test.  Forwards --bail to Jest.

.PARAMETER Filter
    Run only tests whose name matches the pattern.  Forwards -t <pattern> to Jest.

.PARAMETER Coverage
    Generate a coverage report.  Forwards --coverage to Jest.

.PARAMETER OpenReport
    Produce an HTML test report (jest-html-reporter) and open it in the
    default browser after the run.  Report path: tests/api/.test-report.html

.PARAMETER KeepBackup
    Do NOT delete the dump files after a successful restore (useful while
    debugging the backup/restore plumbing itself).

.PARAMETER SkipRestore
    DANGEROUS: skip the restore step. Backups are still taken so you can
    restore manually later. Use only when you need to inspect DB state
    left behind by a failing test.

.PARAMETER DryRun
    Run only the backup + restore cycle, without running any tests.
    Useful for verifying the pipeline works against your stack.

.PARAMETER NoProtect
    DANGEROUS: skip BOTH the backup AND the restore step entirely.  Use only
    for fast inner-loop iteration when you don't care about side effects.
    Tests will run directly against the live DBs and any data they create
    will persist.

.PARAMETER Help
    Show this help.  Equivalent to -h, -?, /?, --help.

.EXAMPLE
    .\test-safe.ps1
    Run the full suite with backup+restore.

.EXAMPLE
    .\test-safe.ps1 -Suite po -Bail
    Run only the po suite, stop on first failure.

.EXAMPLE
    .\test-safe.ps1 -Filter "blacklist" -Suite cross
    Cross-service tests whose name contains "blacklist".

.EXAMPLE
    .\test-safe.ps1 -DryRun
    Verify backup+restore plumbing without touching tests.
#>

param(
    [ValidateSet('all','iam','supplier','po','cross')]
    [string]$Suite = 'all',
    [switch]$Bail,
    [string]$Filter,
    [switch]$Coverage,
    [switch]$OpenReport,
    [switch]$KeepBackup,
    [switch]$SkipRestore,
    [switch]$NoProtect,
    [switch]$DryRun,
    [Alias('h','?')]
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Get-Help -Detailed $PSCommandPath
    exit 0
}

# ---- paths --------------------------------------------------------------
$RepoRoot    = Split-Path $PSScriptRoot -Parent
# Compose stack is launched from the repo root (the root-level docker-compose.yml
# defines fixed container names gep-postgres / gep-mongo / gep-iam / ... and is
# the one the user runs in dev).  The gep-back-end/docker-compose.yml is a
# secondary file with DIFFERENT DB names -- do not point this script at it.
$ComposeDir  = $RepoRoot
$TestsDir    = Join-Path $RepoRoot 'tests\api'
$BackupDir   = Join-Path $RepoRoot '.test-backup'
$ResultsFile = Join-Path $TestsDir '.jest-results.json'
$ReportFile  = Join-Path $TestsDir '.test-report.html'
$ApiServices = @('iam','supplier-service','po-service')
$HealthUrls  = [ordered]@{
    'iam'              = 'http://localhost:3001/health'
    'supplier-service' = 'http://localhost:3002/health'
    'po-service'       = 'http://localhost:3003/health'
}

# ---- pretty printers ----------------------------------------------------
function Write-Banner {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "         GEP-SCM API TEST RUNNER  --  SAFE MODE                " -ForegroundColor Cyan
    Write-Host "         backup -> test -> restore  (zero footprint)           " -ForegroundColor DarkCyan
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host (" Suite     : {0}" -f $Suite) -ForegroundColor Gray
    if ($Filter)      { Write-Host (" Filter    : {0}" -f $Filter) -ForegroundColor Gray }
    if ($Bail)        { Write-Host  " Bail      : on (stop on first failure)" -ForegroundColor Gray }
    if ($Coverage)    { Write-Host  " Coverage  : on" -ForegroundColor Gray }
    if ($OpenReport)  { Write-Host  " OpenReport: on (HTML report will open after the run)" -ForegroundColor Gray }
    if ($KeepBackup)  { Write-Host  " KeepBackup: on (dumps will be retained)" -ForegroundColor Gray }
    if ($SkipRestore) { Write-Host  " SkipRestore: ON -- DB WILL NOT BE RESTORED" -ForegroundColor Red }
    if ($NoProtect) {
        Write-Host  " NoProtect : ON -- DB BACKUP + RESTORE DISABLED" -ForegroundColor Red
        Write-Host  "             tests may leave data in the database"  -ForegroundColor DarkYellow
    }
    if ($DryRun)      { Write-Host  " DryRun    : on (skip tests, exercise backup+restore only)" -ForegroundColor Yellow }
    Write-Host "===============================================================" -ForegroundColor Cyan
}

function Write-Phase   { param($Msg) Write-Host ""; Write-Host "==> $Msg" -ForegroundColor Cyan }
function Write-OK      { param($Msg) Write-Host "    [OK] $Msg" -ForegroundColor Green }
function Write-Warn    { param($Msg) Write-Host "    [!]  $Msg" -ForegroundColor Yellow }
function Write-Fail    { param($Msg) Write-Host "    [X]  $Msg" -ForegroundColor Red }

# ---- compose wrapper ----------------------------------------------------
function Invoke-Compose {
    # No param block on purpose: $args captures every token verbatim,
    # so flags like `-T` are passed through to docker compose instead of
    # being interpreted by PowerShell as parameters of this function.
    $composeArgs = $args
    Push-Location $ComposeDir
    try {
        & docker compose @composeArgs
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose $($composeArgs -join ' ') failed (exit $LASTEXITCODE)"
        }
    } finally { Pop-Location }
}

# ---- health checks ------------------------------------------------------
function Assert-StackHealthy {
    Write-Phase "Verifying stack is up and healthy ..."
    foreach ($name in $HealthUrls.Keys) {
        try {
            $r = Invoke-WebRequest -Uri $HealthUrls[$name] -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -ne 200) { throw "non-200" }
            Write-OK ("{0,-18} -> {1}" -f $name, $HealthUrls[$name])
        } catch {
            Write-Fail "Service '$name' not reachable at $($HealthUrls[$name])"
            Write-Host ""
            Write-Host "Start the stack first:" -ForegroundColor Yellow
            Write-Host "  cd gep-back-end"      -ForegroundColor Yellow
            Write-Host "  docker compose up -d" -ForegroundColor Yellow
            exit 3
        }
    }
}

function Wait-ForHealthy {
    param([int]$TimeoutSeconds = 60)
    Write-Host "    waiting for /health ..." -NoNewline -ForegroundColor DarkGray
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $ok = $true
        foreach ($name in $HealthUrls.Keys) {
            try {
                $r = Invoke-WebRequest -Uri $HealthUrls[$name] -UseBasicParsing -TimeoutSec 2
                if ($r.StatusCode -ne 200) { $ok = $false; break }
            } catch { $ok = $false; break }
        }
        if ($ok) { Write-Host " healthy." -ForegroundColor Green; return }
        Write-Host "." -NoNewline -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }
    throw "API services did not become healthy within $TimeoutSeconds seconds."
}

# ---- backup / restore ---------------------------------------------------
function Backup-Databases {
    Write-Phase "Backing up databases ..."
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

    Invoke-Compose exec -T postgres sh -c 'pg_dump -U gep -Fc -d iam -f /tmp/iam.dump'
    Invoke-Compose cp 'postgres:/tmp/iam.dump' (Join-Path $BackupDir 'iam.dump')
    Invoke-Compose exec -T postgres rm -f /tmp/iam.dump
    Write-OK ("postgres/iam       -> {0}" -f (Join-Path $BackupDir 'iam.dump'))

    Invoke-Compose exec -T postgres sh -c 'pg_dump -U gep -Fc -d po -f /tmp/po.dump'
    Invoke-Compose cp 'postgres:/tmp/po.dump' (Join-Path $BackupDir 'po.dump')
    Invoke-Compose exec -T postgres rm -f /tmp/po.dump
    Write-OK ("postgres/po        -> {0}" -f (Join-Path $BackupDir 'po.dump'))

    Invoke-Compose exec -T mongo sh -c 'mongodump --quiet --db=gep_supplier --archive=/tmp/suppliers.archive'
    Invoke-Compose cp 'mongo:/tmp/suppliers.archive' (Join-Path $BackupDir 'suppliers.archive')
    Invoke-Compose exec -T mongo rm -f /tmp/suppliers.archive
    Write-OK ("mongo/gep_supplier -> {0}" -f (Join-Path $BackupDir 'suppliers.archive'))
}

function Restore-Databases {
    Write-Phase "Restoring databases ..."
    Invoke-Compose stop @ApiServices
    Write-OK "API services stopped (released DB connections)"

    Invoke-Compose cp (Join-Path $BackupDir 'iam.dump') 'postgres:/tmp/iam.dump'
    Invoke-Compose exec -T postgres pg_restore -U gep --clean --if-exists -d iam /tmp/iam.dump
    Invoke-Compose exec -T postgres rm -f /tmp/iam.dump
    Write-OK "postgres/iam restored"

    Invoke-Compose cp (Join-Path $BackupDir 'po.dump') 'postgres:/tmp/po.dump'
    Invoke-Compose exec -T postgres pg_restore -U gep --clean --if-exists -d po /tmp/po.dump
    Invoke-Compose exec -T postgres rm -f /tmp/po.dump
    Write-OK "postgres/po restored"

    Invoke-Compose cp (Join-Path $BackupDir 'suppliers.archive') 'mongo:/tmp/suppliers.archive'
    Invoke-Compose exec -T mongo mongorestore --quiet --drop --archive=/tmp/suppliers.archive
    Invoke-Compose exec -T mongo rm -f /tmp/suppliers.archive
    Write-OK "mongo/gep_supplier restored"

    Invoke-Compose start @ApiServices
    Wait-ForHealthy -TimeoutSeconds 60
}

function Show-ManualRestoreHelp {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host " RESTORE FAILED -- DATABASE STATE MAY BE INCONSISTENT          " -ForegroundColor Red
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host " Backup dumps preserved at:" -ForegroundColor Yellow
    Write-Host "   $BackupDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Manual restore (from $ComposeDir):" -ForegroundColor Yellow
    Write-Host "   docker compose stop iam supplier-service po-service"
    Write-Host "   docker compose cp `"$BackupDir\iam.dump`" postgres:/tmp/iam.dump"
    Write-Host "   docker compose exec postgres pg_restore -U gep --clean --if-exists -d iam /tmp/iam.dump"
    Write-Host "   docker compose cp `"$BackupDir\po.dump`" postgres:/tmp/po.dump"
    Write-Host "   docker compose exec postgres pg_restore -U gep --clean --if-exists -d po /tmp/po.dump"
    Write-Host "   docker compose cp `"$BackupDir\suppliers.archive`" mongo:/tmp/suppliers.archive"
    Write-Host "   docker compose exec mongo mongorestore --drop --db=gep_supplier --archive=/tmp/suppliers.archive"
    Write-Host "   docker compose start iam supplier-service po-service"
    Write-Host "===============================================================" -ForegroundColor Red
}

# ---- test runner --------------------------------------------------------
function Get-JestBinary {
    # Returns the path to the local jest CLI. Auto-runs `npm install` only
    # when the jest binary is genuinely missing.  Mtime-based staleness
    # checks are unreliable across mixed editors / git ops, so we deliberately
    # don't reinstall on every edit to package.json.
    $jestCmd  = Join-Path $TestsDir 'node_modules\.bin\jest.cmd'
    $jestSh   = Join-Path $TestsDir 'node_modules\.bin\jest'

    $needsInstall = -not (Test-Path $jestCmd) -and -not (Test-Path $jestSh)

    if ($needsInstall) {
        Write-Phase "Installing test dependencies (package.json changed or node_modules missing) ..."
        Push-Location $TestsDir
        try {
            & npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Warn "npm install failed, retrying with --legacy-peer-deps ..."
                & npm install --legacy-peer-deps
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Host ""
                Write-Fail "'npm install' in tests/api failed (exit $LASTEXITCODE)."
                Write-Host "    Reproduce manually to see the full error:" -ForegroundColor Yellow
                Write-Host "      cd tests\api"                              -ForegroundColor Yellow
                Write-Host "      npm install"                               -ForegroundColor Yellow
                throw "Cannot continue without installed test dependencies."
            }
        } finally { Pop-Location }
        Write-OK "Dependencies installed."
    }

    if (Test-Path $jestCmd) { return $jestCmd }
    if (Test-Path $jestSh)  { return $jestSh }
    throw "Could not locate jest binary in tests/api/node_modules/.bin/ after install."
}

function Get-JestArgs {
    $a = @()
    switch ($Suite) {
        'iam'      { $a += 'src/tests/iam' }
        'supplier' { $a += 'src/tests/supplier' }
        'po'       { $a += 'src/tests/po' }
        'cross'    { $a += 'src/tests/cross-service' }
    }
    if ($Bail)     { $a += '--bail' }
    if ($Coverage) { $a += '--coverage' }
    if ($Filter)   { $a += @('-t', $Filter) }
    if ($OpenReport) {
        $a += @('--reporters=default', '--reporters=jest-html-reporter')
    }
    # JSON results sidecar for our summary banner
    $a += @('--json', "--outputFile=$ResultsFile")
    return ,$a
}

function Show-TestSummary {
    param([double]$ElapsedSeconds)
    if (-not (Test-Path $ResultsFile)) {
        Write-Warn "No Jest results file produced -- skipping summary."
        return
    }
    try { $r = Get-Content $ResultsFile -Raw | ConvertFrom-Json }
    catch { Write-Warn "Could not parse Jest results: $_"; return }

    $pass = [int]$r.numPassedTests
    $fail = [int]$r.numFailedTests
    $skip = [int]$r.numPendingTests + [int]$r.numTodoTests
    $tot  = [int]$r.numTotalTests
    $sPass = [int]$r.numPassedTestSuites
    $sFail = [int]$r.numFailedTestSuites
    $sTot  = [int]$r.numTotalTestSuites

    $headerColor = if ($fail -gt 0) { 'Red' } else { 'Green' }

    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor $headerColor
    Write-Host "                     TEST SUMMARY                              " -ForegroundColor $headerColor
    Write-Host "===============================================================" -ForegroundColor $headerColor
    Write-Host (" Suites    : {0,3} passed, {1,3} failed, {2,3} total" -f $sPass, $sFail, $sTot)
    $failColor = if ($fail -gt 0) { 'Red' } else { 'DarkGray' }
    Write-Host " Tests     : " -NoNewline
    Write-Host ("{0,3} passed" -f $pass) -NoNewline -ForegroundColor Green
    Write-Host ", " -NoNewline
    Write-Host ("{0,3} failed" -f $fail) -NoNewline -ForegroundColor $failColor
    Write-Host ", " -NoNewline
    Write-Host ("{0,3} skipped" -f $skip) -NoNewline -ForegroundColor Yellow
    Write-Host (", {0,3} total" -f $tot)
    Write-Host (" Duration  : {0:N1}s" -f $ElapsedSeconds)

    # Per-suite breakdown grouped by top folder under src/tests.
    # Jest's per-file TestResult does NOT expose numPassingTests/numFailingTests
    # at this level -- count from assertionResults[].status instead.
    if ($r.testResults) {
        $byGroup = [ordered]@{}
        foreach ($t in $r.testResults) {
            # Normalise path separators, strip everything up to and including 'src/tests/'
            $norm = ($t.name -replace '\\', '/')
            $idx  = $norm.IndexOf('/src/tests/')
            if ($idx -lt 0) { continue }
            $rel  = $norm.Substring($idx + '/src/tests/'.Length)
            $group = ($rel -split '/')[0]
            if (-not $byGroup.Contains($group)) {
                $byGroup[$group] = @{ pass=0; fail=0; skip=0; total=0 }
            }
            foreach ($a in $t.assertionResults) {
                switch ($a.status) {
                    'passed'  { $byGroup[$group].pass++  }
                    'failed'  { $byGroup[$group].fail++  }
                    'pending' { $byGroup[$group].skip++  }
                    'todo'    { $byGroup[$group].skip++  }
                    'skipped' { $byGroup[$group].skip++  }
                }
                $byGroup[$group].total++
            }
        }
        if ($byGroup.Count -gt 0) {
            Write-Host " By suite  :"
            foreach ($k in $byGroup.Keys) {
                $g = $byGroup[$k]
                $color = if ($g.fail -gt 0) { 'Red' } else { 'Green' }
                Write-Host ("   {0,-15}  {1,3} passed  {2,3} failed  {3,3} skipped  {4,3} total" -f $k, $g.pass, $g.fail, $g.skip, $g.total) -ForegroundColor $color
            }
        }
    }

    # List failing tests (up to 10) for quick triage
    if ($fail -gt 0 -and $r.testResults) {
        Write-Host ""
        Write-Host " Failing tests:" -ForegroundColor Red
        $shown = 0
        foreach ($t in $r.testResults) {
            foreach ($a in $t.assertionResults) {
                if ($a.status -eq 'failed' -and $shown -lt 10) {
                    $ancestors = ($a.ancestorTitles -join ' > ')
                    Write-Host ("   - {0} > {1}" -f $ancestors, $a.title) -ForegroundColor Red
                    $shown++
                }
            }
        }
        if ($fail -gt $shown) { Write-Host ("   ... and {0} more" -f ($fail - $shown)) -ForegroundColor Red }
    }
    Write-Host "===============================================================" -ForegroundColor $headerColor
}

# ---- main ---------------------------------------------------------------
Write-Banner
Assert-StackHealthy
if (-not $NoProtect) {
    Backup-Databases
} else {
    Write-Phase "NoProtect flag set -- skipping backup (tests will run unprotected)."
}

$testsFailed = $false
$elapsed = 0.0

try {
    if ($DryRun) {
        Write-Phase "DryRun: skipping test execution."
    } else {
        Write-Phase "Running tests in tests/api ..."
        Push-Location $TestsDir
        try {
            if (Test-Path $ResultsFile) { Remove-Item $ResultsFile -Force }
            if ($OpenReport -and (Test-Path $ReportFile)) { Remove-Item $ReportFile -Force }
            if ($OpenReport) {
                $env:JEST_HTML_REPORTER_OUTPUT_PATH = $ReportFile
                $env:JEST_HTML_REPORTER_PAGE_TITLE  = "GEP-SCM API Tests ($Suite)"
                $env:JEST_HTML_REPORTER_INCLUDE_FAILURE_MSG = 'true'
                $env:JEST_HTML_REPORTER_INCLUDE_CONSOLE_LOG = 'true'
            }
            $jestBin = Get-JestBinary
            $jestArgs = Get-JestArgs
            Write-Host ("    jest {0}" -f ($jestArgs -join ' ')) -ForegroundColor DarkGray
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            & $jestBin @jestArgs
            $sw.Stop()
            $elapsed = $sw.Elapsed.TotalSeconds
            if ($LASTEXITCODE -ne 0) { $testsFailed = $true }
        } finally { Pop-Location }
    }
}
finally {
    if ($NoProtect) {
        Write-Phase "NoProtect flag set -- skipping restore (no backup was taken)."
    } elseif ($SkipRestore) {
        Write-Phase "SkipRestore flag set -- LEAVING DB IN POST-TEST STATE."
        Write-Warn "Backups remain at $BackupDir for manual restore."
    } else {
        try {
            Restore-Databases
            if (-not $KeepBackup) {
                Remove-Item -Recurse -Force $BackupDir -ErrorAction SilentlyContinue
                Write-OK "Backups deleted. Zero footprint left behind."
            } else {
                Write-OK "Backups retained at $BackupDir (-KeepBackup)"
            }
        } catch {
            Write-Fail "Restore error: $_"
            Show-ManualRestoreHelp
            exit 2
        }
    }
}

if (-not $DryRun) {
    Show-TestSummary -ElapsedSeconds $elapsed
    if (Test-Path $ResultsFile) { Remove-Item $ResultsFile -Force }

    if ($OpenReport) {
        if (Test-Path $ReportFile) {
            Write-Host ""
            Write-Host ("==> Opening HTML report: {0}" -f $ReportFile) -ForegroundColor Cyan
            try { Start-Process $ReportFile | Out-Null }
            catch { Write-Warn "Could not auto-open the report. Open manually: $ReportFile" }
        } else {
            Write-Warn "HTML report not generated. Did you run 'npm install' in tests/api after the package.json update?"
        }
    }
}

if ($DryRun) {
    Write-Host ""
    Write-Host "==> DryRun complete. Backup + restore pipeline OK." -ForegroundColor Green
    exit 0
}
if ($testsFailed) {
    Write-Host ""
    Write-Host "==> Tests FAILED. DB has been restored to pre-test state." -ForegroundColor Yellow
    exit 1
}
Write-Host ""
Write-Host "==> Tests PASSED. DB has been restored to pre-test state." -ForegroundColor Green
exit 0
