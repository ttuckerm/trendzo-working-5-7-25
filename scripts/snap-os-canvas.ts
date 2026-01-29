#!/usr/bin/env tsx

/*
  Snapshots for OS Canvas
  - Navigates to /os-canvas for editor and each reader panel
  - Captures deterministic PNG screenshots
  - Compares against last committed baselines with ~1.5% diff threshold

  Usage:
    pnpm snap:os-canvas           # capture & compare; create baseline if missing
    pnpm snap:os-canvas:update    # update/refresh baselines from current renders
*/

import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import { chromium, Browser, Page } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

type Panel = 'dashboard' | 'scripts' | 'optimize' | 'abtest' | 'inception' | 'validate';

const PANELS: Panel[] = [
  'dashboard',
  'scripts',
  'optimize',
  'abtest',
  'inception',
  'validate',
];

const VIEWPORT = { width: 1280, height: 800 } as const;
const DIFF_RATIO_THRESHOLD = 0.015; // 1.5%
const ROOT = path.resolve(__dirname, '..');
const SNAP_DIR = path.resolve(ROOT, 'snapshots', 'os-canvas');
const BASELINE_DIR = path.join(SNAP_DIR, 'baseline');
const CURRENT_DIR = path.join(SNAP_DIR, 'current');
const DIFF_DIR = path.join(SNAP_DIR, 'diff');

const UPDATE_BASELINES = process.argv.includes('--update') || process.env.UPDATE_BASELINES === '1';
const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:3000';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function ping(urlStr: string, timeoutMs = 2500, probePath: string = '/'):
  Promise<boolean> {
  const url = new URL(urlStr);
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    const req = lib
      .request(
        {
          method: 'GET',
          hostname: url.hostname,
          port: url.port,
          path: probePath,
          timeout: timeoutMs,
        },
        (res) => {
          res.resume();
          resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 500);
        }
      )
      .on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForServer(baseUrl: string, maxWaitMs = 30_000, probePath: string = '/') {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ok = await ping(baseUrl, 2500, probePath);
    if (ok) return true;
    await sleep(750);
  }
  return false;
}

function startDevServerIfNeeded(baseUrl: string): { proc: ReturnType<typeof spawn> | null } {
  const url = new URL(baseUrl);
  const port = url.port || '3000';
  // If user already has a server running, do nothing; caller will wait/ping.
  // If not, we will spawn a local Next dev server on the needed port.
  const proc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['next', 'dev', '-p', port],
    { cwd: ROOT, stdio: 'inherit', shell: true }
  );
  return { proc };
}

async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content:
      '* { transition: none !important; animation: none !important; caret-color: transparent !important; }',
  });
}

async function gotoAndStabilize(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await disableAnimations(page);
  // Allow layout/paint to settle
  await page.waitForTimeout(300);
}

function readPng(filePath: string): Promise<PNG> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream
      .pipe(new PNG())
      .on('parsed', function (this: PNG) {
        resolve(this);
      })
      .on('error', reject);
  });
}

function writeBufferToPng(png: PNG, outPath: string) {
  return new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(outPath);
    png.pack().pipe(out).on('finish', () => resolve()).on('error', reject);
  });
}

async function compareImages(baselinePath: string, currentPath: string, diffPath: string) {
  const base = await readPng(baselinePath);
  const curr = await readPng(currentPath);
  if (base.width !== curr.width || base.height !== curr.height) {
    return { ratio: 1, diffPixels: base.width * base.height, width: base.width, height: base.height };
  }
  const { width, height } = base;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(base.data, curr.data, diff.data, width, height, {
    threshold: 0.1, // pixel intensity threshold
    includeAA: true,
  });
  const ratio = diffPixels / (width * height);
  if (ratio > DIFF_RATIO_THRESHOLD) {
    ensureDir(path.dirname(diffPath));
    await writeBufferToPng(diff, diffPath);
  } else {
    // If small diff, we can optionally remove previous diff to reduce noise
    if (fs.existsSync(diffPath)) fs.unlinkSync(diffPath);
  }
  return { ratio, diffPixels, width, height };
}

