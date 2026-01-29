import { AccuracyTracker } from '@/lib/services/viral-prediction/accuracy-tracker';

export async function GET() {
  try {
    const tracker = new AccuracyTracker();
    const performance = await tracker.getSystemPerformance();
    const metrics = await tracker.updateSystemAccuracy();
    return new Response(JSON.stringify({ success: true, performance, metrics }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// Duplicate GET handler removed to avoid route redefinition errors.
