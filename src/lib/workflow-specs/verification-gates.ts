/**
 * Verification Gates System
 * 
 * Enforces verification before proceeding to the next sprint/phase.
 * Following the Product Operations Pack verification protocol.
 * 
 * RULE: No evidence = No sign-off = Cannot proceed
 */

// =============================================================================
// VERIFICATION TYPES
// =============================================================================

export type VerificationStatus = 'pending' | 'passed' | 'failed' | 'skipped';

export interface VerificationCriterion {
  id: string;
  description: string;
  category: 'required' | 'recommended';
  status: VerificationStatus;
  evidence?: string; // URL to screenshot, console output, or description
  testedAt?: string;
  notes?: string;
}

export interface VerificationGate {
  id: string;
  name: string;
  sprint: string;
  phase: string;
  criteria: VerificationCriterion[];
  status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  signedOffBy?: string;
  signedOffAt?: string;
  blockingIssues: string[];
}

// =============================================================================
// SPRINT VERIFICATION GATES
// =============================================================================

/**
 * Creates a verification gate for Sprint 1: Research Phase
 */
export function createSprint1Gate(): VerificationGate {
  return {
    id: 'gate_sprint_1',
    name: 'Sprint 1: Research Phase',
    sprint: 'sprint_1',
    phase: 'research',
    criteria: [
      {
        id: 'v1_1',
        description: 'Niche selector renders with all 20+ categories',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_2',
        description: 'Selecting niche persists to localStorage',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_3',
        description: 'Audience demographics selector works (4 age bands)',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_4',
        description: 'Content Purpose (Know/Like/Trust) selection works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_5',
        description: 'Goals/KPIs input saves correctly',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_6',
        description: 'Exemplar Swoop loads real videos from database',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_7',
        description: '"Save Research & Continue" button advances to Plan phase',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v1_8',
        description: 'All state persists on page refresh',
        category: 'required',
        status: 'pending',
      },
    ],
    status: 'not_started',
    blockingIssues: [],
  };
}

/**
 * Creates a verification gate for Sprint 2: Plan Phase
 */
export function createSprint2Gate(): VerificationGate {
  return {
    id: 'gate_sprint_2',
    name: 'Sprint 2: Plan Phase',
    sprint: 'sprint_2',
    phase: 'plan',
    criteria: [
      {
        id: 'v2_1',
        description: 'Keyword selection interface renders',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_2',
        description: 'Keywords can be entered and saved',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_3',
        description: 'Content topic input works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_4',
        description: 'Format analysis selector shows all 10 options',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_5',
        description: 'Content pillar selection works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_6',
        description: 'Content goals mapper saves correctly',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_7',
        description: '"Save Plan & Continue" advances to Create phase',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v2_8',
        description: 'Back button returns to Research with data intact',
        category: 'required',
        status: 'pending',
      },
    ],
    status: 'not_started',
    blockingIssues: [],
  };
}

/**
 * Creates a verification gate for Sprint 3: Create Phase
 */
export function createSprint3Gate(): VerificationGate {
  return {
    id: 'gate_sprint_3',
    name: 'Sprint 3: Create Phase',
    sprint: 'sprint_3',
    phase: 'create',
    criteria: [
      {
        id: 'v3_1',
        description: 'Beat editor renders with 4 sections (Hook, Proof, Value, CTA)',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v3_2',
        description: 'Beat text can be entered and saves',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v3_3',
        description: 'SEO pack generator produces hashtags',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v3_4',
        description: 'On-screen text editor works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v3_5',
        description: 'Caption generator produces content',
        category: 'recommended',
        status: 'pending',
      },
      {
        id: 'v3_6',
        description: '"Continue to Optimize" advances to Optimize phase',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v3_7',
        description: 'All create data persists to localStorage',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v3_8',
        description: 'Plan data still accessible from previous phase',
        category: 'required',
        status: 'pending',
      },
    ],
    status: 'not_started',
    blockingIssues: [],
  };
}

/**
 * Creates a verification gate for Sprint 4: Optimize Phase
 */
