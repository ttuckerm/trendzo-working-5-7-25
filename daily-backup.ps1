# CleanCopy Daily Quick Backup
# Run this script daily to protect your work with minimal effort

Write-Host "📅 Daily CleanCopy Backup" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyy-MM-dd"
$desktopBackup = "$env:USERPROFILE\Desktop\CleanCopy-Daily-$timestamp"

# Quick Git bundle (most important)
Write-Host "🔄 Creating daily Git bundle..." -ForegroundColor Yellow
git bundle create "$desktopBackup.bundle" --all

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Daily backup created: $desktopBackup.bundle" -ForegroundColor Green
    
    $size = [math]::Round((Get-Item "$desktopBackup.bundle").Length / 1MB, 2)
    Write-Host "📦 Size: ${size} MB" -ForegroundColor Gray
    
    Write-Host "💡 Your work is safe! This bundle contains your complete project history." -ForegroundColor Green
} else {
    Write-Host "❌ Daily backup failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔒 Recommendation: Run this script daily before closing your computer." -ForegroundColor Cyan 