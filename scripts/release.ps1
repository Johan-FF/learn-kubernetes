<#
.SYNOPSIS
  Builds, loads, deploys, commits and tags one course exercise.

.DESCRIPTION
  Every exercise of the DevOps with Kubernetes course ends with a git tag named after the
  exercise number (and, when publishing, a GitHub release with the same name).

  The script never pushes unless -Publish is passed, so tagging stays a local, reversible
  operation until the submission remote is ready.

.EXAMPLE
  .\scripts\release.ps1 -Exercise 1.1 -App log_output -Manifests log_output/manifests

.EXAMPLE
  .\scripts\release.ps1 -Exercise 1.9 -App ping_pong -Manifests ping_pong/manifests -Namespace exercises
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Exercise,
  [Parameter(Mandatory)][string]$App,
  [string]$Manifests,
  [string]$Cluster = 'devops',
  [string]$Namespace = 'default',
  [string]$Message,
  [string]$Paths,
  [switch]$SkipBuild,
  [switch]$SkipDeploy,
  [switch]$SkipCommit,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$image = "${App}:${Exercise}"
if (-not $Manifests) { $Manifests = Join-Path $App 'manifests' }
if (-not $Message) { $Message = "feat(exercises): exercise $Exercise ($App)" }

if (-not $SkipBuild) {
  Write-Host "== building $image" -ForegroundColor Cyan
  docker build -t $image $App
  if ($LASTEXITCODE -ne 0) { throw "docker build failed for $App" }
}

if (-not $SkipDeploy) {
  Write-Host "== loading $image into k3d cluster '$Cluster'" -ForegroundColor Cyan
  k3d image import $image -c $Cluster
  if ($LASTEXITCODE -ne 0) { throw "k3d image import failed for $image" }

  Write-Host "== applying $Manifests in namespace '$Namespace'" -ForegroundColor Cyan
  kubectl apply -n $Namespace -f $Manifests
  if ($LASTEXITCODE -ne 0) { throw "kubectl apply failed for $Manifests" }
}

if (-not $SkipCommit) {
  Write-Host "== committing and tagging $Exercise" -ForegroundColor Cyan
  if (-not $Paths) { $Paths = "$App,README.md" }
  $pathList = $Paths -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  git add -- @pathList
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw "git commit failed" }

  git tag -a $Exercise -m "Exercise $Exercise"
  if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
}

if ($Publish) {
  Write-Host "== publishing $Exercise" -ForegroundColor Cyan
  git push origin main
  git push origin $Exercise
  gh release create $Exercise --title $Exercise --notes "Exercise $Exercise"
}

Write-Host "done: $Exercise" -ForegroundColor Green
