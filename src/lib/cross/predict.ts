import type { VIT } from '@/lib/vit/vit'
import { durationToBucket, videoSignature } from './identity'

export type CrossPredictInput = { platform:'tiktok'|'instagram'|'youtube'; video?: VIT|null; templateId?: string; niche?: string }
export type CrossPredictOutput = { probIG:number; probYT:number; confidence:'low'|'med'|'high'; recommendedLags:{ toIG:number; toYT:number }; features: Record<string, any> }

function logistic(x: number): number { return 1/(1+Math.exp(-x)) }

export function predictCrossPlatform(input: CrossPredictInput): CrossPredictOutput {
  const v = input.video
  const leader = input.platform
  const tpl = input.templateId || (v?.template?.id || '')
  const niche = input.niche || (v?.niche || '')
  const dur = durationToBucket(v?.durationSec)
  const sig = v ? videoSignature(v) : { textSig:'', audioSig:'', durationBucket:dur }
  const earlyVelocity = Math.min(5, Math.max(0, Math.log10((v?.metrics.find(m=>m.window==='24h')?.views||100)+1)))
  const creatorBaseline = Math.max(0, Math.min(1, (v?.baselines?.creator30d?.er || 0.05)))
  const crossSR = Math.max(0, Math.min(1, (v?.template?.successRate || 0.3)))

  // Deterministic score: weights chosen for stability
  const wLeaderIG = leader==='tiktok'? 0.6 : leader==='instagram'? 0.5 : 0.4
  const wLeaderYT = leader==='tiktok'? 0.5 : leader==='instagram'? 0.6 : 0.5
  const wDur = dur==='short'? 0.55 : dur==='medium'? 0.5 : 0.45
  const wVel = 0.15 * earlyVelocity
  const wCreator = 0.2 * creatorBaseline
  const wCross = 0.25 * crossSR
  const wTpl = tpl ? 0.1 : 0

  const zIG = -0.5 + wLeaderIG + wDur + wVel + wCreator + wCross + wTpl
  const zYT = -0.6 + wLeaderYT + (dur==='long'? 0.55 : 0.45) + 0.12*earlyVelocity + 0.2*creatorBaseline + 0.3*crossSR + wTpl
  const probIG = Number(logistic(zIG).toFixed(3))
  const probYT = Number(logistic(zYT).toFixed(3))

  // Confidence from calibration-like bins: more signals → higher
  const sigs = [leader?1:0, tpl?1:0, niche?1:0, dur?1:0, earlyVelocity>0?1:0, creatorBaseline>0?1:0, crossSR>0?1:0].reduce((a,b)=>a+b,0)
  const confidence = sigs >=6 ? 'high' : sigs>=4 ? 'med' : 'low'

  // Recommended repost window based on simple lag priors: IG within 6–12h if TikTok leads; YT within 24–48h
  const recommendedLags = {
    toIG: leader==='tiktok' ? 12 : leader==='instagram' ? 6 : 18,
    toYT: leader!=='youtube' ? 36 : 12,
  }

  const features = { leader, templateId: tpl, niche, durationBucket: dur, earlyVelocity, creatorBaseline, crossSR, textSig: sig.textSig }
  return { probIG, probYT, confidence, recommendedLags, features }
}


