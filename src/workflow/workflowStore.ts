import { create } from 'zustand'
import { load, save } from './persist'

export type SchedulePlan = { platform: 'tiktok'|'instagram'|'youtube'; datetimeISO: string }

export type WorkflowState = {
  niche?: string
  goal?: string
  starterEnabled: boolean
  starterTemplates: string[]
  templateId?: string
  scriptDoc?: { id: string; title: string; content: string }
  analysisResult?: { score: number; confidence: number; fixes: { text: string; impact: 'low'|'med'|'high' }[] }
  schedulePlan?: SchedulePlan[]
  receipts: { id: string; createdAtISO: string; templateId: string; score: number }[]
}

export interface WorkflowActions {
  setNicheGoal(niche: string, goal: string): void
  enableStarter(on: boolean): void
  setStarterTemplates(ids: string[]): void
  selectTemplate(id: string): void
  saveScript(doc: WorkflowState['scriptDoc']): void
  saveAnalysis(result: WorkflowState['analysisResult']): void
  saveSchedule(plan: SchedulePlan[]): void
  saveReceipt(receipt: WorkflowState['receipts'][number]): void
  reset(): void
}

type PersistedSlice = Pick<WorkflowState, 'niche'|'goal'|'starterEnabled'|'receipts'>

const PERSIST_KEY = 'state'

function readPersist(): Partial<PersistedSlice> {
  return load<PersistedSlice>(PERSIST_KEY, { niche: '', goal: '', starterEnabled: false, receipts: [] }) || {}
}

function writePersist(state: Partial<WorkflowState>) {
  const slice: PersistedSlice = {
    niche: state.niche || '',
    goal: state.goal || '',
    starterEnabled: Boolean(state.starterEnabled),
    receipts: Array.isArray(state.receipts) ? state.receipts as any : [],
  }
  save(PERSIST_KEY, slice)
}

export type WorkflowStore = WorkflowState & WorkflowActions

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  niche: '',
  goal: '',
  starterEnabled: false,
  starterTemplates: [],
  templateId: undefined,
  scriptDoc: undefined,
  analysisResult: undefined,
  schedulePlan: undefined,
  receipts: [],

  ...readPersist(),

  setNicheGoal: (niche: string, goal: string) => set((s) => {
    const next = { ...s, niche, goal }
    writePersist(next)
    return next
  }),

  enableStarter: (on: boolean) => set((s) => {
    const next = { ...s, starterEnabled: !!on }
    writePersist(next)
    return next
  }),

  setStarterTemplates: (ids: string[]) => set({ starterTemplates: ids.slice() }),

  selectTemplate: (id: string) => set({ templateId: id }),

  saveScript: (doc) => set({ scriptDoc: doc }),

  saveAnalysis: (result) => set({ analysisResult: result }),

  saveSchedule: (plan) => set({ schedulePlan: plan }),

  saveReceipt: (receipt) => set((s) => {
    const next = { ...s, receipts: [...s.receipts, receipt] }
    writePersist(next)
    return next
  }),

  reset: () => set((s) => {
    const next: WorkflowState = { ...s, starterEnabled: false, starterTemplates: [], templateId: undefined, scriptDoc: undefined, analysisResult: undefined, schedulePlan: undefined }
    writePersist(next)
    return next
  })
}))


