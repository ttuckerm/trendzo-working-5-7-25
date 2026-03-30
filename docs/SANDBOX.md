# ViralLab Developer Sandbox

Sandbox key: `tk_tlm_DEMO_SANDBOX` (scope: `score/public`, quota: 1000/day).

## cURL
```bash
curl -X POST "$BASE_URL/public/score" \
  -H "x-api-key: tk_tlm_DEMO_SANDBOX" -H "Content-Type: application/json" \
  -d '{"features":{"viewCount":10000}}'
```

## JS SDK
```js
import { score } from '../sdk/js/index'
const out = await score({ apiKey: 'tk_tlm_DEMO_SANDBOX', features: { viewCount: 10000 } })
console.log(out)
```

## Python SDK
```python
from virallab import score
print(score('tk_tlm_DEMO_SANDBOX', features={'viewCount': 10000}))
```

## Plugins
- Premiere/AE CEP: open `plugins/premiere/panel.html`, paste API key, Score
- Descript CLI: `echo "Transcript" | node plugins/descript/score-cli.js`






