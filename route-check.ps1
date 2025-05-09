param($route)

# Check if the route includes http:// or https://
if ($route -match "^https?://") {
    $url = $route
} else {
    $baseUrl = "http://localhost:3003"
    $url = "$baseUrl$route"
}

try {
    $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
    Write-Host "✅ Route $route is accessible (Status: $($response.StatusCode))"
} catch {
    Write-Host "❌ Route $route is NOT accessible: $($_.Exception.Message)"
} 