import fs from 'fs';
import path from 'path';

export type AlignmentSection = {
  expected: string[];
  found: string[];
  missing: string[];
  coverage: number;
};

export type AlignmentReport = {
  generatedAt: string;
  root: string;
  docsRoot: string;
  srcRoot: string;
  summary: {
    score: number;
    level: 'good' | 'fair' | 'poor';
    notes: string[];
  };
  details: {
    adminTabs: AlignmentSection;
    apiEndpoints: AlignmentSection;
    dataEntities: AlignmentSection;
    uxTestIds: AlignmentSection;
    telemetryEvents: AlignmentSection;
  };
  files: {
    reportJsonPath: string;
    reportMarkdownPath: string;
  };
};

const DEFAULT_ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'methodology');

function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function safeReadFileSync(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function listFilesRecursively(startDir: string, options?: { includeExt?: string[]; maxFiles?: number }): string[] {
  const includeExt = options?.includeExt || ['.ts', '.tsx', '.js', '.jsx', '.md'];
  const maxFiles = options?.maxFiles ?? 5000; // prevent runaway on very large repos
  const results: string[] = [];
  const stack: string[] = [startDir];

  while (stack.length > 0) {
    const dir = stack.pop() as string;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) return results;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (includeExt.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  return results;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_/]/g, '');
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // one decimal place
}

// ---- Extractors from methodology_pack docs ----

function getDocsRoot(projectRoot: string): string {
  return path.join(projectRoot, 'docs', 'methodology_pack');
}

function extractAdminTabs(docsRoot: string): string[] {
  const adminDir = path.join(docsRoot, '01_admin_recipe_book');
  try {
    const files = fs.readdirSync(adminDir).filter((f) => f.startsWith('tab_') && f.endsWith('.md'));
    const tabs = files.map((f) => {
      const base = f.replace(/\.md$/i, '');
      const label = base.split('_').slice(2).join('_') || base; // e.g., tab_1_templates -> templates
      return normalizeName(label.replace(/^\d+_?/, ''));
    });
    return unique(tabs);
  } catch {
    return [];
  }
}

function extractApiPaths(docsRoot: string): string[] {
  const apiDir = path.join(docsRoot, '05_api_catalog');
  const files = ['internal_services.md', 'external_integrations.md'];
  const pathsFound: string[] = [];
  for (const f of files) {
    const content = safeReadFileSync(path.join(apiDir, f));
    if (!content) continue;
    const regexes: RegExp[] = [
      /(GET|POST|PUT|PATCH|DELETE)\s+`?(\/api\/[A-Za-z0-9_\-\/]+)`?/gi,
      /`(\/api\/[A-Za-z0-9_\-\/]+)`/g,
      /\b(\/api\/[A-Za-z0-9_\-\/]+)\b/g,
    ];
    for (const re of regexes) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        const p = m[m.length - 1];
        if (p && p.startsWith('/api/')) pathsFound.push(p);
      }
    }
  }
  // Filter obvious placeholders or non-meaningful paths
  const filtered = unique(pathsFound).filter((p) => {
    // Exclude numeric or single-segment like /api/2
    const parts = p.split('/').filter(Boolean);
    if (parts.length <= 2 && /\/api\/[0-9]+$/.test(p)) return false;
    return true;
  });
  return filtered.sort();
}

function extractDataEntities(docsRoot: string): string[] {
  const file = path.join(docsRoot, '06_data_db', 'entities_and_fields.md');
  const content = safeReadFileSync(file);
  if (!content) return [];
  const entities = new Set<string>();
  const headingRe = /^(?:##+|\*\*)\s*([A-Za-z][A-Za-z0-9_\- ]{1,60})/gm;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(content)) !== null) {
    const name = m[1].trim();
    if (name && !/fields|entities|schema|table|index|notes/i.test(name)) {
      entities.add(name.replace(/\*\*$/,'').trim());
    }
  }
  // also parse bullets like - Entity: Name
  const bulletRe = /^\s*[-*]\s*(?:Entity|Table|Type)\s*:\s*([A-Za-z][A-Za-z0-9_\- ]+)/gim;
  while ((m = bulletRe.exec(content)) !== null) {
    entities.add(m[1].trim());
  }
  return Array.from(entities).map((e) => e.replace(/\s+/g, ' '));
}

function extractUxTestIds(docsRoot: string): string[] {
  const file = path.join(docsRoot, '07_ux_specs', 'component_testids.md');
  const content = safeReadFileSync(file);
  if (!content) return [];
  const ids: string[] = [];
  const dataAttrRe = /data-testid\s*=\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = dataAttrRe.exec(content)) !== null) {
    ids.push(m[1]);
  }
  // Also capture inline backticked IDs
  const codeRe = /`([A-Za-z0-9_\-]+)`/g;
  while ((m = codeRe.exec(content)) !== null) {
    const id = m[1];
    if (/^[A-Za-z].+/.test(id) && id.length >= 3 && /[-_]/.test(id)) ids.push(id);
  }
  // Remove obviously invalid or placeholder IDs
  const filtered = ids.filter((id) => {
    if (!id) return false;
    const v = id.trim();
    if (v === 'data-testid') return false;
    if (v.includes('${')) return false; // templated placeholders
    if (v.length < 3) return false;
    return true;
  });
  return unique(filtered);
}

