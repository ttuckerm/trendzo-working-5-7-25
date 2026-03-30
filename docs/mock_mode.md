## Mock Mode

Set env in `.env.local`:

```
MOCK=1
APIFY_TOKEN=
APIFY_DATASET_ID=
```

When `MOCK=1`, APIs read from `fixtures/` via the mock source. On first run, fixtures are generated automatically:

- `videos.json` — VIT items
- `calibration.json` — 10 bins
- `weather.json` — status ticker
- `proof_tiles.json` — 13 objectives

Set `MOCK=0` and provide `APIFY_TOKEN` and `APIFY_DATASET_ID` to switch to the live Apify dataset.


