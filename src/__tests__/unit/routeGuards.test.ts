const guards = require('../../workflow/routeGuards');

describe('routeGuards', () => {
  test('isStudioViralWorkflow returns true only for /admin/studio + activeTopTab=viral-workflow', () => {
    expect(guards.isStudioViralWorkflow('/admin/studio', 'viral-workflow')).toBe(true);
    expect(guards.isStudioViralWorkflow('/admin/studio/analysis', 'viral-workflow')).toBe(true);

    // wrong tab
    expect(guards.isStudioViralWorkflow('/admin/studio', 'proving-grounds')).toBe(false);
    expect(guards.isStudioViralWorkflow('/admin/studio', 'Viral Workflow')).toBe(false); // requires exact slug value

    // other studio tabs should be false
    expect(guards.isStudioViralWorkflow('/admin/studio', 'armory')).toBe(false);
    expect(guards.isStudioViralWorkflow('/admin/studio', 'instant-analysis')).toBe(false);
    expect(guards.isStudioViralWorkflow('/admin/studio', 'validation-dashboard')).toBe(false);
    expect(guards.isStudioViralWorkflow('/admin/studio', 'script-intelligence')).toBe(false);
    expect(guards.isStudioViralWorkflow('/admin/studio', 'laboratory')).toBe(false);

    // deny-listed admin pages
    for (const d of guards.denyPrefixes) {
      expect(guards.isStudioViralWorkflow(d, 'viral-workflow')).toBe(false);
    }

    // random routes
    expect(guards.isStudioViralWorkflow('/analysis', 'viral-workflow')).toBe(false);
    expect(guards.isStudioViralWorkflow('/', 'viral-workflow')).toBe(false);
    expect(guards.isStudioViralWorkflow('', 'viral-workflow')).toBe(false);
  });

  test('isAllowedStarterFlowPath allowlist only', () => {
    expect(guards.isAllowedStarterFlowPath('/admin/studio')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/admin/studio/script')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/admin/studio/analysis')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/admin/studio/schedule')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/admin/studio/receipt')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/analysis')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/schedule')).toBe(true);
    expect(guards.isAllowedStarterFlowPath('/receipt')).toBe(true);

    // deny-list overrides allow
    expect(guards.isAllowedStarterFlowPath('/admin/viral-recipe-book')).toBe(false);
    expect(guards.isAllowedStarterFlowPath('/admin/recipe-book')).toBe(false);
    expect(guards.isAllowedStarterFlowPath('/admin/prediction-validation')).toBe(false);

    // not allowed
    expect(guards.isAllowedStarterFlowPath('/admin/analytics')).toBe(false);
    expect(guards.isAllowedStarterFlowPath('')).toBe(false);
  });
});


