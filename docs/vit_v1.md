## VIT v1 (Universal Video Profile)

Fields include identity, metadata, metrics across windows, baselines, prediction, validation, template linking, cross-platform, ops and commerce.

Example:

```json
{
  "id": "mock-tiktok-1",
  "platform": "tiktok",
  "platformVideoId": "vid-1",
  "creatorId": "creator-1",
  "niche": "fitness",
  "publishTs": "2025-01-01T00:00:00.000Z",
  "metrics": [{ "window": "48h", "views": 12345, "likes": 234, "comments": 12, "shares": 9, "saves": 5 }],
  "baselines": { "cohortSize": 800, "zScore": 2.3, "percentile": 96 },
  "prediction": { "probability": 0.82, "confidence": 0.9 },
  "validation48h": { "label": "viral" },
  "template": { "id": "tpl-1", "state": "HOT" },
  "vitVersion": "1.0.0"
}
```

### VIT v1 (Universal Video Profile)

- platform: tiktok|instagram|youtube|linkedin
- platformVideoId: string
- creatorId: string|null
- niche: string|null
- publishTs: ISO string|null
- durationSec: number|null
- locale: string|null
- caption: string|null
- hashtags: string[]
- audio: object
- vit: object (derived/features)

Example
```json
{
  "platform": "tiktok",
  "platformVideoId": "73459283475",
  "creatorId": "user_123",
  "niche": "beauty",
  "publishTs": "2025-08-18T12:00:00Z",
  "durationSec": 14,
  "locale": "en",
  "caption": "3 tips to fix frizzy hair",
  "hashtags": ["haircare","beauty"],
  "audio": {"id": "snd_45"},
  "vit": {"frameworkMatches": ["List Hook"], "retentionCurve": [0.8,0.7,0.6]}
}
```


