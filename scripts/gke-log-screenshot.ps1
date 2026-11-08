<#
.SYNOPSIS
  Captures the project's GKE logs from Cloud Logging and renders them as a PNG.

.DESCRIPTION
  The course asks for a picture of the logs when a new todo is created (exercise 3.12).
  This script reads the real log entries through `gcloud logging read` and renders them into an
  image so the repository holds a durable artefact instead of a screenshot of a console tab.

  The output uses gcloud's tab separated `value()` format and the text match happens here,
  because passing filters with spaces through PowerShell to gcloud is unreliable.

.EXAMPLE
  .\scripts\gke-log-screenshot.ps1 -Filter "created todo" -Output "project/logs/todo-created.png"
#>
[CmdletBinding()]
param(
  [string]$ProjectId = 'project-74b28d99-70ba-47ca-9bc',
  [string]$Namespace = 'project',
  [string]$Container = 'todo-backend',
  [string]$Filter = 'created todo',
  [int]$Limit = 10,
  [string]$Output = 'project/logs/todo-created.png'
)

$ErrorActionPreference = 'Stop'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$root = Split-Path -Parent $PSScriptRoot
$Output = Join-Path $root $Output

$query = "resource.labels.namespace_name=`"$Namespace`" AND resource.labels.container_name=`"$Container`""

Write-Host "== reading logs from Cloud Logging" -ForegroundColor Cyan
$raw = gcloud logging read $query --project $ProjectId --limit 400 --format="value(timestamp,textPayload)" 2>&1

$lines = New-Object System.Collections.Generic.List[string]
foreach ($line in $raw) {
  if ($null -eq $line) { continue }
  $line = $line.ToString().Trim()
  if ($line -eq '') { continue }
  if ($line -notlike "*$Filter*") { continue }

  $parts = $line -split "`t", 2
  $stamp = $parts[0]
  $message = if ($parts.Count -gt 1) { $parts[1] } else { '' }
  if ($stamp.Length -ge 19) { $stamp = ($stamp -replace 'T', ' ').Substring(0, 19) }
  $lines.Add("$stamp  $message")
  if ($lines.Count -ge $Limit) { break }
}

if ($lines.Count -eq 0) { throw "no log entries contained '$Filter'" }
Write-Host "   keeping $($lines.Count) entries" -ForegroundColor Cyan

Add-Type -AssemblyName System.Drawing

$width = 1180
$lineHeight = 26
$headerHeight = 78
$height = $headerHeight + ($lines.Count * $lineHeight) + 34

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

$graphics.DrawString('Logs Explorer  -  GKE', $titleFont, $text, 20, 12)
$graphics.DrawString("cluster dwk-cluster - namespace $Namespace - container $Container", $smallFont, $muted, 20, 44)
$graphics.DrawString("match: $Filter", $smallFont, $accent, 700, 44)

$y = $headerHeight + 14
foreach ($line in $lines) {
  $graphics.DrawString($line, $monoFont, $text, 22, $y)
  $y += $lineHeight
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Output) | Out-Null
$bitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "saved $Output ($($lines.Count) entries)" -ForegroundColor Green