export function createSprint4Gate(): VerificationGate {
  return {
    id: 'gate_sprint_4',
    name: 'Sprint 4: Optimize Phase',
    sprint: 'sprint_4',
    phase: 'optimize',
    criteria: [
      {
        id: 'v4_1',
        description: 'Optimization checklist renders with all items',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v4_2',
        description: 'Checklist items can be toggled',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v4_3',
        description: '"Get Prediction" button calls /api/kai/predict',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v4_4',
        description: 'DPS score displays after prediction',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v4_5',
        description: 'Confidence and range display correctly',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v4_6',
        description: 'Recommendations are shown (Pack 1/2 output)',
        category: 'recommended',
        status: 'pending',
      },
      {
        id: 'v4_7',
        description: 'Prediction completes in < 25 seconds',
        category: 'required',
        status: 'pending',
      },
    ],
    status: 'not_started',
    blockingIssues: [],
  };
}

/**
 * Creates a verification gate for Sprint 5: Publish Phase
 */
export function createSprint5Gate(): VerificationGate {
  return {
    id: 'gate_sprint_5',
    name: 'Sprint 5: Publish Phase',
    sprint: 'sprint_5',
    phase: 'publish',
    criteria: [
      {
        id: 'v5_1',
        description: 'Platform selector shows all 4 options',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v5_2',
        description: 'Platform can be selected',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v5_3',
        description: 'Caption copy button works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v5_4',
        description: 'Hashtags copy button works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v5_5',
        description: 'Publish or Schedule action works',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v5_6',
        description: 'Status updates after publish/schedule',
        category: 'required',
        status: 'pending',
      },
    ],
    status: 'not_started',
    blockingIssues: [],
  };
}

/**
 * Creates a verification gate for Sprint 6: Engage & Learn Phase
 */
export function createSprint6Gate(): VerificationGate {
  return {
    id: 'gate_sprint_6',
    name: 'Sprint 6: Engage & Learn Phase',
    sprint: 'sprint_6',
    phase: 'engage',
    criteria: [
      {
        id: 'v6_1',
        description: 'Results tracker renders with metric inputs',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v6_2',
        description: 'Metrics can be entered and saved',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v6_3',
        description: 'Performance analysis displays when metrics entered',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v6_4',
        description: 'Content iteration step loads with suggestions',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v6_5',
        description: 'Lessons learned can be added',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v6_6',
        description: 'Improvements for next time can be added',
        category: 'required',
        status: 'pending',
      },
      {
        id: 'v6_7',
        description: '"Complete Workflow" button works',
        category: 'required',
        status: 'pending',
      },
    ],
    status: 'not_started',
    blockingIssues: [],
  };
}

// =============================================================================
// GATE OPERATIONS
// =============================================================================

/**
 * Calculates gate status based on criteria
 */
export function calculateGateStatus(gate: VerificationGate): VerificationGate['status'] {
  const requiredCriteria = gate.criteria.filter(c => c.category === 'required');
  const allRequiredPassed = requiredCriteria.every(c => c.status === 'passed');
  const anyFailed = gate.criteria.some(c => c.status === 'failed');
  const anyInProgress = gate.criteria.some(c => c.status === 'pending' && c.testedAt);
  
  if (allRequiredPassed && !anyFailed) return 'passed';
  if (anyFailed) return 'failed';
  if (anyInProgress || gate.startedAt) return 'in_progress';
  return 'not_started';
}

/**
 * Updates a criterion in a gate
 */
export function updateCriterion(
  gate: VerificationGate,
  criterionId: string,
  update: Partial<VerificationCriterion>
): VerificationGate {
  const updatedCriteria = gate.criteria.map(c =>
    c.id === criterionId ? { ...c, ...update, testedAt: new Date().toISOString() } : c
  );
  
  const updatedGate = {
    ...gate,
    criteria: updatedCriteria,
    startedAt: gate.startedAt || new Date().toISOString(),
  };
  
  return {
    ...updatedGate,
    status: calculateGateStatus(updatedGate),
  };
}

/**
 * Signs off a gate (only if all required criteria pass)
 */
