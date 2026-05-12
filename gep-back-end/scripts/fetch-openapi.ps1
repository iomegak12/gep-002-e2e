# Fetch OpenAPI specs from the three running services into docs/api/*.json.
# Requires `docker compose up -d` first.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "docs/api"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$specs = @(
  @{ Name = "iam";      Url = "http://localhost:3001/api/v1/openapi.json" },
  @{ Name = "supplier"; Url = "http://localhost:3002/api/v1/openapi.json" },
  @{ Name = "po";       Url = "http://localhost:3003/api/v1/openapi.json" }
)

foreach ($s in $specs) {
  $out = Join-Path $outDir "$($s.Name).json"
  Write-Host "Fetching $($s.Name) -> $out"
  try {
    Invoke-WebRequest -Uri $s.Url -OutFile $out -UseBasicParsing
  } catch {
    Write-Error "Failed to fetch $($s.Url). Is 'docker compose up -d' running and healthy? $_"
    exit 1
  }
}

Write-Host "OK. Wrote $($specs.Count) specs to $outDir"
