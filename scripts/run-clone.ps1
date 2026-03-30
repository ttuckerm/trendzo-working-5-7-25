param(
  [string]$Url = "https://os.ryo.lu/",
  [ValidateSet('crawl','batch')]
  [string]$Mode = 'crawl'
)

$ErrorActionPreference = "Stop"

$k = $env:FIRECRAWL_API_KEY
if ([string]::IsNullOrWhiteSpace($k)) { $k = [Environment]::GetEnvironmentVariable('FIRECRAWL_API_KEY','User') }
if ([string]::IsNullOrWhiteSpace($k)) { $k = [Environment]::GetEnvironmentVariable('FIRECRAWL_API_KEY','Machine') }
if ([string]::IsNullOrWhiteSpace($k)) {
  Write-Error "FIRECRAWL_API_KEY not found in Process/User/Machine. Run: setx FIRECRAWL_API_KEY \"fc-PASTE_KEY\" then re-run this script."
  exit 1
}

$env:FIRECRAWL_API_KEY = $k
Write-Host ("Using key: " + $k.Substring(0,3) + "..." + $k.Substring($k.Length-4))

if ($Mode -eq 'batch') {
  Write-Host "[clone] Running batch mode (homepage + internal links)."
  node scripts/clone-site-firecrawl.js batch $Url
  exit $LASTEXITCODE
}

node scripts/clone-site-firecrawl.js start $Url
Write-Host "Crawl started. Polling for completion..."
node scripts/clone-site-firecrawl.js poll $Url
