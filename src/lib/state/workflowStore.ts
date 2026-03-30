import { create } from 'zustand'

export interface StarterTemplate {
	id: string
	title?: string
	score?: number
	meta?: Record<string, any>
}

export interface AnalysisResult {
	score: number
	fixes?: string[]
	ready?: boolean
	meta?: Record<string, any>
}

export interface ScheduleItem { platform: 'tiktok'|'instagram'|'youtube', dayOffset: number }
export interface SchedulePlan { items: ScheduleItem[]; captions?: Record<string,string> }

export interface PredictionReceipt { id: string; madeAtISO: string; score: number; templateName?: string; niche?: string; goal?: string; platformPlan: { platform: string; dayOffset: number }[] }

export interface WorkflowState {
	niche: string
	goal: string
	starterEnabled: boolean
	starterTemplates: StarterTemplate[]
	templateId: string | null
	scriptDoc: string
	analysisResult: AnalysisResult | null
	schedulePlan: SchedulePlan | null
	receipts: PredictionReceipt[]

	setNiche: (n: string) => void
	setGoal: (g: string) => void
	setStarterEnabled: (b: boolean) => void
	setStarterTemplates: (t: StarterTemplate[]) => void
	setTemplateId: (id: string | null) => void
	setScriptDoc: (doc: string) => void
	setAnalysisResult: (r: AnalysisResult | null) => void
	setSchedulePlan: (p: SchedulePlan | null) => void
	addReceipt: (r: PredictionReceipt) => void
	reset: () => void
}

const STORAGE_KEY = 'starter_workflow_v1'

function loadPersisted(): Partial<WorkflowState> {
	if (typeof window === 'undefined') return {}
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return {}
		const j = JSON.parse(raw)
		return {
			niche: j.niche || '',
			goal: j.goal || '',
			starterEnabled: !!j.starterEnabled,
			receipts: Array.isArray(j.receipts) ? j.receipts : [],
		}
	} catch { return {} }
}

function persistSlice(state: WorkflowState) {
	try {
		const toSave = {
			niche: state.niche,
			goal: state.goal,
			starterEnabled: state.starterEnabled,
			receipts: state.receipts,
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
	} catch {}
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
	niche: '',
	goal: '',
	starterEnabled: false,
	starterTemplates: [],
	templateId: null,
	scriptDoc: '',
	analysisResult: null,
	schedulePlan: null,
	receipts: [],

	...loadPersisted(),

	setNiche: (n) => set((s) => { const ns = { ...s, niche: n }; persistSlice(ns as WorkflowState); return ns }),
	setGoal: (g) => set((s) => { const ns = { ...s, goal: g }; persistSlice(ns as WorkflowState); return ns }),
	setStarterEnabled: (b) => set((s) => { const ns = { ...s, starterEnabled: b }; persistSlice(ns as WorkflowState); return ns }),
	setStarterTemplates: (t) => set({ starterTemplates: t }),
	setTemplateId: (id) => set({ templateId: id }),
	setScriptDoc: (doc) => set({ scriptDoc: doc }),
	setAnalysisResult: (r) => set({ analysisResult: r }),
	setSchedulePlan: (p) => set({ schedulePlan: p }),
	addReceipt: (r) => set((s) => { const next = { ...s, receipts: [...s.receipts, r] } as WorkflowState; persistSlice(next); return next }),
	reset: () => set({ starterEnabled: false, starterTemplates: [], templateId: null, scriptDoc: '', analysisResult: null, schedulePlan: null })
}))
