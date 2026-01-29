param([int]$Port = 3002)
$payload = @{ messages = @(@{ role="user"; content="return ok json 123" }); maxTokens = 128 } | ConvertTo-Json -Depth 5
foreach ($r in @("teacher","scout","judge")) {
  try {
    $u = "http://localhost:$Port/api/llm/$r"
    $res = Invoke-RestMethod -Uri $u -Method POST -ContentType "application/json" -Body $payload
    Write-Host "$r OK:" ( $res | ConvertTo-Json -Depth 5 )
  } catch {
    Write-Host "$r ERROR:" $_.Exception.Message
  }
}


