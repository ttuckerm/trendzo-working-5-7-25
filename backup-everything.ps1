# CleanCopy Comprehensive Backup Script
# This script creates multiple backup types to ensure your 7-month project is safe

param(
    [string]$BackupLocation = "$env:USERPROFILE\Desktop\CleanCopy-Backups"
)

Write-Host "🔥 CleanCopy Emergency Backup Script 🔥" -ForegroundColor Yellow
Write-Host "Protecting your 7 months of hard work..." -ForegroundColor Green

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupDir = "$BackupLocation\$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "📁 Backup Directory: $backupDir" -ForegroundColor Cyan

try {
    # 1. Git Bundle Backup (MOST IMPORTANT - includes full history)
    Write-Host "🔄 Creating Git bundle backup (complete repository with history)..." -ForegroundColor Yellow
    $bundlePath = "$backupDir\CleanCopy-FULL-REPO-$timestamp.bundle"
    git bundle create $bundlePath --all
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git bundle created: $bundlePath" -ForegroundColor Green
    } else {
        Write-Host "❌ Git bundle failed!" -ForegroundColor Red
    }

    # 2. Source Code ZIP (excludes generated files)
    Write-Host "🔄 Creating source code backup..." -ForegroundColor Yellow
    $zipPath = "$backupDir\CleanCopy-SOURCE-$timestamp.zip"
    
    # Create ZIP excluding problematic directories
    $sourceItems = @(
        "src", "public", "docs", "scripts", "supabase", "tasks", 
        "*.json", "*.md", "*.js", "*.ts", "*.tsx", ".env*", "*.sql",
        "Unicorn UX", "video frameworks and research", "paths",
        "playwright", "data"
    )
    
    Compress-Archive -Path $sourceItems -DestinationPath $zipPath -Force
    Write-Host "✅ Source backup created: $zipPath" -ForegroundColor Green

    # 3. Complete File Copy (everything except node_modules and .next)
    Write-Host "🔄 Creating complete file backup..." -ForegroundColor Yellow
    $copyPath = "$backupDir\CleanCopy-COMPLETE-$timestamp"
    
    # Copy all files except problematic directories
    robocopy "." $copyPath /E /XD node_modules .next .swc temp-install test-results whisper_env /XF "*.bundle" "*.zip" /NFL /NDL /NJH
    Write-Host "✅ Complete backup created: $copyPath" -ForegroundColor Green

    # 4. Database Schemas and Scripts
    Write-Host "🔄 Creating database backup..." -ForegroundColor Yellow
    $dbPath = "$backupDir\CleanCopy-DATABASE-$timestamp.zip"
    Compress-Archive -Path "scripts\*.sql", "supabase\migrations\*" -DestinationPath $dbPath -Force
    Write-Host "✅ Database backup created: $dbPath" -ForegroundColor Green

    # 5. Configuration Files
    Write-Host "🔄 Creating config backup..." -ForegroundColor Yellow
    $configPath = "$backupDir\CleanCopy-CONFIG-$timestamp.zip"
    Compress-Archive -Path "*.json", ".env*", "*.config.*", "*.js" -DestinationPath $configPath -Force
    Write-Host "✅ Config backup created: $configPath" -ForegroundColor Green

    # 6. Documentation Backup
    Write-Host "🔄 Creating documentation backup..." -ForegroundColor Yellow
    $docsPath = "$backupDir\CleanCopy-DOCS-$timestamp.zip"
    Compress-Archive -Path "docs\*", "tasks\*", "*.md", "Unicorn UX\*", "video frameworks and research\*" -DestinationPath $docsPath -Force
    Write-Host "✅ Documentation backup created: $docsPath" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 ALL BACKUPS COMPLETED SUCCESSFULLY! 🎉" -ForegroundColor Green
    Write-Host "📍 Location: $backupDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backup Summary:" -ForegroundColor Yellow
    Write-Host "✅ Git Bundle (Full Repo): $bundlePath" -ForegroundColor White
    Write-Host "✅ Source Code: $zipPath" -ForegroundColor White  
    Write-Host "✅ Complete Files: $copyPath" -ForegroundColor White
    Write-Host "✅ Database: $dbPath" -ForegroundColor White
    Write-Host "✅ Configuration: $configPath" -ForegroundColor White
    Write-Host "✅ Documentation: $docsPath" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 To restore from Git bundle:" -ForegroundColor Cyan
    Write-Host "   git clone $bundlePath restored-project" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔒 Your 7 months of work is now SAFELY backed up!" -ForegroundColor Green

    # Check sizes
    Write-Host ""
    Write-Host "📊 Backup Sizes:" -ForegroundColor Yellow
    Get-ChildItem $backupDir -Recurse | Where-Object { !$_.PSIsContainer } | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   $($_.Name): ${sizeMB} MB" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "But don't panic! Try running individual backup commands manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 OPTIONAL: To fix GitHub push issues, try:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Emergency backup commit'" -ForegroundColor Gray
Write-Host "   git push origin feature/system-rebuild" -ForegroundColor Gray