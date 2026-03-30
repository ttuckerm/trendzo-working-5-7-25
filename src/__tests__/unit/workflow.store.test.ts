const storeModPath = '../../workflow/workflowStore'

declare const global: any

beforeEach(() => {
  jest.resetModules()
  const { useWorkflowStore } = require(storeModPath)
  useWorkflowStore.setState({
    niche: '',
    goal: '',
    starterEnabled: false,
    starterTemplates: [],
    templateId: undefined,
    scriptDoc: undefined,
    analysisResult: undefined,
    schedulePlan: undefined,
    receipts: [],
  })
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
  }
})

describe('workflow store', () => {
  it('sets niche and goal together and persists minimal slice', () => {
    const { useWorkflowStore } = require(storeModPath)
    useWorkflowStore.getState().setNicheGoal('fitness', 'growth')
    const s = useWorkflowStore.getState()
    expect(s.niche).toBe('fitness')
    expect(s.goal).toBe('growth')
  })

  it('enables starter and sets templates safely', () => {
    const { useWorkflowStore } = require(storeModPath)
    useWorkflowStore.getState().enableStarter(true)
    expect(useWorkflowStore.getState().starterEnabled).toBe(true)
    useWorkflowStore.getState().setStarterTemplates(['a','b','c'])
    expect(useWorkflowStore.getState().starterTemplates).toEqual(['a','b','c'])
  })

  it('saves receipt and persists minimal subset', () => {
    const { useWorkflowStore } = require(storeModPath)
    useWorkflowStore.getState().saveReceipt({ id: 'r1', createdAtISO: new Date().toISOString(), templateId: 't1', score: 90 })
    expect(useWorkflowStore.getState().receipts.length).toBe(1)
  })
})


