# FEAT-003 Pattern Extraction Test
# PowerShell script to extract viral patterns

Write-Host "`n🧬 Testing Pattern Extraction (FEAT-003)`n" -ForegroundColor Cyan

$body = @{
    niche = "personal-finance"
    minDPSScore = 70
    dateRange = "90d"
} | ConvertTo-Json

Write-Host "Requesting pattern extraction for personal-finance niche..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:3002/api/patterns/extract" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ Pattern extraction completed!`n" -ForegroundColor Green

    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "  - Patterns Extracted: $($response.patternsExtracted)" -ForegroundColor White
    Write-Host "  - Videos Analyzed: $($response.videosAnalyzed)" -ForegroundColor White
    Write-Host "  - Niche: $($response.niche)" -ForegroundColor White

    if ($response.patterns) {
        Write-Host "`n🎯 Sample Patterns:" -ForegroundColor Cyan
        $response.patterns | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - [$($_.pattern_type)] $($_.pattern_description)" -ForegroundColor White
            Write-Host "    Success Rate: $([math]::Round($_.success_rate * 100, 1))% | Avg DPS: $($_.avg_dps_score)" -ForegroundColor Gray
        }
    }

    Write-Host "`n✨ Patterns are now available for FEAT-007 predictions!`n" -ForegroundColor Green

} catch {
    Write-Host "❌ Pattern extraction failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Dev server is running (npm run dev)" -ForegroundColor White
    Write-Host "  2. FEAT-003 API route exists" -ForegroundColor White
    Write-Host "  3. You have scraped videos in database" -ForegroundColor White
    exit 1
}
