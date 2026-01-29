// In-process dry-run: compute simulator status without HTTP
import { generateVariants, AudienceParams } from '../src/lib/simulator/audience'

async function main() {
  const params: AudienceParams = {
    platform: 'tiktok',
    niche: 'general',
    cohort: 'default',
    tokens: [],
    frameworkProfile: { overallScore: 0.6 },
    timingScore: 1.02,
    personalizationFactor: 1.01,
    impressions: 10000,
    videoFeatures: { hookStrength: 0.6, durationSeconds: 22 }
  }
  const variants = generateVariants(params, 5)
  const status = {
    simulator_last_run: new Date().toISOString(),
    sim_variants_generated_24h: variants.length
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(status))
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})


