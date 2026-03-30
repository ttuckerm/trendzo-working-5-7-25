import { getCodebaseIndex } from './codebase-scanner';

/**
 * Generates a compressed but readable codebase map for the AI system prompt.
 * Provides structural awareness (files, routes, tables) without file contents.
 */
export function getCodebaseMap(): string {
  const index = getCodebaseIndex();

  const pageLines = index.pages
    .map((p) => `  ${p.route} → ${p.file}`)
    .join('\n');

  const apiLines = index.apiRoutes
    .map((a) => `  ${(a.methods || []).join(',')} ${a.route} → ${a.file}`)
    .join('\n');

  const componentLines = index.components
    .map((c) => `  ${c.name} → ${c.file}`)
    .join('\n');

  const libLines = index.libs
    .map((l) => {
      const exps = l.exports && l.exports.length > 0 ? l.exports.join(', ') : '(no named exports)';
      return `  ${l.file} → ${exps}`;
    })
    .join('\n');

  // Deduplicate tables across migrations, keep column info
  const tableMap = new Map<string, string[]>();
  for (const m of index.migrations) {
    for (const t of m.tables || []) {
      if (!tableMap.has(t) && m.columns?.[t]) {
        tableMap.set(t, m.columns[t]);
      } else if (!tableMap.has(t)) {
        tableMap.set(t, []);
      }
    }
  }
  const tableLines = Array.from(tableMap.entries())
    .map(([name, cols]) => {
      const colStr = cols.length > 0 ? ` (${cols.join(', ')})` : '';
      return `  ${name}${colStr}`;
    })
    .join('\n');

  const typeLines = index.types
    .map((t) => {
      const exps = t.exports && t.exports.length > 0 ? t.exports.join(', ') : '(no named exports)';
      return `  ${t.file} → ${exps}`;
    })
    .join('\n');

  const envLines = index.envVars.map((v) => `  ${v}`).join('\n');

  const depLines = index.dependencies.slice(0, 40).join(', ');

  return `
=== CODEBASE MAP ===
Generated: ${index.generatedAt}
Total indexed files: ${index.totalFiles}

PAGE ROUTES (${index.pages.length}):
${pageLines || '  (none found)'}

API ROUTES (${index.apiRoutes.length}):
${apiLines || '  (none found)'}

COMPONENTS (${index.components.length}):
${componentLines || '  (none found)'}

LIB MODULES (${index.libs.length}):
${libLines || '  (none found)'}

DATABASE TABLES:
${tableLines || '  (none found)'}

TYPE DEFINITIONS (${index.types.length}):
${typeLines || '  (none found)'}

CONFIG FILES:
${index.configs.map((c) => `  ${c.file}`).join('\n') || '  (none found)'}

ENV VARS (names only, never values):
${envLines || '  (none found)'}

KEY DEPENDENCIES:
  ${depLines || '(none found)'}

=== END CODEBASE MAP ===
`;
}