function extractTelemetryEvents(docsRoot: string): string[] {
  const file = path.join(docsRoot, '04_template_system', 'telemetry_events.md');
  const content = safeReadFileSync(file);
  if (!content) return [];
  const events: string[] = [];
  const evtRe = /\bEVT\.[A-Za-z0-9_.-]+\b/g;
  let m: RegExpExecArray | null;
  while ((m = evtRe.exec(content)) !== null) {
    events.push(m[0]);
  }
  return unique(events).sort();
}

// ---- Codebase checkers ----

function findAdminTabImplementations(srcRoot: string, tabs: string[]): { found: string[] } {
  const adminDir = path.join(srcRoot, 'app', 'admin');
  const found: string[] = [];
  let files: string[] = [];
  try {
    files = listFilesRecursively(adminDir, { includeExt: ['.ts', '.tsx', '.js', '.jsx'], maxFiles: 3000 });
  } catch {
    files = [];
  }
  for (const tab of tabs) {
    const needle = tab.replace(/-/g, '');
    const matched = files.some((fp) => {
      const name = path.basename(fp).toLowerCase().replace(/-/g, '');
      if (name.includes(needle)) return true;
      const content = safeReadFileSync(fp).toLowerCase();
      return content.includes(tab) || content.includes(needle);
    });
    if (matched) found.push(tab);
  }
  return { found: unique(found) };
}

function mapApiPathToSource(pathname: string, srcRoot: string): string[] {
  // Support Next.js app router and pages API
  const clean = pathname.replace(/^\//, '');
  const parts = clean.split('/');
  if (parts[0] !== 'api') return [];
  const appRouter = path.join(srcRoot, 'app', ...parts, 'route.ts');
  const appRouterJs = path.join(srcRoot, 'app', ...parts, 'route.js');
  const pagesApiTs = path.join(srcRoot, 'pages', ...parts.slice(1)) + '.ts';
  const pagesApiJs = path.join(srcRoot, 'pages', ...parts.slice(1)) + '.js';
  return [appRouter, appRouterJs, pagesApiTs, pagesApiJs];
}

function findApiImplementations(srcRoot: string, apiPaths: string[]): { found: string[] } {
  const found: string[] = [];
  for (const p of apiPaths) {
    const candidates = mapApiPathToSource(p, srcRoot);
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        found.push(p);
        break;
      }
    }
  }
  return { found: unique(found) };
}

function findEntityImplementations(projectRoot: string, entities: string[]): { found: string[] } {
  const searchDirs = [
    path.join(projectRoot, 'src', 'types'),
    path.join(projectRoot, 'schemas'),
    path.join(projectRoot, 'database'),
    path.join(projectRoot, 'src', 'lib'),
  ];
  const files: string[] = unique(
    searchDirs.flatMap((d) => (fs.existsSync(d) ? listFilesRecursively(d, { includeExt: ['.ts', '.tsx', '.js'] }) : []))
  );
  const found = new Set<string>();
  for (const entity of entities) {
    const name = entity.replace(/\s+/g, '');
    const nameLower = name.toLowerCase();
    const matched = files.some((fp) => {
      const base = path.basename(fp).toLowerCase();
      if (base.includes(nameLower)) return true;
      const content = safeReadFileSync(fp);
      const re = new RegExp(`(interface|type|class|enum|const)\s+${name}|\b${name}\b`, 'm');
      return re.test(content);
    });
    if (matched) found.add(entity);
  }
  return { found: Array.from(found) };
}

