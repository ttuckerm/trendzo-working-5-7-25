import { createJobRun, updateJobRun, finishJobRun, isCanceled } from '@/lib/jobs/job_store'

export async function runWithProgress<T>(type: string, meta: any, steps: Array<{ name: string; fn: () => Promise<void> }>): Promise<{ job_id: string }> {
  const jobId = await createJobRun(type, meta)
  try {
    const n = steps.length
    for (let i=0;i<n;i++) {
      if (await isCanceled(jobId)) throw new Error('canceled')
      const step = steps[i]
      await updateJobRun(jobId, { progress_pct: Math.round((i*100)/n) }, { ts: new Date().toISOString(), msg: `start:${step.name}` })
      await step.fn()
      await updateJobRun(jobId, { progress_pct: Math.round(((i+1)*100)/n) }, { ts: new Date().toISOString(), msg: `done:${step.name}` })
    }
    await finishJobRun(jobId, 'success')
  } catch (e: any) {
    await finishJobRun(jobId, e?.message === 'canceled' ? 'canceled' : 'error', { error: String(e?.message||e) })
  }
  return { job_id: jobId }
}


