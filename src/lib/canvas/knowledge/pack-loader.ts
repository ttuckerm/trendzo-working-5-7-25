import fs from 'fs';
import path from 'path';

const PACKS_DIR = path.join(
  process.cwd(),
  'frameworks-and-research',
  'POC Research & Framework Data'
);

function readPack(filename: string): string {
  try {
    const filePath = path.join(PACKS_DIR, filename);
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.warn(`[Canvas Knowledge] Pack file not found: ${filename}`);
    return '';
  }
}

function readAllByPrefix(prefix: string): string {
  try {
    const files = fs
      .readdirSync(PACKS_DIR)
      .filter((f) => f.startsWith(prefix) && f.toLowerCase().endsWith('.md'))
      .sort();

    return files
      .map((f) => {
        const content = readPack(f);
        return `\n--- ${f} ---\n${content}`;
      })
      .join('\n');
  } catch {
    console.warn(
      `[Canvas Knowledge] Could not read directory for prefix: ${prefix}`
    );
    return '';
  }
}

let _methodologyPack: string | null = null;
let _operationsPack: string | null = null;
let _objectivesDoc: string | null = null;
let _frameworks: string | null = null;
let _research: string | null = null;

export function getMethodologyPack(): string {
  if (!_methodologyPack) {
    _methodologyPack =
      readPack('Trendzo Methodology Pack v1.1  1-2-26.md') ||
      readPack('Universal Methodology Pack v1.0 (Generic) 2-6-26.md');
  }
  return _methodologyPack;
}

export function getOperationsPack(): string {
  if (!_operationsPack) {
    _operationsPack =
      readPack('Trendzo Product Operations Pack v1.0  1-2-26.md') ||
      readPack('Universal Product Operations Pack v1.0 (Generic) 2-6-26.md');
  }
  return _operationsPack;
}

export function getObjectivesDoc(): string {
  if (!_objectivesDoc) {
    _objectivesDoc = readPack('Trendzo Objectives Document v1.0  1-2-26.md');
  }
  return _objectivesDoc;
}

export function getFrameworks(): string {
  if (!_frameworks) {
    _frameworks = readAllByPrefix('Framework-');
  }
  return _frameworks;
}

export function getResearch(): string {
  if (!_research) {
    _research = readAllByPrefix('Research-');
  }
  return _research;
}

export function clearKnowledgeCache(): void {
  _methodologyPack = null;
  _operationsPack = null;
  _objectivesDoc = null;
  _frameworks = null;
  _research = null;
}
