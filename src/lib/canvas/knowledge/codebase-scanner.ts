import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const MAX_FILE_SIZE = 100_000; // 100KB — skip files larger than this

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'frameworks-and-research',
  '.planning',
  '.claude',
  'data',
  'models',
  'playwright',
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.mp3', '.wav', '.webm',
  '.zip', '.tar', '.gz',
  '.pdf', '.pkl',
]);

export interface CodebaseEntry {
  file: string;
  type: 'page' | 'api' | 'component' | 'lib' | 'migration' | 'types' | 'config';
  route?: string;
  name?: string;
  methods?: string[];
  exports?: string[];
  tables?: string[];
  columns?: Record<string, string[]>;
}

export interface CodebaseIndex {
  generatedAt: string;
  totalFiles: number;
  pages: CodebaseEntry[];
  apiRoutes: CodebaseEntry[];
  components: CodebaseEntry[];
  libs: CodebaseEntry[];
  migrations: CodebaseEntry[];
  types: CodebaseEntry[];
  configs: CodebaseEntry[];
  envVars: string[];
  dependencies: string[];
}

let _cachedIndex: CodebaseIndex | null = null;

export function getCodebaseIndex(): CodebaseIndex {
  if (!_cachedIndex) {
    _cachedIndex = buildCodebaseIndex();
  }
  return _cachedIndex;
}

export function clearCodebaseCache(): void {
  _cachedIndex = null;
}

// ---------------------------------------------------------------------------
// Directory walker
// ---------------------------------------------------------------------------

function walkDir(dir: string, results: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) {
          console.warn(`[Codebase Scanner] Skipping large file: ${fullPath} (${Math.round(stat.size / 1024)}KB)`);
          continue;
        }
      } catch {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

function toRelative(abs: string): string {
  return path.relative(PROJECT_ROOT, abs).replace(/\\/g, '/');
}

function safeReadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseExports(content: string): string[] {
  const names: string[] = [];
  const re = /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    names.push(m[1]);
  }
  // export default function Name
  const dfRe = /export\s+default\s+(?:async\s+)?(?:function|class)\s+(\w+)/g;
  while ((m = dfRe.exec(content)) !== null) {
    names.push(m[1]);
  }
  if (names.length === 0 && /export\s+default\b/.test(content)) {
    names.push('default');
  }
  return [...new Set(names)];
}

function parseApiMethods(content: string): string[] {
  const methods: string[] = [];
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    methods.push(m[1]);
  }
  return methods;
}

function parseSqlTables(content: string): { tables: string[]; columns: Record<string, string[]> } {
  const tables: string[] = [];
  const columns: Record<string, string[]> = {};

  // CREATE TABLE
  const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)(?:\n\))/gi;
  let m: RegExpExecArray | null;
  while ((m = createRe.exec(content)) !== null) {
    const tableName = m[1];
    if (!tables.includes(tableName)) tables.push(tableName);

    const body = m[2];
    const cols: string[] = [];
    const colRe = /^\s+(\w+)\s+(?:UUID|TEXT|INTEGER|INT|BIGINT|SERIAL|BOOLEAN|BOOL|JSONB|JSON|FLOAT|DOUBLE|NUMERIC|VARCHAR|TIMESTAMPTZ|TIMESTAMP|DATE|TIME)\b/gim;
    let cm: RegExpExecArray | null;
    while ((cm = colRe.exec(body)) !== null) {
      cols.push(cm[1]);
    }
    if (cols.length > 0) columns[tableName] = cols;
  }

  // ALTER TABLE (pick up tables not caught by CREATE)
  const alterRe = /ALTER\s+TABLE\s+(\w+)/gi;
  while ((m = alterRe.exec(content)) !== null) {
    if (!tables.includes(m[1])) tables.push(m[1]);
  }

  return { tables, columns };
}

function filePathToRoute(filePath: string): string {
  // src/app/admin/studio/page.tsx -> /admin/studio
  // src/app/api/canvas/ai/chat/route.ts -> /api/canvas/ai/chat
  let route = filePath
    .replace(/^src\/app/, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/route\.ts$/, '');

  // Handle dynamic segments: [projectId] stays as-is
  if (route === '') route = '/';
  return route;
}

