import { computeAUROC, computeReliabilityBins } from '@/lib/validation/metrics'

const mk = (prob:number, y:boolean) => ({ predictionId:'x', platform:'tiktok', madeAtISO:new Date().toISOString(), maturedAtISO:new Date().toISOString(), probability:prob, actualViral:y, predictedViral: prob>=0.5 })

describe('validation metrics', () => {
  it('computes AUROC and bins', () => {
    const records = [ mk(0.9,true), mk(0.8,true), mk(0.7,false), mk(0.6,true), mk(0.4,false), mk(0.2,false) ] as any
    const auc = computeAUROC(records)
    expect(auc).toBeGreaterThan(0.5)
    const { bins, ece } = computeReliabilityBins(records, 10)
    expect(bins.length).toBe(10)
    expect(ece).toBeGreaterThanOrEqual(0)
  })
})


