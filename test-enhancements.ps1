# Test FEAT-002 Enhancements
Write-Host "Testing FEAT-002 Enhancements..." -ForegroundColor Cyan
Write-Host ""

# Wait for server
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

# Test 1: Identity Container Scoring
Write-Host "========================================" -ForegroundColor Green
Write-Host "Test 1: Identity Container Scoring" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$body1 = @{
  video = @{
    videoId = "test-caption-001"
    platform = "tiktok"
    viewCount = 500000
    likeCount = 35000
    commentCount = 1500
    shareCount = 5000
    followerCount = 75000
    hoursSinceUpload = 24
    publishedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    caption = "I can't believe this worked! What would you do in this situation?"
  }
} | ConvertTo-Json -Depth 10

try {
    $result1 = Invoke-RestMethod -Uri "http://localhost:3002/api/dps/calculate" -Method POST -ContentType "application/json" -Body $body1
    Write-Host "SUCCESS" -ForegroundColor Green
    Write-Host "Viral Score: $($result1.viralScore)" -ForegroundColor Cyan
    Write-Host "Identity Container Score: $($result1.identityContainerScore)" -ForegroundColor Magenta
    Write-Host "Classification: $($result1.classification)" -ForegroundColor Yellow
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Prediction Mode
Write-Host "========================================" -ForegroundColor Green
Write-Host "Test 2: Prediction Mode (Reactive)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$body2 = @{
  video = @{
    videoId = "test-reactive-001"
    platform = "instagram"
    viewCount = 125000
    likeCount = 8500
    followerCount = 25000
    hoursSinceUpload = 48
    publishedAt = (Get-Date).AddHours(-48).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  }
  options = @{
    predictionMode = "reactive"
  }
} | ConvertTo-Json -Depth 10

try {
    $result2 = Invoke-RestMethod -Uri "http://localhost:3002/api/dps/calculate" -Method POST -ContentType "application/json" -Body $body2
    Write-Host "SUCCESS" -ForegroundColor Green
    Write-Host "Viral Score: $($result2.viralScore)" -ForegroundColor Cyan
    Write-Host "Mode: reactive (post-publish)" -ForegroundColor Magenta
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Tests Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
