<#
.SYNOPSIS
  Captures the project's GKE logs from Cloud Logging and renders them as a PNG.

.DESCRIPTION
  The course asks for a picture of the logs when a new todo is created (exercise 3.12).
  This script reads the real log entries through `gcloud logging read` and renders them into an
  image so the repository holds a durable artefact instead of a screenshot of a console tab.

.EXAMPLE
  .\scripts\gke-log-screenshot.ps1 -Output "project/logs/todo-created.png"
#>
[CmdletBinding()]
param(
  [string]$ProjectId = 'project-74b28d99-70ba-47ca-9bc',
  [string]$Namespace = 'project',
  [string]$Container = 'todo-backend',
  [string]$Filter = 'A todo was created',
  [int]$Limit = 12,
  [string]$Output = 'project/logs/todo-created.png'
)

$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$root = Split-Path -Parent $PSScriptRoot
$Output = Join-Path $root $Output

$query = @"
resource.type="k8s_container"
resource.labels.namespace_name="$Namespace"
resource.labels.container_name="$Container"
textPayload:"$Filter"
"@

Write-Host "== reading logs from Cloud Logging" -ForegroundColor Cyan
$raw = gcloud logging read $query --project $ProjectId --limit $Limit --format=json --order=desc 2>&1 | Out-String
$entries = $raw | ConvertFrom-Json
if (-not $entries) { throw 'no log entries matched the filter' }

$lines = foreach ($e in $entries) {
  $ts = ([datetime]$e.timestamp).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss')
  "$ts  $($e.textPayload)"
}

Add-Type -AssemblyName System.Drawing

$width = 1180
$lineHeight = 26
$headerHeight = 74
$height = $headerHeight + ($lines.Count * $lineHeight) + 30

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.TextRenderingHint = 'AntiAliasGridFit'

$background = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 33, 36))
$header = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(23, 23, 25))
$text = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 234, 237))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(154, 160, 166))
$accent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(138, 180, 248))

$graphics.FillRectangle($background, 0, 0, $width, $height)
$graphics.FillRectangle($header, 0, 0, $width, $headerHeight)

$titleFont = New-Object System.Drawing.Font('Segoe UI', 15, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font('Segoe UI', 9)
$monoFont = New-Object System.Drawing.Font('Consolas', 10)

$graphics.DrawString('Logs Explorer  —  GKE', $titleFont, $text, 20, 12)
$graphics.DrawString("cluster dwk-cluster · namespace $Namespace · container $Container", $smallFont, $muted, 20, 42)
$graphics.DrawString("filter: $Filter", $smallFont, $accent, 640, 42)

$y = $headerHeight + 12
foreach ($line in $lines) {
  $graphics.DrawString($line, $monoFont, $text, 22, $y)
  $y += $lineHeight
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Output) | Out-Null
$bitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "saved $Output" -ForegroundColor Green
