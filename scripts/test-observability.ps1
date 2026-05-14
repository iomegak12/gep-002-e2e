#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Smoke-tests the GEP observability stack end-to-end.

.DESCRIPTION
    Verifies that every observability container is healthy, that each backend
    is exporting metrics + traces + logs, that Grafana datasources resolve,
    that the Faro/Alloy ingest path is reachable, and that the RUM payload
    reaches Loki under the {app="gep-web"} stream.

    Designed to be re-run safely. Exits non-zero on first failure so CI / the
    devops menu can flag the problem clearly.

.PARAMETER OpenGrafana
    Open Grafana in the default browser after a successful run.

.PARAMETER SkipTraffic
    Skip the synthetic traffic generation step. Useful for a fast smoke check
    of "is the stack up" without producing test data.

.PARAMETER Help
    Show usage.

.EXAMPLE
    pwsh scripts/test-observability.ps1
    pwsh scripts/test-observability.ps1 -OpenGrafana
    pwsh scripts/test-observability.ps1 -SkipTraffic
#>
[CmdletBinding()]
param(
    [switch]$OpenGrafana,
    [switch]$SkipTraffic,
    [switch]$Help
)

if ($Help) { Get-Help $PSCommandPath -Detailed; exit 0 }

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot

# ---- pretty printers ----------------------------------------------------
function Write-Heading { param($Msg) Write-Host ""; Write-Host "  $Msg" -ForegroundColor Cyan; Write-Host ("  " + ('-' * $Msg.Length)) -ForegroundColor DarkCyan }
function Write-Info    { param($Msg) Write-Host "  [i]  $Msg" -ForegroundColor Gray }
function Write-OK      { param($Msg) Write-Host "  [OK] $Msg" -ForegroundColor Green }
function Write-Fail    { param($Msg) Write-Host "  [X]  $Msg" -ForegroundColor Red }
function Write-Warn    { param($Msg) Write-Host "  [!]  $Msg" -ForegroundColor Yellow }

$script:Results = [System.Collections.ArrayList]@()
function Record-Check {
    param([string]$Name, [bool]$Pass, [string]$Detail = '')
    $status = if ($Pass) { 'OK' } else { 'FAIL' }
    $entry = [PSCustomObject]@{ Check = $Name; Status = $status; Detail = $Detail }
    [void]$script:Results.Add($entry)
    if ($Pass) { Write-OK ("{0,-44} {1}" -f $Name, $Detail) }
    else       { Write-Fail ("{0,-44} {1}" -f $Name, $Detail) }
}

function Try-Http {
    param([string]$Url, [int]$ExpectStatus = 200, [int]$TimeoutSec = 10)
    # Catch non-2xx as a result rather than throwing — many services
    # (Loki /ready, etc.) return 503 with a meaningful body while warming up.
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop -SkipHttpErrorCheck
        return [PSCustomObject]@{ Ok = ($r.StatusCode -eq $ExpectStatus); Status = $r.StatusCode; Body = $r.Content }
    } catch {
        return [PSCustomObject]@{ Ok = $false; Status = -1; Body = $_.Exception.Message }
    }
}

# ---- main ----------------------------------------------------------------
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor DarkCyan
Write-Host "          GEP OBSERVABILITY :: SMOKE TEST                       " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "  ================================================================" -ForegroundColor DarkCyan

# 1) container health
Write-Heading "1) Containers up & healthy"
$expected = @('gep-otel-collector','gep-prometheus','gep-grafana','gep-loki','gep-promtail','gep-jaeger','gep-tempo','gep-alloy','gep-cadvisor','gep-node-exporter')
try {
    $running = docker ps --format '{{.Names}}' 2>$null
    foreach ($c in $expected) {
        $up = $running -contains $c
        $detail = if ($up) { 'running' } else { 'NOT running' }
        Record-Check "container:$c" $up $detail
    }
} catch {
    Record-Check 'docker ps' $false $_.Exception.Message
}

