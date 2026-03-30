import { appendPrediction, readAllPredictions, appendValidation, readAllValidations } from '@/lib/validation/store'

describe('validation store', () => {
  it('appends and reads predictions/validations', () => {
    const ev = appendPrediction({ platform:'tiktok', probability:0.6, threshold:0.5 })
    expect(ev.id).toBeTruthy()
    const preds = readAllPredictions()
    expect(preds.length).toBeGreaterThan(0)
    appendValidation({ predictionId: ev.id, platform:'tiktok', madeAtISO: ev.madeAtISO, maturedAtISO: new Date().toISOString(), probability: ev.probability, actualViral:true, predictedViral:true })
    const vals = readAllValidations()
    expect(vals.find(v=>v.predictionId===ev.id)).toBeTruthy()
  })
})


