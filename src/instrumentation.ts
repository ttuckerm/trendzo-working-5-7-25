// Next.js instrumentation hook — runs once per Node.js server process on startup.
// Used here to register node-cron jobs so the scheduler fires automatically while
// `npm run dev` is running, without needing anyone to hit an admin endpoint first.
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { startScheduler } = await import('@/lib/cron/scheduler');
    startScheduler();
  } catch (err) {
    console.error('[instrumentation] Failed to start cron scheduler:', err);
  }
}
