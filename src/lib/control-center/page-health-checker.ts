import { PageHealth, WorkflowHealth, HealthStatus } from './types';
import { PAGE_DEFINITIONS } from './constants';

// Known issues mapping - in production this would come from a database
const KNOWN_ISSUES: Record<string, Record<string, { status: HealthStatus; error?: string }>> = {
  'upload-test': {
    'prediction-pipeline': { 
      status: 'healthy', 
      error: undefined 
    }
  },
  'bulk-download': {
    'bulk-downloader': { 
      status: 'error', 
      error: 'Kling API connection timeout' 
    }
  },
  'auth-signup': {
    'signup-flow': { 
      status: 'error', 
      error: 'Email verification not configured' 
    }
  },
  'algorithm-iq': {
    'accuracy-tracker': { 
      status: 'warning', 
      error: 'Insufficient data points for 30-day trend' 
    }
  },
  'calibration': {
    'diagnostic-runner': { 
      status: 'healthy'
    },
    'calibration-config': { 
      status: 'healthy'
    },
    'auto-calibrator': { 
      status: 'healthy'
    }
  }
};

// Check workflow health for a specific page
async function checkWorkflowHealth(pageId: string, workflowId: string, workflowName: string): Promise<WorkflowHealth> {
  const issue = KNOWN_ISSUES[pageId]?.[workflowId];
  
  return {
    id: workflowId,
    name: workflowName,
    status: issue?.status || 'healthy',
    lastRun: new Date().toISOString(),
    error: issue?.error
  };
}

// Get overall page status from workflow statuses
function getPageStatus(workflows: WorkflowHealth[]): HealthStatus {
  if (workflows.some(w => w.status === 'error')) return 'error';
  if (workflows.some(w => w.status === 'warning')) return 'warning';
  return 'healthy';
}

// Main function to check all pages
export async function checkAllPagesHealth(): Promise<PageHealth[]> {
  const results: PageHealth[] = [];
  
  for (const page of PAGE_DEFINITIONS) {
    const workflowHealths: WorkflowHealth[] = [];
    
    for (const workflow of page.workflows) {
      const health = await checkWorkflowHealth(page.id, workflow.id, workflow.name);
      workflowHealths.push(health);
    }
    
    const status = getPageStatus(workflowHealths);
    const errorWorkflow = workflowHealths.find(w => w.status === 'error' || w.status === 'warning');
    
    results.push({
      id: page.id,
      name: page.name,
      path: page.path,
      description: page.description,
      icon: page.icon,
      status,
      lastChecked: new Date().toISOString(),
      lastError: errorWorkflow?.error,
      workflows: workflowHealths,
      components: page.components
    });
  }
  
  return results;
}

// Check single page health
export async function checkPageHealth(pageId: string): Promise<PageHealth | null> {
  const page = PAGE_DEFINITIONS.find(p => p.id === pageId);
  if (!page) return null;
  
  const workflowHealths: WorkflowHealth[] = [];
  
  for (const workflow of page.workflows) {
    const health = await checkWorkflowHealth(page.id, workflow.id, workflow.name);
    workflowHealths.push(health);
  }
  
  const status = getPageStatus(workflowHealths);
  const errorWorkflow = workflowHealths.find(w => w.status === 'error' || w.status === 'warning');
  
  return {
    id: page.id,
    name: page.name,
    path: page.path,
    description: page.description,
    icon: page.icon,
    status,
    lastChecked: new Date().toISOString(),
    lastError: errorWorkflow?.error,
    workflows: workflowHealths,
    components: page.components
  };
}

// Get page count by status
export function getPageCountByStatus(pages: PageHealth[]): { healthy: number; warning: number; error: number } {
  return {
    healthy: pages.filter(p => p.status === 'healthy').length,
    warning: pages.filter(p => p.status === 'warning').length,
    error: pages.filter(p => p.status === 'error').length
  };
}





