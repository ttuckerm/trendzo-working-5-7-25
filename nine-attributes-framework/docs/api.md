## Nine Attributes Framework API Documentation

### Overview

The Nine Attributes Framework provides automated content quality scoring and ranking integration for social media content.

### Endpoints

#### POST /api/v1/analyze

Analyze content and extract nine quality attributes.

Request:
```json
{
  "video_url": "https://example.com/video.mp4",
  "file_path": "/path/to/video.mp4",
  "platform": "instagram",
  "creator_id": "creator123",
  "include_priors": true
}
```

Response:
```json
{
  "analysis": {
    "audit_id": "uuid",
    "attributes": [
      {
        "name": "HookStrength",
        "score": 8.4,
        "evidence": {
          "cut_rate": 2.7,
          "text_hook": true,
          "prosody_var": 0.31
        }
      }
    ],
    "total_score": 72.0,
    "violations": [],
    "priors": {
      "prior_watch_time": 0.75,
      "prior_share_prob": 0.45,
      "prior_regret_prob": 0.10,
      "confidence_intervals": {},
      "version": "priors-v1"
    }
  },
  "gate_check": {
    "pass_gate": true,
    "reasons": [],
    "required_fixes": [],
    "total_score": 72.0
  }
}
```

#### POST /api/content/gate

Check if content passes quality gates.

Gates:

- Total score ≥ 63/90
- No attribute < 5/10
- At least 3 attributes ≥ 8/10

#### POST /api/v1/rank

Rank items incorporating Nine Attributes scores.

Request:
```json
{
  "items": [
    {
      "id": "item1",
      "attributes": [],
      "base_score": 0.5
    }
  ],
  "user_features": {
    "device": "mobile",
    "country": "us"
  },
  "context": {
    "platform": "instagram"
  }
}
```

### Attributes Explained

- TAM Resonance: Breadth of potential audience
- Sharability: Likelihood of sharing
- Hook Strength: Opening impact (0-3 seconds)
- Format Innovation: Presentation engagement
- Value Density: Information per second
- Pacing & Rhythm: Momentum maintenance
- Curiosity Gaps: Open/close loops
- Emotional Journey: Feeling progression
- Clear Payoff: Conclusion value

### Performance Requirements

- p95 latency ≤ 120ms (scoring path)
- Error rate ≤ 0.3%
- Availability ≥ 99.9%
- MAPE ≤ 10% at 1000 impressions
- ECE ≤ 0.03

### Rate Limits

- 60 requests per minute per IP
- 1000 requests per hour per authenticated user