export function signOffGate(
  gate: VerificationGate,
  signedOffBy: string
): VerificationGate | { error: string } {
  const requiredCriteria = gate.criteria.filter(c => c.category === 'required');
  const failedRequired = requiredCriteria.filter(c => c.status !== 'passed');
  
  if (failedRequired.length > 0) {
    return {
      error: `Cannot sign off: ${failedRequired.length} required criteria not passed: ${failedRequired.map(c => c.description).join(', ')}`,
    };
  }
  
  return {
    ...gate,
    status: 'passed',
    signedOffBy,
    signedOffAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

/**
 * Checks if a gate can proceed
 */
export function canProceedPastGate(gate: VerificationGate): boolean {
  return gate.status === 'passed' && !!gate.signedOffAt;
}

// =============================================================================
// VERIFICATION REPORT
// =============================================================================

export interface VerificationReport {
  gateId: string;
  gateName: string;
  sprint: string;
  generatedAt: string;
  
  summary: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    skipped: number;
  };
  
  criteria: {
    required: VerificationCriterion[];
    recommended: VerificationCriterion[];
  };
  
  blockingIssues: string[];
  overallStatus: VerificationGate['status'];
  readyToSignOff: boolean;
}

/**
 * Generates a verification report for a gate
 */
export function generateVerificationReport(gate: VerificationGate): VerificationReport {
  const criteria = gate.criteria;
  
  const summary = {
    total: criteria.length,
    passed: criteria.filter(c => c.status === 'passed').length,
    failed: criteria.filter(c => c.status === 'failed').length,
    pending: criteria.filter(c => c.status === 'pending').length,
    skipped: criteria.filter(c => c.status === 'skipped').length,
  };
  
  const requiredCriteria = criteria.filter(c => c.category === 'required');
  const readyToSignOff = requiredCriteria.every(c => c.status === 'passed');
  
  return {
    gateId: gate.id,
    gateName: gate.name,
    sprint: gate.sprint,
    generatedAt: new Date().toISOString(),
    summary,
    criteria: {
      required: criteria.filter(c => c.category === 'required'),
      recommended: criteria.filter(c => c.category === 'recommended'),
    },
    blockingIssues: gate.blockingIssues,
    overallStatus: gate.status,
    readyToSignOff,
  };
}

/**
 * Formats a verification report as text (for console/logs)
 */
export function formatVerificationReportText(report: VerificationReport): string {
  const lines: string[] = [
    `=`.repeat(60),
    `${report.gateName} - VERIFICATION REPORT`,
    `=`.repeat(60),
    `Generated: ${report.generatedAt}`,
    ``,
    `SUMMARY:`,
    `  Total Criteria: ${report.summary.total}`,
    `  Passed: ${report.summary.passed}`,
    `  Failed: ${report.summary.failed}`,
    `  Pending: ${report.summary.pending}`,
    `  Skipped: ${report.summary.skipped}`,
    ``,
    `STATUS: ${report.overallStatus.toUpperCase()}`,
    `Ready to Sign Off: ${report.readyToSignOff ? 'YES' : 'NO'}`,
    ``,
    `-`.repeat(60),
    `REQUIRED CRITERIA:`,
  ];
  
  for (const c of report.criteria.required) {
    const statusIcon = c.status === 'passed' ? '✅' : c.status === 'failed' ? '❌' : '⏳';
    lines.push(`  ${statusIcon} ${c.description}`);
    if (c.evidence) lines.push(`     Evidence: ${c.evidence}`);
    if (c.notes) lines.push(`     Notes: ${c.notes}`);
  }
  
  lines.push(``);
  lines.push(`RECOMMENDED CRITERIA:`);
  
  for (const c of report.criteria.recommended) {
    const statusIcon = c.status === 'passed' ? '✅' : c.status === 'failed' ? '⚠️' : '⏳';
    lines.push(`  ${statusIcon} ${c.description}`);
  }
  
  if (report.blockingIssues.length > 0) {
    lines.push(``);
    lines.push(`BLOCKING ISSUES:`);
    for (const issue of report.blockingIssues) {
      lines.push(`  🚫 ${issue}`);
    }
  }
  
  lines.push(`=`.repeat(60));
  
  return lines.join('\n');
}

// =============================================================================
// WORKFLOW VERIFICATION STATE
// =============================================================================

export interface WorkflowVerificationState {
  workflowId: string;
  gates: Record<string, VerificationGate>;
  currentGateId: string | null;
  lastSignedOffGateId: string | null;
}

/**
 * Creates initial verification state for a workflow
 */
export function createWorkflowVerificationState(workflowId: string): WorkflowVerificationState {
  return {
    workflowId,
    gates: {
      gate_sprint_1: createSprint1Gate(),
      gate_sprint_2: createSprint2Gate(),
      gate_sprint_3: createSprint3Gate(),
      gate_sprint_4: createSprint4Gate(),
    },
    currentGateId: 'gate_sprint_1',
    lastSignedOffGateId: null,
  };
}

/**
 * Gets the next gate after the current one
 */
export function getNextGate(state: WorkflowVerificationState): VerificationGate | null {
  const gateOrder = ['gate_sprint_1', 'gate_sprint_2', 'gate_sprint_3', 'gate_sprint_4'];
  const currentIndex = state.currentGateId ? gateOrder.indexOf(state.currentGateId) : -1;
  
  if (currentIndex < 0 || currentIndex >= gateOrder.length - 1) {
    return null;
  }
  
  return state.gates[gateOrder[currentIndex + 1]];
}

// =============================================================================
// SESSION HANDOFF
// =============================================================================

export interface SessionHandoff {
  date: string;
  
  completed: {
    stepId: string;
    stepName: string;
    verified: boolean;
  }[];
  
  inProgress: {
    stepId: string;
    stepName: string;
    progress: string;
  }[];
  
  currentState: {
    branch: string;
    lastCommit: string;
    verificationGate: string;
    gateProgress: string;
  };
  
  nextSession: {
    tasks: string[];
    blockers: string[];
  };
}

/**
 * Creates a session handoff document
 */
export function createSessionHandoff(
  completedSteps: { stepId: string; stepName: string; verified: boolean }[],
  inProgressSteps: { stepId: string; stepName: string; progress: string }[],
  currentState: { branch: string; lastCommit: string; verificationGate: string; gateProgress: string },
  nextTasks: string[],
  blockers: string[]
): SessionHandoff {
  return {
    date: new Date().toISOString(),
    completed: completedSteps,
    inProgress: inProgressSteps,
    currentState,
    nextSession: {
      tasks: nextTasks,
      blockers,
    },
  };
}

/**
 * Formats session handoff as markdown
 */
export function formatSessionHandoffMarkdown(handoff: SessionHandoff): string {
  const lines: string[] = [
    `## Session Handoff - ${new Date(handoff.date).toLocaleDateString()}`,
    ``,
    `### Completed`,
  ];
  
  for (const step of handoff.completed) {
    const icon = step.verified ? '✅' : '⚠️';
    const verifiedText = step.verified ? 'VERIFIED' : 'NOT VERIFIED';
    lines.push(`- [x] ${step.stepName} - ${verifiedText} ${icon}`);
  }
  
  if (handoff.inProgress.length > 0) {
    lines.push(``);
    lines.push(`### In Progress`);
    for (const step of handoff.inProgress) {
      lines.push(`- [ ] ${step.stepName} - ${step.progress}`);
    }
  }
  
  lines.push(``);
  lines.push(`### Current State`);
  lines.push(`- Branch: \`${handoff.currentState.branch}\``);
  lines.push(`- Last commit: \`${handoff.currentState.lastCommit}\``);
  lines.push(`- Verification gate: ${handoff.currentState.verificationGate}`);
  lines.push(`- Gate progress: ${handoff.currentState.gateProgress}`);
  
  lines.push(``);
  lines.push(`### Next Session`);
  for (const task of handoff.nextSession.tasks) {
    lines.push(`- ${task}`);
  }
  
  if (handoff.nextSession.blockers.length > 0) {
    lines.push(``);
    lines.push(`### Blocking Issues`);
    for (const blocker of handoff.nextSession.blockers) {
      lines.push(`- 🚫 ${blocker}`);
    }
  }
  
  return lines.join('\n');
}
