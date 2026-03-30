# Telemetry Integration Kit (First-Hour Ingest)

## Authentication
- Admin mints an API key: `POST /api/admin/telemetry/keys { name }`.
- Send header: `x-api-key: tk_tlm_...`

## Endpoint
- `POST /api/telemetry/first_hour` (application/json)

### Body
```
{
  "video_id": "string",
  "ts_iso": "2025-08-15T12:00:00.000Z",
  "views": 17000,
  "unique_viewers": 15600,
  "avg_watch_pct": 0.40,
  "completion_rate": 0.20,
  "rewatches": 980,
  "shares": 140,
  "saves": 70,
  "comments": 44,
  "source": "partnerX"
}
```

## Rate Limits
- 120 req/min per key (default).

## Error Codes
- 401 unauthorized
- 400 missing_fields
- 500 server error

## Retention
- 180 days.

## cURL Example
```
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: TK_TLM_YOUR_KEY" \
  -d '{
    "video_id":"mock_video_1",
    "ts_iso":"2025-08-15T12:40:00.000Z",
    "views":17000,
    "unique_viewers":15600,
    "avg_watch_pct":0.40,
    "completion_rate":0.20,
    "rewatches":980,
    "shares":140,
    "saves":70,
    "comments":44,
    "source":"partnerX"
  }' \
  https://your-domain.com/api/telemetry/first_hour
```

## 15-line JS Helper
```js
export async function sendFirstHourTelemetry(input) {
  const res = await fetch('/api/telemetry/first_hour', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': input.apiKey
    },
    body: JSON.stringify({
      video_id: input.videoId,
      ts_iso: new Date().toISOString(),
      views: input.views,
      unique_viewers: input.uniqueViewers,
      avg_watch_pct: input.avgWatchPct,
      completion_rate: input.completionRate,
      rewatches: input.rewatches,
      shares: input.shares,
      saves: input.saves,
      comments: input.comments,
      source: input.source || 'sdk'
    })
  })
  if (!res.ok) throw new Error(`telemetry_failed:${res.status}`)
  return res.json()
}
```
