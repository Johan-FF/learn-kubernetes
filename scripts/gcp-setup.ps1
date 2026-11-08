<#
.SYNOPSIS
  Provisions the Google Cloud resources needed by chapter 3 of the course.

.DESCRIPTION
  Idempotent: every step checks whether the resource already exists before creating it.
  Requires an authenticated gcloud CLI (`gcloud auth login`) with permission to link billing and
  to create clusters, registries and buckets.

.EXAMPLE
  .\scripts\gcp-setup.ps1 -ProjectId project-74b28d99-70ba-47ca-9bc -BillingAccount 01D133-CFA0D3-D9B707
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$ProjectId,
  [Parameter(Mandatory)][string]$BillingAccount,
  [string]$Region = 'europe-north1',
  [string]$Zone = 'europe-north1-a',
  [string]$Cluster = 'dwk-cluster',
  [string]$Registry = 'dwk',
  [string]$Bucket = "$ProjectId-dwk-backups",
  [string]$MachineType = 'e2-small',
  [int]$Nodes = 2
)

# Native commands write warnings to stderr; those must not abort the script.
$ErrorActionPreference = 'Continue'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')

function Step($message) { Write-Host "== $message" -ForegroundColor Cyan }

Step "selecting project $ProjectId"
gcloud config set project $ProjectId 2>&1 | Out-Null

Step "linking billing account $BillingAccount"
gcloud billing projects link $ProjectId --billing-account=$BillingAccount 2>&1 | Out-Null
$billing = (gcloud billing projects describe $ProjectId --format="value(billingEnabled)" 2>&1 | Select-Object -Last 1)
Write-Host "   billing enabled: $billing"

Step "enabling APIs"
$apis = @(
  'container.googleapis.com',
  'compute.googleapis.com',
  'artifactregistry.googleapis.com',
  'storage.googleapis.com',
  'sqladmin.googleapis.com',
  'monitoring.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'iamcredentials.googleapis.com'
)
gcloud services enable @apis --project $ProjectId 2>&1 | Select-Object -Last 2

Step "creating Artifact Registry repository $Registry"
gcloud artifacts repositories describe $Registry --location $Region --format="value(name)" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud artifacts repositories create $Registry --repository-format=docker --location=$Region --description="Course project images" 2>&1 | Select-Object -Last 2
}
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet 2>&1 | Out-Null

Step "creating bucket gs://$Bucket"
gcloud storage buckets describe "gs://$Bucket" --format="value(name)" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud storage buckets create "gs://$Bucket" --location=$Region --uniform-bucket-level-access 2>&1 | Select-Object -Last 2
}

Step "creating the GKE cluster $Cluster"
gcloud container clusters describe $Cluster --zone $Zone --format="value(name)" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud container clusters create $Cluster `
    --zone=$Zone `
    --num-nodes=$Nodes `
    --machine-type=$MachineType `
    --disk-size=20GB `
    --enable-ip-alias `
    --release-channel=regular 2>&1 | Select-Object -Last 3
}

Step "fetching credentials"
gcloud container clusters get-credentials $Cluster --zone=$Zone 2>&1 | Out-Null
kubectl get nodes 2>&1

Write-Host ""
Write-Host "done. Project=$ProjectId Region=$Region Zone=$Zone Cluster=$Cluster" -ForegroundColor Green
Write-Host "registry prefix: $Region-docker.pkg.dev/$ProjectId/$Registry" -ForegroundColor Green
Write-Host "bucket: gs://$Bucket" -ForegroundColor Green