async function run() {
  ensureDir(BASELINE_DIR);
  ensureDir(CURRENT_DIR);
  ensureDir(DIFF_DIR);

  let serverProc: ReturnType<typeof spawn> | null = null;
  const alreadyUp = await waitForServer(BASE_URL, 2000, '/os-canvas');
  if (!alreadyUp) {
    const started = startDevServerIfNeeded(BASE_URL);
    serverProc = started.proc;
    const ready = await waitForServer(BASE_URL, 30_000, '/os-canvas');
    if (!ready) {
      if (serverProc) serverProc.kill();
      throw new Error(`Failed to start dev server at ${BASE_URL}`);
    }
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    const targets: { name: string; hash: string }[] = [
      { name: 'editor', hash: '#editor' },
      ...PANELS.map((p) => ({ name: p, hash: `#${p}` })),
    ];

    const summary: Array<{
      name: string;
      createdBaseline?: boolean;
      ratio?: number;
      diffPixels?: number;
      width?: number;
      height?: number;
      passed?: boolean;
    }> = [];

    for (const target of targets) {
      const url = `${BASE_URL}/os-canvas${target.hash}`;
      await gotoAndStabilize(page, url);

      const fileBase = `os-canvas-${target.name}-${VIEWPORT.width}x${VIEWPORT.height}.png`;
      const currentPath = path.join(CURRENT_DIR, fileBase);
      const baselinePath = path.join(BASELINE_DIR, fileBase);
      const diffPath = path.join(DIFF_DIR, fileBase.replace(/\.png$/, '.diff.png'));

      await page.screenshot({ path: currentPath, fullPage: true });

      if (UPDATE_BASELINES || !fs.existsSync(baselinePath)) {
        fs.copyFileSync(currentPath, baselinePath);
        summary.push({ name: target.name, createdBaseline: true, passed: true });
        continue;
      }

      const { ratio, diffPixels, width, height } = await compareImages(baselinePath, currentPath, diffPath);
      const passed = ratio <= DIFF_RATIO_THRESHOLD;
      summary.push({ name: target.name, ratio, diffPixels, width, height, passed });
    }

    // Report
    const failed = summary.filter((s) => s.passed === false);
    const created = summary.filter((s) => s.createdBaseline);

    console.log('\nOS Canvas Snapshot Report');
    console.log('='.repeat(32));
    for (const s of summary) {
      if (s.createdBaseline) {
        console.log(`🆕 ${s.name.padEnd(12)} baseline created`);
      } else if (s.passed) {
        console.log(`✅ ${s.name.padEnd(12)} OK (diff ${(s.ratio! * 100).toFixed(2)}%)`);
      } else {
        console.log(`❌ ${s.name.padEnd(12)} DIFF ${(s.ratio! * 100).toFixed(2)}% (${s.diffPixels} px)`);
      }
    }
    console.log('='.repeat(32));
    console.log(`Threshold: ${(DIFF_RATIO_THRESHOLD * 100).toFixed(2)}%`);
    if (created.length) console.log(`Baselines created: ${created.map((c) => c.name).join(', ')}`);
    if (failed.length) console.log(`Diff images written to: ${DIFF_DIR}`);

    // Persist JSON report
    const reportPath = path.join(SNAP_DIR, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ summary, threshold: DIFF_RATIO_THRESHOLD }, null, 2));

    // Exit code
    if (failed.length) {
      process.exitCode = 1;
    }
  } finally {
    try { await browser?.close(); } catch {}
    if (serverProc) {
      // Give the server a moment to flush logs then kill
      await sleep(250);
      try { serverProc.kill(); } catch {}
    }
  }
}

run().catch((err) => {
  console.error('Snapshot run failed:', err);
  process.exit(1);
});


