// Fetch missing hashed assets for a static cloned site (Vite-style bundles)
// Usage: node scripts/fetch-missing-assets.js --root snapshots/os.ryo.lu/site --base https://os.ryo.lu
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');
const http = require('http');

function getArg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return def;
}

const root = path.resolve(getArg('root', 'snapshots/os.ryo.lu/site'));
const base = getArg('base', 'https://os.ryo.lu').replace(/\/$/, '');

async function ensureDir(p) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
}

function download(url, dest) {
  return new Promise(async (resolve) => {
    try {
      await ensureDir(dest);
      const client = url.startsWith('https:') ? https : http;
      const req = client.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // follow redirect
          download(res.headers.location, dest).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          resolve({ ok: false, status: res.statusCode, url, dest });
          res.resume();
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve({ ok: true, url, dest })));
      });
      req.on('error', () => resolve({ ok: false, status: 0, url, dest }));
    } catch {
      resolve({ ok: false, status: 0, url, dest });
    }
  });
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

async function main() {
  const indexHtmlPath = path.join(root, 'index.html');
  const html = await fsp.readFile(indexHtmlPath, 'utf8');
  const scriptSrc = (html.match(/<script[^>]+src=\"([^\"]+)\"/i) || [])[1];
  if (!scriptSrc) throw new Error('Entry script not found in index.html');
  const entryJs = path.join(root, scriptSrc);
  const entry = await fsp.readFile(entryJs, 'utf8');

  // Extract asset references from the entry bundle
  const assetRe = /"(assets\/[A-Za-z0-9_.\-]+\.(?:js|css))"/g;
  const assets = [];
  for (const m of entry.matchAll(assetRe)) assets.push(m[1]);

  // Also fetch icon manifest and common icons
  const extra = [
    'icons/mac-192.png',
    'icons/mac-512.png',
    'icons/manifest.json',
  ];

  // Parse CSS url(...) for additional asset dependencies
  const cssMain = assets.find((a) => a.endsWith('.css'));
  if (cssMain) {
    const cssPath = path.join(root, cssMain);
    if (fs.existsSync(cssPath)) {
      const css = await fsp.readFile(cssPath, 'utf8');
      const urlRe = /url\(([^)]+)\)/g;
      for (const m of css.matchAll(urlRe)) {
        let u = m[1].trim().replace(/^['\"]|['\"]$/g, '');
        if (!u || u.startsWith('data:') || u.startsWith('http')) continue;
        if (u.startsWith('/')) u = u.slice(1);
        if (!u.startsWith('assets/') && !u.startsWith('icons/') && !u.startsWith('fonts/')) {
          // most relative urls in vite css live under assets
          u = `assets/${u.replace(/^\.\//, '')}`;
        }
        extra.push(u);
      }
    }
  }

  const wanted = uniq([...assets, ...extra]);
  let downloaded = 0;
  let missed = 0;
  const results = [];
  for (const rel of wanted) {
    const dest = path.join(root, rel);
    if (fs.existsSync(dest)) continue;
    const url = `${base}/${rel}`;
    // eslint-disable-next-line no-await-in-loop
    const res = await download(url, dest);
    results.push(res);
    if (res.ok) downloaded += 1; else missed += 1;
  }

  // Log summary
  for (const r of results) {
    console.log((r.ok ? 'OK ' : `MISS(${r.status}) `) + r.url);
  }
  console.log(`DOWNLOADED=${downloaded} MISSED=${missed}`);
}

main().catch((e) => {
  console.error('fetch-missing-assets failed:', e.message || e);
  process.exit(1);
});




