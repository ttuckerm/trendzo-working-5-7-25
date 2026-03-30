/**
 * Loader — Read exported snapshot and config files from disk.
 * Pure file I/O, no Supabase, no network calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ExportSnapshot, SandboxConfig } from './types';

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const CONFIGS_DIR = path.resolve(__dirname, '..', 'configs');

/**
 * Load the most recent snapshot from autoresearch/data/.
 * If a specific filename is given, loads that one.
 */
export function loadSnapshot(filename?: string): ExportSnapshot {
  let filePath: string;

  if (filename) {
    filePath = path.resolve(DATA_DIR, filename);
  } else {
    // Find most recent snapshot-*.json
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error(
        `No snapshot files found in ${DATA_DIR}. Run: npx tsx autoresearch/export-snapshot.ts`
      );
    }
    filePath = path.resolve(DATA_DIR, files[0]);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const snapshot: ExportSnapshot = JSON.parse(raw);

  // Basic validation
  if (!snapshot.runs || !Array.isArray(snapshot.runs)) {
    throw new Error(`Invalid snapshot: missing 'runs' array in ${filePath}`);
  }

  if (snapshot.runs.length === 0) {
    throw new Error(`Empty snapshot: 0 runs in ${filePath}`);
  }

  return snapshot;
}

/**
 * Load a config file from autoresearch/configs/.
 * Strips _source and _*Note metadata keys before returning.
 */
export function loadConfig(name: string = 'baseline'): SandboxConfig {
  const filePath = path.resolve(CONFIGS_DIR, `${name}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  // Strip metadata keys (keys starting with '_')
  return stripMetaKeys(parsed) as SandboxConfig;
}

function stripMetaKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripMetaKeys);
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('_')) continue;
      result[k] = stripMetaKeys(v);
    }
    return result;
  }
  return obj;
}
