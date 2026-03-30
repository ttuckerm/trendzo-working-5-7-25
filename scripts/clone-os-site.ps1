param(
  [string]$BaseUrl = 'https://os.ryo.lu',
  [string]$OutDir = 'snapshots\os.ryo.lu\site'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Join-Url([string]$base, [string]$path) {
  if ([string]::IsNullOrWhiteSpace($path)) { return "$base/" }
  if ($path.StartsWith('http://') -or $path.StartsWith('https://')) { return $path }
  if ($path.StartsWith('/')) { return "$base$path" }
  if ($path.StartsWith('./')) { return "$base/" + $path.Substring(2) }
  return "$base/$path"
}

function Ensure-Directory([string]$path) {
  $dir = Split-Path -Parent $path
  if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
}

function Get-IfNeeded([string]$url, [string]$dest) {
  if (-not (Test-Path -LiteralPath $dest)) {
    Ensure-Directory $dest
    try {
      Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $dest -TimeoutSec 60 | Out-Null
    } catch {
      Write-Warning "Failed to download $url -> $($dest): $($_.Exception.Message)"
    }
  }
}

function Rewrite-AndGetAssets([string]$html, [string]$baseUrl, [string]$outDir) {
  # Collect asset URLs from href/src attributes (basic pass)
  $attrMatches = [System.Text.RegularExpressions.Regex]::Matches($html, '(?i)(href|src)="([^"]+)"')
  $assetUrls = New-Object System.Collections.Generic.HashSet[string]
  foreach ($m in $attrMatches) {
    $u = $m.Groups[2].Value
    if ([string]::IsNullOrWhiteSpace($u)) { continue }
    if ($u.StartsWith('data:')) { continue }
    if ($u.StartsWith('mailto:') -or $u.StartsWith('tel:')) { continue }
    if ($u.StartsWith('https://os.ryo.lu/')) { [void]$assetUrls.Add($u) }
    elseif ($u.StartsWith('/')) { [void]$assetUrls.Add((Join-Url $baseUrl $u)) }
  }

  foreach ($a in $assetUrls) {
    $rel = $a.Replace($baseUrl + '/', '')
    $dest = Join-Path $outDir $rel
    Get-IfNeeded -url $a -dest $dest
  }

  # Basic HTML rewrites for local assets
  $modified = $html
  $modified = $modified -replace [System.Text.RegularExpressions.Regex]::Escape($baseUrl + '/'), './'
  $modified = $modified -replace 'href="\/', 'href="'
  $modified = $modified -replace 'src="\/', 'src="'
  return $modified
}

$pages = @('', 'ipod', 'chats')
if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

foreach ($p in $pages) {
  $url = Join-Url $BaseUrl $p
  $name = if ([string]::IsNullOrWhiteSpace($p)) { 'index' } else { $p }
  $outFile = Join-Path $OutDir ($name + '.html')
  Write-Host "Fetching $url"
  $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 60
  $html = $resp.Content
  $modified = Rewrite-AndGetAssets -html $html -baseUrl $BaseUrl -outDir $OutDir
  Ensure-Directory $outFile
  [System.IO.File]::WriteAllText($outFile, $modified, [System.Text.Encoding]::UTF8)
}

Write-Host "Clone complete -> $OutDir"


