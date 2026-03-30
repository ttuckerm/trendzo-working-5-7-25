import { expectedCalibrationError, areaUnderRoc } from '../../calibration/metrics'

describe('calibration metrics', () => {
  it('computes ECE with perfect calibration near 0', () => {
    const pred = [0.05,0.15,0.25,0.35,0.45,0.55,0.65,0.75,0.85,0.95]
    const labels = [false,false,false,false,false,true,true,true,true,true]
    const { ece } = expectedCalibrationError(pred, labels, 10)
    expect(ece).toBeGreaterThanOrEqual(0)
    expect(ece).toBeLessThan(0.12)
  })
  it('computes AUROC > 0.5 for separable predictions', () => {
    const pred = [0.1,0.2,0.3,0.8,0.9,0.95]
    const labels = [false,false,false,true,true,true]
    const auc = areaUnderRoc(pred, labels)
    expect(auc).toBeGreaterThan(0.8)
  })
})