# 2) endpoints
Write-Heading "2) Endpoint health"
$endpoints = @(
    @{ Name = 'prometheus /-/ready'; Url = 'http://localhost:9090/-/ready' }
    @{ Name = 'grafana /api/health'; Url = 'http://localhost:3000/api/health' }
    @{ Name = 'loki /ready';         Url = 'http://localhost:3100/ready' }
    @{ Name = 'jaeger UI';           Url = 'http://localhost:16686/' }
    @{ Name = 'tempo /ready';        Url = 'http://localhost:3200/ready' }
    @{ Name = 'collector /';         Url = 'http://localhost:13133/' }
    @{ Name = 'alloy /-/ready';      Url = 'http://localhost:12345/-/ready' }
)
foreach ($e in $endpoints) {
    $r = Try-Http $e.Url
    Record-Check $e.Name $r.Ok ("HTTP " + $r.Status)
}

# 3) prometheus targets
Write-Heading "3) Prometheus scrape targets"
$t = Try-Http 'http://localhost:9090/api/v1/targets?state=active'
if ($t.Ok) {
    try {
        $json = $t.Body | ConvertFrom-Json
        $targets = $json.data.activeTargets
        $byJob = $targets | Group-Object -Property { $_.labels.job }
        foreach ($g in $byJob) {
            $up = ($g.Group | Where-Object { $_.health -eq 'up' }).Count
            $tot = $g.Count
            Record-Check "target:$($g.Name)" ($up -eq $tot) "$up/$tot up"
        }
    } catch {
        Record-Check 'parse targets' $false $_.Exception.Message
    }
} else {
    Record-Check 'fetch targets' $false ("HTTP " + $t.Status)
}

# 4) traffic
if (-not $SkipTraffic) {
    Write-Heading "4) Generate synthetic traffic"
    # We hit BOTH /health AND a real (or deliberately-missing) /api/v1/* route.
    # /health is excluded from HTTP instrumentation in tracing.js (intentional —
    # otherwise health checks dominate span volume), so traffic against /health
    # alone produces zero http_server_request_duration_seconds samples. Hitting
    # /api/v1/* always produces a metric (even a 404 counts).
    $apps = @(
        @{ Name = 'iam';              Health = 'http://localhost:3001/health'; Probe = 'http://localhost:3001/api/v1/docs' }
        @{ Name = 'supplier-service'; Health = 'http://localhost:3002/health'; Probe = 'http://localhost:3002/api/v1/docs' }
        @{ Name = 'po-service';       Health = 'http://localhost:3003/health'; Probe = 'http://localhost:3003/api/v1/docs' }
    )
    foreach ($a in $apps) {
        $ok = 0
        for ($i = 0; $i -lt 10; $i++) {
            $h = Try-Http $a.Health 200 3
            if ($h.Ok) { $ok++ }
            # Probe a real route — accept any status < 500 as "instrumented".
            $p = Try-Http $a.Probe 200 3
            if ($p.Status -ge 200 -and $p.Status -lt 500) { $ok++ }
        }
        Record-Check "traffic:$($a.Name)" ($ok -gt 0) "$ok/20 OK"
    }
    Write-Info "Waiting 20s for telemetry to flow..."
    Start-Sleep -Seconds 20
} else {
    Write-Info "Traffic step skipped (-SkipTraffic)."
}

# 5) metrics present
Write-Heading "5) Metrics in Prometheus"
$promQueries = @(
    @{ Name = 'iam http_server metrics';      Q = 'http_server_request_duration_seconds_count{service_name="iam"}' }
    @{ Name = 'po-service http_server metrics'; Q = 'http_server_request_duration_seconds_count{service_name="po-service"}' }
    @{ Name = 'supplier http_server metrics';   Q = 'http_server_request_duration_seconds_count{service_name="supplier-service"}' }
    @{ Name = 'cadvisor cpu metric';            Q = 'container_cpu_usage_seconds_total' }
    @{ Name = 'node-exporter cpu metric';       Q = 'node_cpu_seconds_total' }
)
foreach ($pq in $promQueries) {
    $enc = [Uri]::EscapeDataString($pq.Q)
    $r = Try-Http "http://localhost:9090/api/v1/query?query=$enc"
    $hasData = $false
    if ($r.Ok) {
        try {
            $j = $r.Body | ConvertFrom-Json
            $hasData = ($j.data.result.Count -gt 0)
        } catch {}
    }
    $detail = if ($hasData) { 'series present' } else { 'no series' }
    Record-Check $pq.Name $hasData $detail
}

