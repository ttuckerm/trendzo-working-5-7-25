import fs from 'fs';
import path from 'path';
import type { CodebaseIndex } from './codebase-scanner';

const PROJECT_ROOT = process.cwd();
const MAX_FILE_SIZE = 50_000; // 50KB per file

const ALLOWED_PREFIXES = ['src/', 'supabase/', 'package.json', 'next.config'];

/**
 * Reads a single source file formatted for AI context injection.
 * Returns null if the file is outside the allowed directories, missing, or too large.
 */
export function readSourceFile(relativePath: string): string | null {
  try {
    const normalized = relativePath.replace(/\\/g, '/');
    if (!ALLOWED_PREFIXES.some((p) => normalized.startsWith(p))) return null;

    const fullPath = path.resolve(PROJECT_ROOT, relativePath);
    if (!fullPath.startsWith(PROJECT_ROOT)) return null;

    const stats = fs.statSync(fullPath);
    if (stats.size > MAX_FILE_SIZE) {
      return `[File too large: ${relativePath} (${Math.round(stats.size / 1024)}KB)]`;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return `--- FILE: ${normalized} ---\n${content}\n--- END FILE ---`;
  } catch {
    return null;
  }
}

/**
 * Reads multiple files, stopping when the total character budget is reached.
 */
export function readSourceFiles(
  relativePaths: string[],
  maxTotalChars: number = 30_000
): string {
  let total = '';
  for (let i = 0; i < relativePaths.length; i++) {
    const content = readSourceFile(relativePaths[i]);
    if (!content) continue;
    if (total.length + content.length > maxTotalChars) {
      const remaining = relativePaths.length - i;
      total += `\n[Context budget reached — ${remaining} file(s) skipped]\n`;
      break;
    }
    total += content + '\n';
  }
  return total;
}

/**
 * Finds files from the codebase index whose path, name, route, or exports
 * match any of the given search terms, then reads their contents.
 */
export function getRelevantFiles(
  searchTerms: string[],
  maxFiles: number = 5,
  maxTotalChars: number = 20_000
): string {
  // Lazy import to avoid circular dependency at module load time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getCodebaseIndex } = require('./codebase-scanner') as {
    getCodebaseIndex: () => CodebaseIndex;
  };
  const index = getCodebaseIndex();

  const allEntries = [
    ...index.pages,
    ...index.apiRoutes,
    ...index.components,
    ...index.libs,
    ...index.types,
  ];

  const lowerTerms = searchTerms.map((t) => t.toLowerCase());

  const scored = allEntries
    .map((entry) => {
      const haystack = [
        entry.file,
        entry.name || '',
        entry.route || '',
        ...(entry.exports || []),
      ]
        .join(' ')
        .toLowerCase();

      const score = lowerTerms.reduce(
        (acc, term) => acc + (haystack.includes(term) ? 1 : 0),
        0
      );
      return { entry, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);

  if (scored.length === 0) return '';

  return readSourceFiles(
    scored.map((s) => s.entry.file),
    maxTotalChars
  );
}
