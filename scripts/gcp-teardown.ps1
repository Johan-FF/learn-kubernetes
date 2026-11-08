<#
.SYNOPSIS
  Deletes every paid resource created for chapter 3 so the free credits stop draining.

.DESCRIPTION
  Keeps the project, the Artifact Registry metadata and the bucket contents unless -Purge is
  passed. Run this as soon as the GKE exercises are graded or when you stop working on them.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$ProjectId,
  [string]$Zone = 'europe-north1-a',
  [string]$Cluster = 'dwk-cluster',
  [string]$SqlInstance = 'dwk-postgres',
  [switch]$Purge
)

$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')

gcloud config set project $ProjectId | Out-Null

Write-Host "== deleting the GKE cluster $Cluster" -ForegroundColor Cyan
gcloud container clusters delete $Cluster --zone $Zone --quiet 2>$null

Write-Host "== deleting the Cloud SQL instance $SqlInstance" -ForegroundColor Cyan
gcloud sql instances delete $SqlInstance --quiet 2>$null

if ($Purge) {
  Write-Host "== deleting the images" -ForegroundColor Cyan
  gcloud artifacts repositories delete dwk --location $Zone --quiet 2>$null
}

Write-Host "done. Check the billing page to confirm nothing is left running." -ForegroundColor Green
