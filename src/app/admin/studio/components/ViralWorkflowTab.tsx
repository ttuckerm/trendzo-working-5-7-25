'use client'

import ViralWorkflowComponent from '@/app/admin/viral-studio/page'

export function ViralWorkflowTab() {
  return (
    <div className="viral-workflow-content">
      <div data-testid="starter-surface-probe" style={{ display: 'none' }} />
      <div className="workflow-container bg-black text-white min-h-screen -mx-8 -mb-16 relative">
        <ViralWorkflowComponent initialView="workflow" hideViewSwitcher />
      </div>
    </div>
  );
}
