## Instant Analysis Engine

Inputs:
- platform (tiktok|instagram|youtube|linkedin)
- niche (optional)
- videoUrl or file (optional)
- scriptText (optional)
- caption, durationSec (optional)

Outputs:
- probability (0–1), confidence (0–1)
- reasons[] (top factors)
- recommendations[] (3–5 concrete edits with predictedUplift)
- timings { elapsedMs, metSLA }
- frameworkMatches[]

SLA:
- Target ≤ 5000ms. Requests include a stopwatch to return timings and metSLA.

MOCK Mode:
- Set MOCK=1 to route inputs to fixtures and avoid network calls.

Switch to Live:
- Implement real upload handling in `src/lib/data/upload.ts` and pass real VIT/video metadata into `scoreDraft`.

Examples:
- GET `/api/analyze/examples` returns three sample drafts (MOCK only).


