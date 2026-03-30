# Plugin Guides: Premiere/AE (CEP), Descript CLI, CapCut Helper

## API Key
- Obtain a telemetry key via admin, it will be used as `x-api-key`.

## Public Scoring API
- Endpoint: `/public/score`
- Method: `POST`
- Headers: `x-api-key: <your key>`
- Body: `{ url?: string, features?: object }`
- Response: `{ score, probability, calibrated_probability, framework_top3, timing_score, personalization_factor }`

## JS SDK
```js
import { score } from '@virallab/sdk'
await score({ apiKey: 'tk_tlm_***', url, features })
```

## Python SDK
```python
from virallab import score
res = score('tk_tlm_***', url='https://...', features={'viewCount': 10000})
```

## Premiere/After Effects CEP Panel
- Open `plugins/premiere/panel.html` in the CEP environment
- Enter API key and press Score

## Descript CLI
```bash
echo "Transcript text" | node plugins/descript/score-cli.js
```

## CapCut Helper
```bash
node plugins/capcut/score-helper.js tk_tlm_*** features.json
```






