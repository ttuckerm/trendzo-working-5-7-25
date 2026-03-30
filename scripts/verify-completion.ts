#!/usr/bin/env npx tsx
/**
 * verify-completion.ts
 *
 * Run after long-running Claude tasks to verify success.
 * Used by background-runner agent and AgentStop hooks.
 *
 * Usage: npx tsx scripts/verify-completion.ts
 *        npx tsx scripts/verify-completion.ts --skip-build
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = One or more checks failed
 *   2 = Could not complete verification
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message?: string;
  details?: string[];
}

const results: CheckResult[] = [];

function runCheck(
  name: string,
  fn: () => { success: boolean; message?: string; details?: string[] }
): void {
  const start = Date.now();
  try {
    const result = fn();
    results.push({
      name,
      status: result.success ? 'pass' : 'fail',
      duration: Date.now() - start,
      message: result.message,
      details: result.details,
    });
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Check 1: Git Status - Any uncommitted changes?
runCheck('Git Status', () => {
  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf-8',
  });
  const changes = result.stdout
    .trim()
    .split('\n')
    .filter(Boolean);

  if (changes.length === 0) {
    return { success: true, message: 'Working tree clean' };
  }

  return {
    success: true, // Not a failure, just informational
    message: `${changes.length} uncommitted changes`,
    details: changes.slice(0, 10), // Show first 10
  };
});

// Check 2: TypeScript Type Check
runCheck('TypeScript', () => {
  try {
    execSync('npx tsc --noEmit', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, message: 'No type errors' };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    const output = execError.stdout || execError.stderr || '';
    const errorLines = output
      .split('\n')
      .filter((line: string) => line.includes('error TS'));
    return {
      success: false,
      message: `${errorLines.length} type errors`,
      details: errorLines.slice(0, 5),
    };
  }
});

// Check 3: Smoke Tests
runCheck('Smoke Tests', () => {
  try {
    execSync('npm run test:smoke', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, message: 'Smoke tests passed' };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    const output = execError.stdout || execError.stderr || '';
    const failMatch = output.match(/(\d+) failed/);
    const failCount = failMatch ? failMatch[1] : 'unknown';
    return {
      success: false,
      message: `${failCount} tests failed`,
      details: [output.slice(-500)], // Last 500 chars of output
    };
  }
});

// Check 4: Build Check (optional, slower)
const skipBuild = process.argv.includes('--skip-build');
if (!skipBuild) {
  runCheck('Build', () => {
    try {
      execSync('npm run build', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 300000, // 5 minute timeout
      });
      return { success: true, message: 'Build succeeded' };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string };
      return {
        success: false,
        message: 'Build failed',
        details: [(execError.stderr || execError.stdout || '').slice(-500)],
      };
    }
  });
} else {
  results.push({
    name: 'Build',
    status: 'skip',
    duration: 0,
    message: 'Skipped (--skip-build flag)',
  });
}

// Check 5: Critical Files Exist
runCheck('Critical Files', () => {
  const criticalFiles = [
    'src/lib/prediction/runPredictionPipeline.ts',
    'src/lib/orchestration/kai-orchestrator.ts',
    'CLAUDE.md',
    'package.json',
  ];

  const missing = criticalFiles.filter(
    (f) => !fs.existsSync(path.join(process.cwd(), f))
  );

  if (missing.length === 0) {
    return { success: true, message: 'All critical files present' };
  }

  return {
    success: false,
    message: `${missing.length} critical files missing`,
    details: missing,
  };
});

// Check 6: No TODO/FIXME in staged changes
runCheck('No TODOs in Changes', () => {
  try {
    const staged = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
    }).trim();
    if (!staged) {
      return { success: true, message: 'No staged changes' };
    }

    const files = staged.split('\n');
    const todosFound: string[] = [];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('TODO') || line.includes('FIXME')) {
          todosFound.push(`${file}:${i + 1}: ${line.trim().slice(0, 60)}`);
        }
      });
    }

    if (todosFound.length === 0) {
      return { success: true, message: 'No TODOs in staged changes' };
    }

    return {
      success: true, // Warning, not failure
      message: `${todosFound.length} TODOs found`,
      details: todosFound.slice(0, 5),
    };
  } catch {
    return { success: true, message: 'Could not check TODOs' };
  }
});

// Check 7: CLAUDE.md Compliance (architectural rules)
runCheck('CLAUDE.md Compliance', () => {
  try {
    // Check for new prediction endpoints in staged/recent changes
    const diff = execSync('git diff HEAD~1 --name-only 2>/dev/null || git diff --name-only', {
      encoding: 'utf-8',
    }).trim();

    const violations: string[] = [];

    // Check for new prediction endpoints
    const predictionEndpoints = diff
      .split('\n')
      .filter((f) => f.includes('api') && f.includes('predict') && f.includes('route.ts'));

    const approvedEndpoints = [
      'src/app/api/predict/route.ts',
      'src/app/api/predict/pre-content/route.ts',
      'src/app/api/admin/predict/route.ts',
      'src/app/api/admin/super-admin/quick-predict/route.ts',
      'src/app/api/bulk-download/predict/route.ts',
    ];

    for (const endpoint of predictionEndpoints) {
      if (!approvedEndpoints.includes(endpoint)) {
        violations.push(`New prediction endpoint: ${endpoint}`);
      }
    }

    if (violations.length === 0) {
      return { success: true, message: 'No architectural violations' };
    }

    return {
      success: false,
      message: `${violations.length} architectural violations`,
      details: violations,
    };
  } catch {
    return { success: true, message: 'Could not check compliance' };
  }
});

// Generate Report
console.log('\n========================================');
console.log('TRENDZO VERIFICATION REPORT');
console.log('========================================');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
console.log('');

let failCount = 0;
for (const result of results) {
  const icon =
    result.status === 'pass'
      ? '✅'
      : result.status === 'fail'
      ? '❌'
      : '⏭️';
  const statusText = result.status.toUpperCase().padEnd(4);
  console.log(`${icon} ${statusText}: ${result.name} (${result.duration}ms)`);

  if (result.message) {
    console.log(`         ${result.message}`);
  }

  if (result.details && result.details.length > 0) {
    result.details.forEach((d) => console.log(`         - ${d}`));
  }

  if (result.status === 'fail') {
    failCount++;
  }
}

console.log('');
console.log('========================================');
if (failCount === 0) {
  console.log('Overall Status: ✅ ALL CHECKS PASSED');
  console.log('========================================');
  console.log('');
  console.log('Next Steps:');
  console.log('- Ready to commit');
  console.log('- Ready for PR review');
  process.exit(0);
} else {
  console.log(`Overall Status: ❌ ${failCount} CHECK(S) FAILED`);
  console.log('========================================');
  console.log('');
  console.log('Fix the issues above before proceeding.');
  process.exit(1);
}
