Write-Host "🔥 QUICK EMERGENCY BACKUP 🔥" -ForegroundColor Yellow
Write-Host "Creating backups in current directory..." -ForegroundColor Green

$timestamp = Get-Date -Format "MMdd-HHmm"

# Create Git bundle backup
Write-Host "Creating Git bundle..." -ForegroundColor Cyan
git bundle create "CLEANCOPY-BUNDLE-$timestamp.bundle" --all
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git bundle created: CLEANCOPY-BUNDLE-$timestamp.bundle" -ForegroundColor Green
    $bundleSize = [math]::Round((Get-Item "CLEANCOPY-BUNDLE-$timestamp.bundle").Length / 1MB, 1)
    Write-Host "   Size: ${bundleSize} MB" -ForegroundColor Gray
}

# Create source ZIP
Write-Host "Creating source code backup..." -ForegroundColor Cyan
$sourceFiles = @("src", "public", "docs", "scripts", "supabase", "tasks", "*.json", "*.md")
$sourceFiles = $sourceFiles | Where-Object { Test-Path $_ }

if ($sourceFiles.Count -gt 0) {
    Compress-Archive -Path $sourceFiles -DestinationPath "CLEANCOPY-SOURCE-$timestamp.zip" -Force
    Write-Host "✅ Source backup created: CLEANCOPY-SOURCE-$timestamp.zip" -ForegroundColor Green
    $zipSize = [math]::Round((Get-Item "CLEANCOPY-SOURCE-$timestamp.zip").Length / 1MB, 1)
    Write-Host "   Size: ${zipSize} MB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📍 BACKUP LOCATION: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📂 Your backup files:" -ForegroundColor Cyan
Get-ChildItem "*CLEANCOPY*" | ForEach-Object {
    Write-Host "   $($_.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "🔒 TO SAVE TO DESKTOP:" -ForegroundColor Yellow  
Write-Host "   1. Open File Explorer" -ForegroundColor Gray
Write-Host "   2. Navigate to: $(Get-Location)" -ForegroundColor Gray
Write-Host "   3. Copy the CLEANCOPY-*.bundle and CLEANCOPY-*.zip files" -ForegroundColor Gray
Write-Host "   4. Paste them on your Desktop" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 The .bundle file contains your COMPLETE project with history!" -ForegroundColor Green 