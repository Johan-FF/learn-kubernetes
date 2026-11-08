<#
.SYNOPSIS
  Renders the CNCF landscape marking for exercise 5.8 as a PNG.

.DESCRIPTION
  The list in README.md is the source of truth; this script draws the same grouping so the image
  and the text cannot drift apart.
#>
[CmdletBinding()]
param(
  [string]$Output = 'landscape/landscape.png'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$Output = Join-Path $root $Output

$direct = @(
  'Kubernetes', 'k3s', 'Helm', 'Prometheus', 'Grafana', 'Loki', 'NATS',
  'Argo CD', 'Argo Rollouts', 'Istio', 'Knative', 'containerd', 'CoreDNS'
)

$indirect = @(
  'Flannel', 'Envoy', 'etcd', 'kube-state-metrics', 'node-exporter'
)

Add-Type -AssemblyName System.Drawing

$width = 1100
$lineHeight = 30
$headerHeight = 96
$rows = [Math]::Max($direct.Count, $indirect.Count)
$height = $headerHeight + (($rows + 1) * $lineHeight) + 40

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.TextRenderingHint = 'AntiAliasGridFit'

$bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 20, 24))
$head = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 31, 38))
$text = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 234, 237))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 158, 168))
$directBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(94, 190, 255))
$indirectBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 178, 84))

$graphics.FillRectangle($bg, 0, 0, $width, $height)
$graphics.FillRectangle($head, 0, 0, $width, $headerHeight)

$title = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Bold)
$small = New-Object System.Drawing.Font('Segoe UI', 9)
$body = New-Object System.Drawing.Font('Consolas', 11)

$graphics.DrawString('CNCF landscape - what this project uses', $title, $text, 24, 16)
$graphics.DrawString('circle = used directly        circle in a second colour = dependency of something used', $small, $muted, 24, 50)

$graphics.DrawString('Used directly', $title, $directBrush, 40, $headerHeight - 6)
$graphics.DrawString('Used indirectly', $title, $indirectBrush, 560, $headerHeight - 6)

$y = $headerHeight + 40
foreach ($item in $direct) {
  $graphics.DrawEllipse((New-Object System.Drawing.Pen($directBrush, 2)), 44, $y + 4, 16, 16)
  $graphics.DrawString($item, $body, $text, 74, $y)
  $y += $lineHeight
}

$y = $headerHeight + 40
foreach ($item in $indirect) {
  $graphics.DrawEllipse((New-Object System.Drawing.Pen($indirectBrush, 2)), 564, $y + 4, 16, 16)
  $graphics.DrawString($item, $body, $text, 594, $y)
  $y += $lineHeight
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Output) | Out-Null
$bitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "saved $Output" -ForegroundColor Green
