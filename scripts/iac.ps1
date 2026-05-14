#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Thin wrapper around `terraform` for the iac/ stack (Azure VM + GEP prod stack).

.DESCRIPTION
    Runs a single terraform action against the modularized stack under iac/.
    Used by devops.ps1 menu option 5.

.PARAMETER Action
    init | plan | apply | destroy | output | ssh
    - init    : terraform init (downloads providers, sets up modules)
    - plan    : terraform plan (-out tf.plan)
    - apply   : terraform apply (uses tf.plan if present, else -auto-approve)
    - destroy : terraform destroy
    - output  : prints non-sensitive outputs (ssh_command, web_url, etc.)
    - ssh     : reads ssh_command from terraform output and runs it

.PARAMETER AutoApprove
    Pass -auto-approve to apply/destroy (skips the interactive y/N prompt).

.EXAMPLE
    ./scripts/iac.ps1 -Action plan
    ./scripts/iac.ps1 -Action apply -AutoApprove
    ./scripts/iac.ps1 -Action ssh
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('init', 'plan', 'apply', 'destroy', 'output', 'ssh')]
    [string]$Action,

    [switch]$AutoApprove
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$IacDir   = Join-Path $RepoRoot 'iac'
$PlanFile = Join-Path $IacDir   'tf.plan'

if (-not (Test-Path $IacDir)) {
    throw "iac directory not found: $IacDir"
}

if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    throw "terraform CLI not found in PATH. Install from https://developer.hashicorp.com/terraform/install"
}

Push-Location $IacDir
try {
    switch ($Action) {
        'init' {
            terraform init -input=false
        }
        'plan' {
            if (-not (Test-Path '.terraform')) { terraform init -input=false }
            terraform plan -out $PlanFile
        }
        'apply' {
            if (-not (Test-Path '.terraform')) { terraform init -input=false }
            if (Test-Path $PlanFile) {
                Write-Host "Applying saved plan: $PlanFile" -ForegroundColor Cyan
                terraform apply $PlanFile
                Remove-Item $PlanFile -Force -ErrorAction SilentlyContinue
            }
            else {
                $args = @('apply')
                if ($AutoApprove) { $args += '-auto-approve' }
                terraform @args
            }
            Write-Host ""
            Write-Host "----- KEY OUTPUTS -----" -ForegroundColor Cyan
            terraform output ssh_command
            terraform output web_url
            terraform output fqdn
            terraform output admin_cidr_used
        }
        'destroy' {
            $args = @('destroy')
            if ($AutoApprove) { $args += '-auto-approve' }
            terraform @args
        }
        'output' {
            terraform output
        }
        'ssh' {
            $cmd = (terraform output -raw ssh_command).Trim()
            if ([string]::IsNullOrWhiteSpace($cmd)) {
                throw "ssh_command output is empty. Run apply first."
            }
            Write-Host "Running: $cmd" -ForegroundColor Cyan
            & cmd /c $cmd
        }
    }
}
finally {
    Pop-Location
}
