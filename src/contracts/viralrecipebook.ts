export const ViralRecipeBookContract = {
    ownerObjectives: [2, 3, 4, 6, 11],
    tabs: ['templates','analyzer','dashboard','abtest','validate','scripts','optimize','inception'],
    endpoints: {
      readiness: '/api/discovery/readiness',
      rollups: '/api/discovery/rollups',
      templates: '/api/templates',
      tplById: (id:string)=>`/api/templates/${id}`,
      tplExamples: (id:string)=>`/api/templates/${id}/examples`,
      analyze: '/api/drafts/analyze',
      abStart: '/api/ab/start',
      abById: (id:string)=>`/api/ab/${id}`,
      validateStart: '/api/validation/start',
    },
    actions: {
      qaSeed: '/api/discovery/qa-seed',
      recompute: '/api/admin/pipeline/actions/recompute-discovery',
      warmExamples: '/api/admin/pipeline/actions/warm-examples',
    },
    testIds: {
      readinessPill: 'discovery-readiness-pill',
      readinessPanel: 'discovery-readiness-panel',
      tplCardPrefix: 'tpl-card-',
      tplSlideTabs: 'tpl-slide-tabs',
      analyzeResults: 'analyze-results',
      exportToStudio: 'btn-export-to-studio',
      openScriptIntel: 'btn-open-script-intel',
      abStart: 'ab-start',
      abRowPrefix: 'ab-row-',
      validateStart: 'validate-start',
      chartDiscovery: 'chart-discovery',
      chartDecay: 'chart-decay',
    },
    rbac: { role: 'admin', audit: true }
  };
  