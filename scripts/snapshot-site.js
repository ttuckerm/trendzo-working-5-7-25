#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function toHostDir(targetUrl) {
  const u = new URL(targetUrl);
  return path.join('snapshots', u.hostname, 'playwright');
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function writeText(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, contents, 'utf8');
}

function injectBaseHref(html, baseUrl) {
  const baseTag = `<base href="${baseUrl.replace(/"/g, '&quot;')}">`;
  if (/\<head[^>]*\>/i.test(html)) {
    if (!/\<base\s+href=/i.test(html)) {
      return html.replace(/\<head[^>]*\>/i, (m) => `${m}\n${baseTag}`);
    }
    return html;
  }
  return html.replace(/\<html[^>]*\>/i, (m) => `${m}\n<head>${baseTag}</head>`);
}

async function main() {
  const url = process.argv[2] || 'https://os.ryo.lu/';
  const outDir = toHostDir(url);
  await ensureDir(outDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  // Give the page a moment for late JS
  await page.waitForTimeout(2000);

  const html = await page.content();
  const withBase = injectBaseHref(html, url);
  await writeText(path.join(outDir, 'rendered.html'), withBase);
  await page.screenshot({ path: path.join(outDir, 'screenshot.png'), fullPage: true });

  await browser.close();
  console.log(`[snapshot] Saved rendered HTML and screenshot to ${outDir}`);
}

main().catch((e) => {
  console.error('[snapshot] Error:', e && e.message ? e.message : e);
  process.exit(1);
});