function extractComponentName(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename;
}

// ---------------------------------------------------------------------------
// Env + package.json
// ---------------------------------------------------------------------------

function parseEnvVars(): string[] {
  const vars: string[] = [];
  const candidates = ['.env.example', '.env.local.example'];
  for (const f of candidates) {
    const content = safeReadFile(path.join(PROJECT_ROOT, f));
    if (!content) continue;
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        vars.push(trimmed.substring(0, eqIdx).trim());
      }
    }
  }
  return [...new Set(vars)];
}

function parseDependencies(): string[] {
  const content = safeReadFile(path.join(PROJECT_ROOT, 'package.json'));
  if (!content) return [];
  try {
    const pkg = JSON.parse(content);
    return [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ].sort();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

function buildCodebaseIndex(): CodebaseIndex {
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const migrationsDir = path.join(PROJECT_ROOT, 'supabase', 'migrations');

  const allFiles = walkDir(srcDir);
  const migrationFiles = walkDir(migrationsDir);

  const pages: CodebaseEntry[] = [];
  const apiRoutes: CodebaseEntry[] = [];
  const components: CodebaseEntry[] = [];
  const libs: CodebaseEntry[] = [];
  const types: CodebaseEntry[] = [];
  const configs: CodebaseEntry[] = [];

  for (const abs of allFiles) {
    const rel = toRelative(abs);
    const basename = path.basename(abs);
    const ext = path.extname(abs).toLowerCase();

    // Page routes
    if (basename === 'page.tsx' && rel.startsWith('src/app/')) {
      pages.push({
        file: rel,
        type: 'page',
        route: filePathToRoute(rel),
      });
      continue;
    }

    // API routes
    if (basename === 'route.ts' && rel.startsWith('src/app/api/')) {
      const content = safeReadFile(abs);
      apiRoutes.push({
        file: rel,
        type: 'api',
        route: filePathToRoute(rel),
        methods: parseApiMethods(content),
      });
      continue;
    }

    // Components: anything in _components/ dirs or src/components/
    if (ext === '.tsx') {
      const isInComponentsDir =
        rel.includes('/_components/') || rel.startsWith('src/components/');
      if (isInComponentsDir) {
        components.push({
          file: rel,
          type: 'component',
          name: extractComponentName(abs),
        });
        continue;
      }
    }

    // Type definitions
    if (
      basename.endsWith('.types.ts') ||
      basename === 'types.ts' ||
      rel.includes('/types/')
    ) {
      const content = safeReadFile(abs);
      types.push({
        file: rel,
        type: 'types',
        exports: parseExports(content),
      });
      continue;
    }

    // Lib modules (only .ts files under src/lib/)
    if (ext === '.ts' && rel.startsWith('src/lib/')) {
      const content = safeReadFile(abs);
      libs.push({
        file: rel,
        type: 'lib',
        name: path.basename(abs, '.ts'),
        exports: parseExports(content),
      });
      continue;
    }
  }

  // Migrations
  const migrations: CodebaseEntry[] = [];
  for (const abs of migrationFiles) {
    const ext = path.extname(abs).toLowerCase();
    if (ext !== '.sql') continue;
    const rel = toRelative(abs);
    const content = safeReadFile(abs);
    const { tables, columns } = parseSqlTables(content);
    migrations.push({
      file: rel,
      type: 'migration',
      tables,
      columns,
    });
  }

  // Config files
  const configFiles = [
    'next.config.mjs',
    'next.config.js',
    'next.config.ts',
    'tailwind.config.ts',
    'tailwind.config.js',
    'tsconfig.json',
    'jest.config.js',
    'jest.config.ts',
  ];
  for (const f of configFiles) {
    const abs = path.join(PROJECT_ROOT, f);
    try {
      fs.accessSync(abs, fs.constants.R_OK);
      configs.push({ file: f, type: 'config' });
    } catch {
      // file doesn't exist — skip
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalFiles:
      pages.length +
      apiRoutes.length +
      components.length +
      libs.length +
      migrations.length +
      types.length +
      configs.length,
    pages,
    apiRoutes,
    components,
    libs,
    migrations,
    types,
    configs,
    envVars: parseEnvVars(),
    dependencies: parseDependencies(),
  };
}
