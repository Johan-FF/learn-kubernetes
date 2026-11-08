<#
.SYNOPSIS
  Builds an application image and pushes it to Artifact Registry so GKE can pull it.

.EXAMPLE
  .\scripts\push-image.ps1 -App ping_pong -Tag 3.1
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$App,
  [Parameter(Mandatory)][string]$Tag,
  [string]$Context,
  [string]$Dockerfile = 'Dockerfile',
  [string]$Registry = 'europe-north1-docker.pkg.dev/project-74b28d99-70ba-47ca-9bc/dwk'
)

$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$root = Split-Path -Parent $PSScriptRoot
if (-not $Context) { $Context = Join-Path $root $App }

$imageName = ($App -replace '_','-') -replace '/','-'
$image = "$Registry/$imageName`:$Tag"
Write-Host "== building $image" -ForegroundColor Cyan
docker build -t $image -f (Join-Path $Context $Dockerfile) $Context
if ($LASTEXITCODE -ne 0) { throw "docker build failed for $App" }

Write-Host "== pushing $image" -ForegroundColor Cyan
docker push $image
if ($LASTEXITCODE -ne 0) { throw "docker push failed for $image" }

Write-Host "done: $image" -ForegroundColor Green
