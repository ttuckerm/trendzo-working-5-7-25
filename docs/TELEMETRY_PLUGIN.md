# Live Telemetry Plugin + Web Extension (Stub)

## Keys
- Use existing admin routes to mint telemetry keys (prefix `tk_tlm_...`).
- Send header `x-api-key: TK_TLM_...`.

## Ingest Route
- POST `/api/telemetry/first_hour_plugin`
- Body (JSON):
```
{
  "video_id": "ext_mock_1",
  "ts_iso": "2025-08-15T12:40:00.000Z",
  "views": 1700,
  "unique_viewers": 1600,
  "avg_watch_pct": 0.42,
  "completion_rate": 0.21,
  "rewatches": 20,
  "shares": 12,
  "saves": 8,
  "comments": 5,
  "source": "extension"
}
```

Example curl:
```
curl -s -X POST -H "Content-Type: application/json" -H "x-api-key: TK_TLM_YOUR_KEY" \
  -d '{"video_id":"ext_mock_1","ts_iso":"2025-08-15T12:40:00.000Z","views":1700,"unique_viewers":1600,"avg_watch_pct":0.42,"completion_rate":0.21,"rewatches":20,"shares":12,"saves":8,"comments":5,"source":"extension"}' \
  http://localhost:3000/api/telemetry/first_hour_plugin
```

## Admin Recent
- GET `/api/admin/telemetry/plugin/recent?page=1&page_size=50` (admin-gated)

## Status Counters
- Integration status includes:
  - `telemetry_plugin_events_24h`
  - `telemetry_plugin_last_ingest`
  - `telemetry_plugin_keys_active`

## Dry Run
- GET `/api/admin/integration/dryrun_telemetry_plugin` (admin-gated) seeds sample rows and returns counts.

## Chrome Extension (MV3)
- Folder `extensions/telemetry-extension`
- Load in Chrome: `chrome://extensions` → Enable Developer mode → Load unpacked → select the folder.
- Set API URL: `http://localhost:3000/api/telemetry/first_hour_plugin`
- Paste API Key (starts with `TK_TLM_...`).
- Fill fields and click Send. Status shows success/error.

Security: Keys are stored in `chrome.storage.sync`. Rotate/revoke from Admin.