function findTestIdsInCode(srcRoot: string, testIds: string[]): { found: string[] } {
  const files = listFilesRecursively(srcRoot, { includeExt: ['.tsx', '.ts', '.jsx', '.js'], maxFiles: 8000 });
  const found = new Set<string>();
  for (const id of testIds) {
    const re = new RegExp(`data-testid\\s*=\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
    const matched = files.some((fp) => re.test(safeReadFileSync(fp)));
    if (matched) found.add(id);
  }
  return { found: Array.from(found) };
}

function findEventsInCode(srcRoot: string, events: string[]): { found: string[] } {
  const files = listFilesRecursively(srcRoot, { includeExt: ['.ts', '.tsx', '.js', '.jsx'], maxFiles: 8000 });
  const found = new Set<string>();
  for (const evt of events) {
    const re = new RegExp(evt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const matched = files.some((fp) => re.test(safeReadFileSync(fp)));
    if (matched) found.add(evt);
  }
  return { found: Array.from(found) };
}

function buildSection(expected: string[], found: string[]): AlignmentSection {
  const uniqueExpected = unique(expected);
  const missing = uniqueExpected.filter((e) => !found.includes(e));
  const denominator = uniqueExpected.length;
  const coverage = denominator === 0 ? 100 : pct(found.length, denominator);
  return { expected: uniqueExpected, found, missing, coverage };
}

function computeOverallScore(sections: AlignmentSection[]): { score: number; level: 'good' | 'fair' | 'poor' } {
  // Weighted average: API 30%, Admin Tabs 20%, Data 20%, UX 15%, Events 15%
  const weights = [0.2, 0.3, 0.2, 0.15, 0.15];
  const coverages = sections.map((s) => s.coverage);
  const score = Math.round(
    (coverages[0] * weights[0] + coverages[1] * weights[1] + coverages[2] * weights[2] + coverages[3] * weights[3] +
      coverages[4] * weights[4]) *
      10
  ) / 10;
  let level: 'good' | 'fair' | 'poor' = 'poor';
  if (score >= 80) level = 'good';
  else if (score >= 50) level = 'fair';
  return { score, level };
}

export function generateAlignmentReport(projectRoot = process.cwd()): AlignmentReport {
  const docsRoot = getDocsRoot(projectRoot);
  const srcRoot = path.join(projectRoot, 'src');

  const tabs = extractAdminTabs(docsRoot);
  const apiPaths = extractApiPaths(docsRoot);
  const entities = extractDataEntities(docsRoot);
  const testIds = extractUxTestIds(docsRoot);
  const telemetry = extractTelemetryEvents(docsRoot);

  const adminFound = findAdminTabImplementations(srcRoot, tabs).found;
  const apiFound = findApiImplementations(srcRoot, apiPaths).found;
  const entityFound = findEntityImplementations(projectRoot, entities).found;
  const testIdsFound = findTestIdsInCode(srcRoot, testIds).found;
  const eventsFound = findEventsInCode(srcRoot, telemetry).found;

  const adminTabs = buildSection(tabs, adminFound);
  const apiEndpoints = buildSection(apiPaths, apiFound);
  const dataEntities = buildSection(entities, entityFound);
  const uxTestIds = buildSection(testIds, testIdsFound);
  const telemetryEvents = buildSection(telemetry, eventsFound);

  const { score, level } = computeOverallScore([adminTabs, apiEndpoints, dataEntities, uxTestIds, telemetryEvents]);

  const notes: string[] = [];
  if (adminTabs.coverage < 100) notes.push('Some admin tabs are not discoverable in code.');
  if (apiEndpoints.coverage < 100) notes.push('Some documented API endpoints are not implemented.');
  if (dataEntities.coverage < 100) notes.push('Some data entities not found in code/types.');
  if (uxTestIds.coverage < 100) notes.push('Some UI test IDs missing in components.');
  if (telemetryEvents.coverage < 100) notes.push('Some telemetry events not referenced in code.');

  ensureDirExists(DEFAULT_ARTIFACT_DIR);
  const report: AlignmentReport = {
    generatedAt: new Date().toISOString(),
    root: projectRoot,
    docsRoot,
    srcRoot,
    summary: { score, level, notes },
    details: { adminTabs, apiEndpoints, dataEntities, uxTestIds, telemetryEvents },
    files: {
      reportJsonPath: path.join(DEFAULT_ARTIFACT_DIR, 'report.json'),
      reportMarkdownPath: path.join(DEFAULT_ARTIFACT_DIR, 'report.md'),
    },
  };

  // Persist artifacts
  fs.writeFileSync(report.files.reportJsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(report.files.reportMarkdownPath, renderMarkdown(report), 'utf8');

  return report;
}

export function renderMarkdown(report: AlignmentReport): string {
  const lines: string[] = [];
  lines.push(`# Methodology Alignment Report`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Overall Score: ${report.summary.score}% (${report.summary.level.toUpperCase()})`);
  if (report.summary.notes.length) {
    lines.push('');
    lines.push('Notes:');
    for (const n of report.summary.notes) lines.push(`- ${n}`);
  }
  function sec(title: string, s: AlignmentSection) {
    lines.push('');
    lines.push(`## ${title}`);
    lines.push(`Coverage: ${s.coverage}%  (Found ${s.found.length} / ${s.expected.length})`);
    if (s.missing.length) {
      lines.push('Missing:');
      for (const m of s.missing) lines.push(`- ${m}`);
    }
  }
  sec('Admin Tabs', report.details.adminTabs);
  sec('API Endpoints', report.details.apiEndpoints);
  sec('Data Entities', report.details.dataEntities);
  sec('UX Test IDs', report.details.uxTestIds);
  sec('Telemetry Events', report.details.telemetryEvents);
  return lines.join('\n');
}

export function loadCachedReport(): AlignmentReport | null {
  const file = path.join(DEFAULT_ARTIFACT_DIR, 'report.json');
  try {
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content) as AlignmentReport;
  } catch {
    return null;
  }
}

export function isCacheFresh(maxAgeMs: number): boolean {
  const file = path.join(DEFAULT_ARTIFACT_DIR, 'report.json');
  try {
    const stat = fs.statSync(file);
    const age = Date.now() - stat.mtimeMs;
    return age <= maxAgeMs;
  } catch {
    return false;
  }
}


