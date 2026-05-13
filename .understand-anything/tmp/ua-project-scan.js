#!/usr/bin/env node
/**
 * Understand-Anything project scanner (Phase 1)
 *
 * Discovers project files, detects languages/frameworks, counts lines,
 * resolves project-internal imports, and emits a structured JSON inventory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.argv[2];
const OUTPUT_PATH = process.argv[3];

if (!PROJECT_ROOT || !OUTPUT_PATH) {
  console.error('Usage: node ua-project-scan.js <project-root> <output-json-path>');
  process.exit(1);
}

if (!fs.existsSync(PROJECT_ROOT) || !fs.statSync(PROJECT_ROOT).isDirectory()) {
  console.error(`Project root does not exist or is not a directory: ${PROJECT_ROOT}`);
  process.exit(1);
}

// Load the `ignore` package from the plugin's pnpm store path
const IGNORE_PKG_PATH =
  'C:/Users/thoma/.claude/plugins/cache/understand-anything/understand-anything/2.6.3/node_modules/.pnpm/ignore@7.0.5/node_modules/ignore';
let ignoreLib;
try {
  ignoreLib = require(IGNORE_PKG_PATH);
} catch (err) {
  console.error(`Failed to load ignore package from ${IGNORE_PKG_PATH}: ${err.message}`);
  process.exit(1);
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function fromPosix(p) {
  return p.split('/').join(path.sep);
}

const projectRootAbs = path.resolve(PROJECT_ROOT);

// ---------------------------------------------------------------------------
// Step 1 – File Discovery
// ---------------------------------------------------------------------------

function discoverFiles() {
  // Try git ls-files first
  try {
    const out = execSync('git ls-files', {
      cwd: projectRootAbs,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
    const lines = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('--')); // strip stray alias output if any
    if (lines.length > 0) return lines.map(toPosix);
  } catch (e) {
    // fall through to recursive walk
  }

  // Recursive walk fallback
  const results = [];
  function walk(dir, rel) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const r = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isDirectory()) {
        if (ent.name === '.git' || ent.name === 'node_modules') continue;
        walk(full, r);
      } else if (ent.isFile()) {
        results.push(r);
      }
    }
  }
  walk(projectRootAbs, '');
  return results;
}

const initialFiles = discoverFiles();

// ---------------------------------------------------------------------------
// Step 2 + Step 2.5 – Unified filtering
//
// Per spec: when .understandignore exists, we REPLACE Step 2's hardcoded
// filtering with a unified ignore filter that combines defaults + user
// patterns, so ! negation can override defaults.
// ---------------------------------------------------------------------------

// Hardcoded defaults expressed as .gitignore-compatible patterns
const HARDCODED_DEFAULTS = [
  // Dependency directories
  'node_modules/',
  '.git/',
  'vendor/',
  'venv/',
  '.venv/',
  '__pycache__/',
  // Build output (directory-segment matches)
  'dist/',
  'build/',
  'out/',
  'coverage/',
  '.next/',
  '.cache/',
  '.turbo/',
  'target/',
  'obj/',
  // Lock files
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  // Binary/asset files
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
  '*.mp3',
  '*.mp4',
  '*.pdf',
  '*.zip',
  '*.tar',
  '*.gz',
  // Generated files
  '*.min.js',
  '*.min.css',
  '*.map',
  '*.generated.*',
  // IDE/editor config
  '.idea/',
  '.vscode/',
  // Misc non-source
  'LICENSE',
  '.gitignore',
  '.editorconfig',
  '.prettierrc',
  '.eslintrc*',
  '*.log',
];

// Load .understandignore patterns
const understandIgnorePaths = [
  path.join(projectRootAbs, '.understand-anything', '.understandignore'),
  path.join(projectRootAbs, '.understandignore'),
];

const userIgnorePatterns = [];
let hasUserIgnore = false;
for (const ipath of understandIgnorePaths) {
  if (fs.existsSync(ipath)) {
    hasUserIgnore = true;
    const content = fs.readFileSync(ipath, 'utf8');
    userIgnorePatterns.push(...content.split(/\r?\n/));
  }
}

// Step 2 (baseline) filter — applied first to compute filteredByIgnore delta
const step2Filter = ignoreLib.default ? ignoreLib.default() : ignoreLib();
step2Filter.add(HARDCODED_DEFAULTS);

const step2Survivors = initialFiles.filter((f) => !step2Filter.ignores(f));

let finalSurvivors;
let filteredByIgnore = 0;
if (hasUserIgnore) {
  // Combined filter: defaults first, then user patterns (so user `!` can negate defaults)
  const unifiedFilter = ignoreLib.default ? ignoreLib.default() : ignoreLib();
  unifiedFilter.add(HARDCODED_DEFAULTS);
  unifiedFilter.add(userIgnorePatterns);
  finalSurvivors = initialFiles.filter((f) => !unifiedFilter.ignores(f));
  filteredByIgnore = step2Survivors.length - finalSurvivors.length;
} else {
  finalSurvivors = step2Survivors;
}

// Final safety: make sure files actually exist on disk
finalSurvivors = finalSurvivors.filter((rel) => {
  try {
    const abs = path.join(projectRootAbs, fromPosix(rel));
    return fs.statSync(abs).isFile();
  } catch {
    return false;
  }
});

// Sort alphabetically by path (POSIX-style)
finalSurvivors.sort();

// ---------------------------------------------------------------------------
// Step 3 – Language detection
// ---------------------------------------------------------------------------

const EXT_TO_LANG = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.rb': 'ruby',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.php': 'php',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.sh': 'shell',
  '.bash': 'shell',
  '.ps1': 'powershell',
  '.bat': 'batch',
  '.cmd': 'batch',
  '.md': 'markdown',
  '.rst': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.json': 'json',
  '.jsonc': 'jsonc',
  '.toml': 'toml',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
  '.tf': 'terraform',
  '.tfvars': 'terraform',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.sass': 'css',
  '.less': 'css',
  '.xml': 'xml',
  '.cfg': 'config',
  '.ini': 'config',
  '.env': 'config',
};

const FILENAME_TO_LANG = {
  Dockerfile: 'dockerfile',
  Makefile: 'makefile',
  Jenkinsfile: 'jenkinsfile',
};

function languageOf(relPath) {
  const base = path.basename(relPath);
  if (FILENAME_TO_LANG[base]) return FILENAME_TO_LANG[base];
  const ext = path.extname(base).toLowerCase();
  if (ext === '') return 'unknown';
  if (EXT_TO_LANG[ext]) return EXT_TO_LANG[ext];
  return ext.slice(1) || 'unknown';
}

// ---------------------------------------------------------------------------
// Step 4 – File category detection
// ---------------------------------------------------------------------------

function fileCategoryOf(relPath) {
  const base = path.basename(relPath);
  const ext = path.extname(base).toLowerCase();
  const lower = relPath.toLowerCase();

  // Infra (priority over other categories)
  if (
    base === 'Dockerfile' ||
    base.startsWith('docker-compose.') ||
    ext === '.tf' ||
    ext === '.tfvars' ||
    base === 'Makefile' ||
    base === 'Jenkinsfile' ||
    base === 'Procfile' ||
    base === 'Vagrantfile' ||
    lower.includes('.github/workflows/') ||
    base === '.gitlab-ci.yml' ||
    lower.includes('.circleci/') ||
    base.endsWith('.k8s.yaml') ||
    base.endsWith('.k8s.yml') ||
    lower.startsWith('k8s/') ||
    lower.includes('/k8s/') ||
    lower.startsWith('kubernetes/') ||
    lower.includes('/kubernetes/')
  ) {
    return 'infra';
  }

  // Docs
  if (ext === '.md' || ext === '.rst' || (ext === '.txt' && base !== 'LICENSE')) {
    return 'docs';
  }

  // Config
  const configExts = new Set(['.yaml', '.yml', '.json', '.jsonc', '.toml', '.xml', '.cfg', '.ini', '.env']);
  const configBases = new Set([
    'tsconfig.json',
    'package.json',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
  ]);
  if (configExts.has(ext) || configBases.has(base) || base.startsWith('.env')) {
    return 'config';
  }

  // Data
  if (
    ext === '.sql' ||
    ext === '.graphql' ||
    ext === '.gql' ||
    ext === '.proto' ||
    ext === '.prisma' ||
    base.endsWith('.schema.json') ||
    ext === '.csv'
  ) {
    return 'data';
  }

  // Script
  if (ext === '.sh' || ext === '.bash' || ext === '.ps1' || ext === '.bat') {
    return 'script';
  }

  // Markup
  if (['.html', '.htm', '.css', '.scss', '.sass', '.less'].includes(ext)) {
    return 'markup';
  }

  // Default: code
  return 'code';
}

// ---------------------------------------------------------------------------
// Step 5 – Line counting (batched)
// ---------------------------------------------------------------------------

function countLinesInFiles(files) {
  const counts = new Map();
  // Just count in-process; avoids spawning thousands of wc -l processes
  for (const rel of files) {
    const abs = path.join(projectRootAbs, fromPosix(rel));
    try {
      const stat = fs.statSync(abs);
      // Skip large binary-ish files (>5MB) to avoid OOM
      if (stat.size > 5 * 1024 * 1024) {
        counts.set(rel, 0);
        continue;
      }
      const buf = fs.readFileSync(abs);
      let n = 0;
      for (let i = 0; i < buf.length; i++) if (buf[i] === 0x0a) n++;
      // If file is non-empty and doesn't end with newline, add 1
      if (buf.length > 0 && buf[buf.length - 1] !== 0x0a) n++;
      counts.set(rel, n);
    } catch (e) {
      counts.set(rel, 0);
    }
  }
  return counts;
}

const lineCounts = countLinesInFiles(finalSurvivors);

// ---------------------------------------------------------------------------
// Step 6 – Framework detection
// ---------------------------------------------------------------------------

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function safeRead(p) {
  try {
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return '';
  }
}

const frameworks = new Set();

// package.json
const pkgJsonPath = path.join(projectRootAbs, 'package.json');
const pkgJson = safeReadJson(pkgJsonPath);
let projectName = null;
let rawDescription = '';
if (pkgJson) {
  projectName = pkgJson.name || null;
  rawDescription = pkgJson.description || '';
  const allDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
  };
  const depMatchers = {
    react: 'React',
    vue: 'Vue',
    svelte: 'Svelte',
    '@angular/core': 'Angular',
    express: 'Express',
    fastify: 'Fastify',
    koa: 'Koa',
    next: 'Next.js',
    nuxt: 'Nuxt',
    vite: 'Vite',
    vitest: 'Vitest',
    jest: 'Jest',
    mocha: 'Mocha',
    tailwindcss: 'Tailwind CSS',
    prisma: 'Prisma',
    typeorm: 'TypeORM',
    sequelize: 'Sequelize',
    mongoose: 'Mongoose',
    redux: 'Redux',
    zustand: 'Zustand',
    mobx: 'MobX',
  };
  for (const [dep, label] of Object.entries(depMatchers)) {
    if (allDeps[dep]) frameworks.add(label);
  }
}

// tsconfig.json
const tsconfigPath = path.join(projectRootAbs, 'tsconfig.json');
const tsconfig = safeReadJson(tsconfigPath);
if (tsconfig) frameworks.add('TypeScript');

// requirements.txt
const reqTxt = safeRead(path.join(projectRootAbs, 'requirements.txt'));
const pyKnown = {
  django: 'Django',
  djangorestframework: 'Django REST Framework',
  fastapi: 'FastAPI',
  flask: 'Flask',
  sqlalchemy: 'SQLAlchemy',
  alembic: 'Alembic',
  celery: 'Celery',
  pydantic: 'Pydantic',
  uvicorn: 'Uvicorn',
  gunicorn: 'Gunicorn',
  aiohttp: 'aiohttp',
  tornado: 'Tornado',
  starlette: 'Starlette',
  pytest: 'pytest',
  hypothesis: 'Hypothesis',
  channels: 'Django Channels',
};
if (reqTxt) {
  for (const line of reqTxt.split(/\r?\n/)) {
    const name = line.split(/[=<>~!\s;\[]/)[0].trim().toLowerCase();
    if (pyKnown[name]) frameworks.add(pyKnown[name]);
  }
}

// pyproject.toml (very loose parse)
const pyproj = safeRead(path.join(projectRootAbs, 'pyproject.toml'));
if (pyproj) {
  for (const [k, v] of Object.entries(pyKnown)) {
    const re = new RegExp(`(^|\\W)${k.replace(/[-/]/g, '[-_/]?')}(\\W|$)`, 'i');
    if (re.test(pyproj)) frameworks.add(v);
  }
  if (/\[tool\.pytest\.ini_options\]/.test(pyproj)) frameworks.add('pytest');
}

// Cargo.toml / go.mod / Gemfile etc. — skip detailed parsing, just detect presence
if (fs.existsSync(path.join(projectRootAbs, 'Cargo.toml'))) frameworks.add('Rust (Cargo)');
if (fs.existsSync(path.join(projectRootAbs, 'go.mod'))) frameworks.add('Go Modules');

// Infrastructure tooling — based on discovered file paths
const surviveSet = new Set(finalSurvivors);
function anyMatch(predicate) {
  for (const f of surviveSet) if (predicate(f)) return true;
  return false;
}
if (anyMatch((f) => path.basename(f) === 'Dockerfile')) frameworks.add('Docker');
if (anyMatch((f) => /^docker-compose\.(yaml|yml)$/i.test(path.basename(f)))) {
  frameworks.add('Docker Compose');
}
if (anyMatch((f) => f.endsWith('.tf'))) frameworks.add('Terraform');
if (anyMatch((f) => /^\.github\/workflows\/.+\.ya?ml$/i.test(f))) {
  frameworks.add('GitHub Actions');
}
if (anyMatch((f) => path.basename(f) === '.gitlab-ci.yml')) frameworks.add('GitLab CI');
if (anyMatch((f) => path.basename(f) === 'Jenkinsfile')) frameworks.add('Jenkins');

// ---------------------------------------------------------------------------
// Step 8 – Project name fallback
// ---------------------------------------------------------------------------

if (!projectName) {
  projectName = path.basename(projectRootAbs);
}

// ---------------------------------------------------------------------------
// Step 9 – Import resolution
// ---------------------------------------------------------------------------

// Build path-alias map from tsconfig.json
const aliasMap = []; // [{ prefix: '@/', target: 'src/' }, ...]
if (tsconfig && tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  const baseUrl = tsconfig.compilerOptions.baseUrl || '.';
  const baseUrlNorm = toPosix(path.normalize(baseUrl)).replace(/\/$/, '');
  const baseUrlPrefix = baseUrlNorm === '' || baseUrlNorm === '.' ? '' : baseUrlNorm + '/';
  for (const [aliasRaw, targets] of Object.entries(tsconfig.compilerOptions.paths)) {
    if (!Array.isArray(targets) || targets.length === 0) continue;
    const alias = aliasRaw;
    const target = targets[0];
    if (alias.endsWith('/*') && target.endsWith('/*')) {
      const aliasPrefix = alias.slice(0, -1); // keep "@/" (drop the *)
      let targetPrefix = target.slice(0, -1); // drop *
      // Normalize "./foo/" relative to baseUrl
      if (targetPrefix.startsWith('./')) targetPrefix = targetPrefix.slice(2);
      targetPrefix = toPosix(targetPrefix);
      const fullTargetPrefix = baseUrlPrefix + targetPrefix; // e.g. "src/"
      aliasMap.push({ prefix: aliasPrefix, target: fullTargetPrefix, exact: false });
    } else {
      // Exact alias
      let t = target;
      if (t.startsWith('./')) t = t.slice(2);
      t = toPosix(t);
      const fullTarget = baseUrlPrefix + t;
      aliasMap.push({ prefix: alias, target: fullTarget, exact: true });
    }
  }
}

// File-set lookup
const fileSet = new Set(finalSurvivors);

// Quick map: lowercase POSIX path -> actual POSIX path (case-sensitive lookups
// in the discovered list, but we keep the original casing). We only need
// case-sensitive lookups here, so just use fileSet directly.

const CODE_EXT_PROBES = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.d.ts',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.jsx',
];
const PY_PROBES = ['.py', '/__init__.py'];

function resolveTSImport(importerRel, importPath) {
  if (!importPath || typeof importPath !== 'string') return null;

  // 1. Alias resolution
  let candidatePath = null;
  for (const a of aliasMap) {
    if (a.exact) {
      if (importPath === a.prefix) {
        candidatePath = a.target;
        break;
      }
    } else {
      if (importPath.startsWith(a.prefix)) {
        const remainder = importPath.slice(a.prefix.length);
        candidatePath = a.target + remainder;
        break;
      }
    }
  }

  // 2. Relative resolution
  if (candidatePath === null) {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const importerDir = path.posix.dirname(importerRel);
      candidatePath = toPosix(path.posix.normalize(importerDir + '/' + importPath));
    } else if (importPath.startsWith('/')) {
      // Absolute file path — rare; treat as rooted at project root
      candidatePath = importPath.replace(/^\/+/, '');
    } else {
      // External package
      return null;
    }
  }

  if (!candidatePath) return null;
  candidatePath = candidatePath.replace(/^\.\//, '');
  candidatePath = toPosix(path.posix.normalize(candidatePath));

  // 3. Probe extension variants
  // If the candidate already has a known code extension, try as-is first
  const knownCodeExts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];
  const hasExt = knownCodeExts.some((e) => candidatePath.endsWith(e));
  if (hasExt && fileSet.has(candidatePath)) return candidatePath;

  for (const probe of CODE_EXT_PROBES) {
    const guess = candidatePath + probe;
    if (fileSet.has(guess)) return guess;
  }
  // Also try .d.ts at the end
  if (fileSet.has(candidatePath + '.d.ts')) return candidatePath + '.d.ts';
  return null;
}

// TypeScript/JavaScript import-pattern extraction
function extractTSImports(content) {
  const results = [];
  const importRe =
    /(?:^|[\s;])import\s+(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]/gm;
  const sideEffectRe = /(?:^|[\s;])import\s+['"]([^'"]+)['"]/gm;
  const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const exportFromRe = /export\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g;

  for (const re of [importRe, sideEffectRe, dynamicRe, requireRe, exportFromRe]) {
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m[1]) results.push(m[1]);
    }
  }
  return results;
}

// Python import extraction (relative + absolute)
function extractPythonImports(content) {
  const items = []; // { type: 'absolute'|'relativeFrom'|'relativeImport', module, names }
  const lines = content.split(/\r?\n/);
  for (let line of lines) {
    line = line.replace(/#.*$/, '').trim();
    if (!line) continue;

    let m;
    // from .x import y
    if ((m = line.match(/^from\s+(\.+)([\w\.]*)\s+import\s+(.+)$/))) {
      const dots = m[1];
      const mod = m[2];
      const names = m[3]
        .replace(/\(|\)/g, '')
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0])
        .filter(Boolean);
      items.push({ type: 'relativeFrom', dots, module: mod, names });
      continue;
    }
    // from a.b.c import x[, y, ...]
    if ((m = line.match(/^from\s+([\w\.]+)\s+import\s+(.+)$/))) {
      const mod = m[1];
      const names = m[2]
        .replace(/\(|\)/g, '')
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0])
        .filter(Boolean);
      items.push({ type: 'absoluteFrom', module: mod, names });
      continue;
    }
    // import a.b.c[, d.e]
    if ((m = line.match(/^import\s+([\w\.,\s]+)$/))) {
      const mods = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]);
      for (const mod of mods) {
        if (mod) items.push({ type: 'absoluteImport', module: mod });
      }
      continue;
    }
  }
  return items;
}

function resolvePyModule(modulePath) {
  // Try moduleParts.py then moduleParts/__init__.py
  const parts = modulePath.split('.').filter(Boolean);
  if (parts.length === 0) return null;
  const base = parts.join('/');
  for (const probe of PY_PROBES) {
    const candidate = base + probe;
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

function resolvePythonImports(importerRel, items) {
  const resolved = new Set();
  const importerDir = path.posix.dirname(importerRel);

  for (const it of items) {
    if (it.type === 'absoluteImport' || it.type === 'absoluteFrom') {
      const modResolved = resolvePyModule(it.module);
      if (modResolved) {
        resolved.add(modResolved);
        if (modResolved.endsWith('/__init__.py') && it.type === 'absoluteFrom' && it.names) {
          // probe submodules
          const pkgDir = modResolved.slice(0, -'/__init__.py'.length);
          for (const name of it.names) {
            const sub1 = pkgDir + '/' + name + '.py';
            const sub2 = pkgDir + '/' + name + '/__init__.py';
            if (fileSet.has(sub1)) resolved.add(sub1);
            else if (fileSet.has(sub2)) resolved.add(sub2);
          }
        }
      }
    } else if (it.type === 'relativeFrom') {
      // dots count
      const upLevels = it.dots.length - 1;
      let baseDir = importerDir;
      for (let i = 0; i < upLevels; i++) {
        baseDir = path.posix.dirname(baseDir);
        if (baseDir === '.' || baseDir === '') {
          baseDir = '';
          break;
        }
      }
      const modPath = it.module ? (baseDir ? baseDir + '/' + it.module.split('.').join('/') : it.module.split('.').join('/')) : baseDir;
      // probe .py / /__init__.py
      let modResolved = null;
      for (const probe of PY_PROBES) {
        const cand = (modPath || '') + probe;
        const normalized = cand.replace(/^\/+/, '');
        if (fileSet.has(normalized)) {
          modResolved = normalized;
          break;
        }
      }
      if (modResolved) {
        resolved.add(modResolved);
        if (modResolved.endsWith('/__init__.py') && it.names) {
          const pkgDir = modResolved.slice(0, -'/__init__.py'.length);
          for (const name of it.names) {
            const sub1 = pkgDir + '/' + name + '.py';
            const sub2 = pkgDir + '/' + name + '/__init__.py';
            if (fileSet.has(sub1)) resolved.add(sub1);
            else if (fileSet.has(sub2)) resolved.add(sub2);
          }
        }
      }
    }
  }
  return Array.from(resolved);
}

// Build files list with categories
const filesOut = finalSurvivors.map((rel) => ({
  path: rel,
  language: languageOf(rel),
  sizeLines: lineCounts.get(rel) || 0,
  fileCategory: fileCategoryOf(rel),
}));

// Build import map
const importMap = {};
for (const f of filesOut) {
  importMap[f.path] = [];
}

const codeFiles = filesOut.filter((f) => f.fileCategory === 'code');
const TS_LANGS = new Set(['typescript', 'javascript']);

for (const f of codeFiles) {
  const abs = path.join(projectRootAbs, fromPosix(f.path));
  let content;
  try {
    const stat = fs.statSync(abs);
    if (stat.size > 4 * 1024 * 1024) {
      // skip ridiculously big files
      continue;
    }
    content = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }

  const lang = f.language;
  const resolved = new Set();

  if (TS_LANGS.has(lang) || lang === 'jsx' || lang === 'tsx') {
    const specifiers = extractTSImports(content);
    for (const spec of specifiers) {
      const r = resolveTSImport(f.path, spec);
      if (r) resolved.add(r);
    }
  } else if (lang === 'python') {
    const items = extractPythonImports(content);
    const rs = resolvePythonImports(f.path, items);
    for (const r of rs) resolved.add(r);
  }

  // For other languages, leave empty array (spec only requires the listed languages
  // and Python; other backend langs are out of scope for this project).

  importMap[f.path] = Array.from(resolved).sort();
}

// ---------------------------------------------------------------------------
// README head
// ---------------------------------------------------------------------------

let readmeHead = '';
const readmePath = path.join(projectRootAbs, 'README.md');
if (fs.existsSync(readmePath)) {
  try {
    const txt = fs.readFileSync(readmePath, 'utf8');
    readmeHead = txt.split(/\r?\n/).slice(0, 10).join('\n');
  } catch (e) {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// Languages list
// ---------------------------------------------------------------------------

const languageSet = new Set();
for (const f of filesOut) languageSet.add(f.language);
const languages = Array.from(languageSet).sort();

// ---------------------------------------------------------------------------
// Complexity
// ---------------------------------------------------------------------------

const totalFiles = filesOut.length;
let estimatedComplexity;
if (totalFiles <= 30) estimatedComplexity = 'small';
else if (totalFiles <= 150) estimatedComplexity = 'moderate';
else if (totalFiles <= 500) estimatedComplexity = 'large';
else estimatedComplexity = 'very-large';

// ---------------------------------------------------------------------------
// Assemble + write
// ---------------------------------------------------------------------------

const result = {
  scriptCompleted: true,
  name: projectName,
  rawDescription,
  readmeHead,
  languages,
  frameworks: Array.from(frameworks).sort(),
  files: filesOut,
  totalFiles,
  filteredByIgnore,
  estimatedComplexity,
  importMap,
};

// Ensure output dir exists
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf8');

// Stats to stderr (so stdout stays clean)
console.error(
  `[ua-scanner] initial=${initialFiles.length} step2Survivors=${step2Survivors.length} finalSurvivors=${finalSurvivors.length} filteredByIgnore=${filteredByIgnore} languages=${languages.length} frameworks=${frameworks.size}`
);
process.exit(0);