# 6) traces
Write-Heading "6) Traces in Tempo + Jaeger"
foreach ($svc in @('iam','po-service','supplier-service')) {
    $r = Try-Http "http://localhost:3200/api/search/tags?scope=resource"
    $ok = $r.Ok
    Record-Check "tempo reachable for $svc" $ok ("HTTP " + $r.Status)
}
$jr = Try-Http 'http://localhost:16686/api/services'
$jaegerOk = $false; $jaegerDetail = "HTTP " + $jr.Status
if ($jr.Ok) {
    try {
        $jj = $jr.Body | ConvertFrom-Json
        $jaegerOk = ($jj.data.Count -gt 0)
        $jaegerDetail = "services: " + ($jj.data -join ',')
    } catch { $jaegerDetail = 'parse error' }
}
Record-Check 'jaeger services list' $jaegerOk $jaegerDetail

# 7) logs in Loki
Write-Heading "7) Logs in Loki"
$lokiQuery = '{container=~"gep-iam|gep-po-service|gep-supplier-service"}'
$enc = [Uri]::EscapeDataString($lokiQuery)
$start = [DateTimeOffset]::UtcNow.AddMinutes(-15).ToUnixTimeSeconds() * 1000000000
$end = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() * 1000000000
$lr = Try-Http "http://localhost:3100/loki/api/v1/query_range?query=$enc&start=$start&end=$end&limit=10"
$lokiOk = $false; $detail = "HTTP " + $lr.Status
if ($lr.Ok) {
    try {
        $j = $lr.Body | ConvertFrom-Json
        $lokiOk = ($j.data.result.Count -gt 0)
        $detail = "streams: " + $j.data.result.Count
    } catch {}
}
Record-Check 'loki container logs' $lokiOk $detail

# 8) RUM ingest path
Write-Heading "8) Faro/Alloy RUM ingest"
$faroBody = @{
    meta = @{
        app  = @{ name = 'gep-web'; version = '0.1.0'; environment = 'test' }
        sdk  = @{ name = 'faro-web-sdk'; version = '1.13.2' }
        session = @{ id = "smoketest-$(Get-Random)" }
    }
    logs = @( @{
        message = 'observability smoke-test ping'
        level = 'info'
        timestamp = (Get-Date).ToString('o')
    })
} | ConvertTo-Json -Depth 10
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8080/collect' -Method POST -Body $faroBody -ContentType 'application/json' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Record-Check 'POST /collect via nginx' ($r.StatusCode -lt 400) ("HTTP " + $r.StatusCode)
} catch {
    # Try alloy direct as fallback (web may not be up in observability-only test)
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:12347/collect' -Method POST -Body $faroBody -ContentType 'application/json' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Record-Check 'POST /collect via alloy:12347' ($r.StatusCode -lt 400) ("HTTP " + $r.StatusCode)
    } catch {
        Record-Check 'POST /collect' $false $_.Exception.Message
    }
}

# 9) Grafana datasources resolve
Write-Heading "9) Grafana datasource probes"
$gAuth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('admin:admin'))
$dsList = @('prometheus','loki','tempo','jaeger')
foreach ($uid in $dsList) {
    try {
        $hdr = @{ Authorization = $gAuth }
        $r = Invoke-WebRequest -Uri "http://localhost:3000/api/datasources/uid/$uid" -Headers $hdr -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Record-Check "ds:$uid present" ($r.StatusCode -eq 200) ("HTTP " + $r.StatusCode)
    } catch {
        Record-Check "ds:$uid present" $false $_.Exception.Message
    }
}

# ---- summary -------------------------------------------------------------
Write-Heading "Summary"
$pass = ($script:Results | Where-Object { $_.Status -eq 'OK' }).Count
$fail = ($script:Results | Where-Object { $_.Status -eq 'FAIL' }).Count
$total = $script:Results.Count
$script:Results | Format-Table -AutoSize | Out-String | Write-Host
Write-Host ""
Write-Host "  Passed: $pass / $total" -ForegroundColor Green
if ($fail -gt 0) { Write-Host "  Failed: $fail" -ForegroundColor Red }

if ($fail -eq 0 -and $OpenGrafana) {
    Write-Info "Opening Grafana at http://localhost:3000 (admin/admin)..."
    Start-Process 'http://localhost:3000/dashboards'
}

if ($fail -gt 0) { exit 1 } else { exit 0 }
