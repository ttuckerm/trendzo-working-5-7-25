import { markDeployed, setWinner } from './store'

export async function applyWinner(experimentId: string, variantId: string): Promise<{ deployed:boolean }>{
  try {
    await setWinner(experimentId, variantId)
    await markDeployed(experimentId)
    return { deployed: true }
  } catch { return { deployed: false } }
}


