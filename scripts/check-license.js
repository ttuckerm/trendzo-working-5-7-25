'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

/**
 * Disallowed patterns (case-insensitive):
 * - ryOS
 * - ryokun
 * - AGPL
 */
const DISALLOWED = [
  { label: 'ryOS', regex: /\bryos\b/i },
  { label: 'ryokun', regex: /\bryokun\b/i },
  { label: 'AGPL', regex: /\bagpl\b/i },
];

/**
 * Recursively collect files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  /** @type {string[]} */
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFilesRecursively(full));
    } else if (stat.isFile()) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Scan a text file for disallowed patterns and return matches with line numbers.
 * @param {string} filePath
 */
function scanFile(filePath) {
  /** @type {Array<{file: string, line: number, match: string, label: string}>} */
  const matches = [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    // Not a text file or unreadable; skip
    return matches;
  }
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of DISALLOWED) {
      if (rule.regex.test(line)) {
        const match = (line.match(rule.regex) || [''])[0];
        matches.push({ file: filePath, line: i + 1, match, label: rule.label });
      }
    }
  }
  return matches;
}

function main() {
  if (!fs.existsSync(SRC_DIR) || !fs.statSync(SRC_DIR).isDirectory()) {
    console.log('License check: no src/ directory found; skipping.');
    process.exit(0);
  }

  const files = collectFilesRecursively(SRC_DIR);
  /** @type {Array<{file: string, line: number, match: string, label: string}>} */
  const allMatches = [];
  for (const file of files) {
    // Basic size guard (10MB) to avoid huge binary files
    const { size } = fs.statSync(file);
    if (size > 10 * 1024 * 1024) continue;
    allMatches.push(...scanFile(file));
  }

  if (allMatches.length > 0) {
    console.error('License check failed — disallowed terms found in src/:');
    for (const m of allMatches) {
      console.error(`  ${m.file}:${m.line}  [${m.label}] → "${m.match}"`);
    }
    console.error('\nPolicy: docs/policies/ryos-behavior-mirroring.md');
    process.exit(1);
  }

  console.log('License check passed — no disallowed terms found in src/.');
}

main();


