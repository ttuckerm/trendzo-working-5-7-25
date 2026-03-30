import { create } from 'zustand'

export type VideoMode = 'analysis' | 'playback'

export interface TemplateCapsuleState {
  templateIdToTab: Record<string, string>
  templateIdToVideoMode: Record<string, VideoMode>
  setActiveTab: (templateId: string, tab: string) => void
  setVideoMode: (templateId: string, mode: VideoMode) => void
  resetTemplate: (templateId: string) => void
}

const STORAGE_KEY = 'template_capsule_state_v1'

function loadPersisted(): Partial<TemplateCapsuleState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const j = JSON.parse(raw)
    return {
      templateIdToTab: j.templateIdToTab || {},
      templateIdToVideoMode: j.templateIdToVideoMode || {},
    }
  } catch {
    return {}
  }
}

function persistSlice(state: TemplateCapsuleState) {
  try {
    const toSave = {
      templateIdToTab: state.templateIdToTab,
      templateIdToVideoMode: state.templateIdToVideoMode,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {}
}

export const useTemplateCapsuleStore = create<TemplateCapsuleState>((set, get) => ({
  templateIdToTab: {},
  templateIdToVideoMode: {},
  ...loadPersisted(),
  setActiveTab: (templateId, tab) => set((s) => {
    const next = { ...s, templateIdToTab: { ...s.templateIdToTab, [templateId]: tab } } as TemplateCapsuleState
    persistSlice(next)
    return next
  }),
  setVideoMode: (templateId, mode) => set((s) => {
    const next = { ...s, templateIdToVideoMode: { ...s.templateIdToVideoMode, [templateId]: mode } } as TemplateCapsuleState
    persistSlice(next)
    return next
  }),
  resetTemplate: (templateId) => set((s) => {
    const { [templateId]: _omitTab, ...restTabs } = s.templateIdToTab
    const { [templateId]: _omitMode, ...restModes } = s.templateIdToVideoMode
    const next = { ...s, templateIdToTab: restTabs, templateIdToVideoMode: restModes } as TemplateCapsuleState
    persistSlice(next)
    return next
  })
}))


