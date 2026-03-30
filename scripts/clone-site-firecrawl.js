#!/usr/bin/env node

/**
 * Clone a website using Firecrawl REST API.
 *
 * Usage:
 *   node scripts/clone-site-firecrawl.js start https://os.ryo.lu/
 *   node scripts/clone-site-firecrawl.js poll https://os.ryo.lu/
 *
 * Requires env FIRECRAWL_API_KEY to be set (fc-...).
 * For Windows PowerShell, you can persist for user with:
 *   setx FIRECRAWL_API_KEY "fc-..."
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.firecrawl.dev/v1';

function getEnvApiKey() {
  const key = process.env.FIRECRAWL_API_KEY || '';
  if (!key || !/^fc-/.test(key)) {
    throw new Error('FIRECRAWL_API_KEY missing or invalid. Ensure it starts with "fc-".');
  }
  return key;
}

function toHostDir(targetUrl) {
  const u = new URL(targetUrl);
  return path.join('snapshots', u.hostname);
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function writeText(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, contents, 'utf8');
}

function urlToFilePath(baseDir, targetUrl, ext = '.html') {
  const u = new URL(targetUrl);
  const pathname = decodeURIComponent(u.pathname.replace(/\\+/g, '/'));
  const cleanPath = pathname.replace(/\/+$/, '');
  const hasFileName = /\.[a-zA-Z0-9]{2,8}$/.test(cleanPath);
  const rel = cleanPath === '' ? 'index' : cleanPath.slice(1);
  const finalRel = hasFileName ? rel : path.join(rel || '.', 'index');
  const safeRel = finalRel.replace(/[^a-zA-Z0-9._\-/]/g, '_');
  return path.join(baseDir, safeRel + (hasFileName ? '' : ext));
}

async function apiFetch(endpoint, init) {
  const apiKey = getEnvApiKey();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    ...init,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch {}
  if (!res.ok) {
    const err = new Error(`Firecrawl HTTP ${res.status}: ${text}`);
    // Attach parsed error for caller-side handling
    err.response = { status: res.status, json, text };
    throw err;
  }
  return json;
}

function extractField(obj, key) {
  if (!obj) return undefined;
  if (obj[key]) return obj[key];
  if (obj.data && Array.isArray(obj.data)) {
    const first = obj.data[0] || {};
    if (first[key]) return first[key];
  }
  if (obj.data && obj.data[key]) return obj.data[key];
  return undefined;
}

async function scrapeHomepage(targetUrl, outDir) {
  const body = {
    url: targetUrl,
    formats: ['html', 'markdown', 'links', 'summary'],
  };
  const data = await apiFetch('/scrape', { body: JSON.stringify(body) });
  const html = extractField(data, 'html') || '';
  const markdown = extractField(data, 'markdown') || '';
  const links = extractField(data, 'links') || extractField(data, 'allLinks') || [];
  const summary = extractField(data, 'summary') || '';

  if (html) await writeText(path.join(outDir, 'homepage.html'), html);
  if (markdown) await writeText(path.join(outDir, 'homepage.md'), markdown);
  await writeText(path.join(outDir, 'homepage.meta.json'), JSON.stringify({ url: targetUrl, summary, linkCount: Array.isArray(links) ? links.length : 0 }, null, 2));
  if (Array.isArray(links)) await writeText(path.join(outDir, 'homepage.links.json'), JSON.stringify(links, null, 2));
}

async function startCrawl(targetUrl, outDir) {
  // Initial body with reasonable defaults. Some keys may be rejected by the API
  // depending on the deployed version. We will progressively remove any
  // unrecognized keys reported by the server until the request succeeds.
  const baseBody = {
    url: targetUrl,
    maxDiscoveryDepth: 3,
    limit: 50,
    allowExternalLinks: false,
    deduplicateSimilarURLs: true,
    // includeSitemap: true, // prefer implicit sitemap; explicit key may be rejected
    scrapeOptions: {
      formats: ['html', 'markdown'],
      onlyMainContent: false,
    },
  };

  // Deep-clone convenience
  const deepClone = (o) => JSON.parse(JSON.stringify(o));
  let attemptBody = deepClone(baseBody);

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const data = await apiFetch('/crawl', { body: JSON.stringify(attemptBody) });
      const id = data.id || data.jobId || data.operationId || data.taskId;
      if (!id) throw new Error(`Unexpected crawl response (no id): ${JSON.stringify(data).slice(0, 300)}`);
      const metaPath = path.join(outDir, 'crawl.meta.json');
      await writeText(metaPath, JSON.stringify({ id, startedAt: new Date().toISOString(), url: targetUrl }, null, 2));
      return id;
    } catch (e) {
      const resp = e && e.response ? e.response : undefined;
      const details = resp && resp.json && resp.json.details;
      const keys = Array.isArray(details) ? (details.find((d) => d && d.code === 'unrecognized_keys')?.keys || []) : [];

      // If server complains about specific keys, remove them and retry
      if (resp && resp.status === 400 && keys.length > 0) {
        for (const k of keys) {
          delete attemptBody[k];
          if (attemptBody.scrapeOptions && k in attemptBody.scrapeOptions) delete attemptBody.scrapeOptions[k];
        }
        // Additionally normalize some common key name changes
        if ('maxDiscoveryDepth' in attemptBody && attemptBody.maxDiscoveryDepth != null) {
          // Some versions expect `maxDepth` instead
          attemptBody.maxDepth = attemptBody.maxDepth || attemptBody.maxDiscoveryDepth;
          delete attemptBody.maxDiscoveryDepth;
        }
        if ('deduplicateSimilarURLs' in attemptBody) {
          attemptBody.deduplicate = attemptBody.deduplicate || attemptBody.deduplicateSimilarURLs;
          delete attemptBody.deduplicateSimilarURLs;
        }
        continue; // retry
      }

      // On first failure, try a minimal payload, then rethrow if it also fails
      if (attempt === 1) {
        attemptBody = { url: targetUrl, limit: 50 };
        continue;
      }

      throw e;
    }
  }

  throw new Error('Failed to start crawl after multiple attempts');
}

async function pollCrawlStatus(crawlId) {
  const apiKey = getEnvApiKey();
  const tryGet = async () => {
    const url = `${API_BASE}/crawl/status?id=${encodeURIComponent(crawlId)}`;
    const res = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${apiKey}` } });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : undefined; } catch {}
    if (res.status === 404) {
      return { status: 'pending', note: 'not_ready', raw: text };
    }
    if (!res.ok) {
      const err = new Error(`Status HTTP ${res.status}: ${text}`);
      err.response = { status: res.status, text, json };
      throw err;
    }
    return json;
  };

  const tryPost = async () => {
    const url = `${API_BASE}/crawl/status`;
    const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crawlId }) });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : undefined; } catch {}
    if (res.status === 404) return { status: 'pending', note: 'not_ready_post', raw: text };
    if (!res.ok) {
      const err = new Error(`Status POST HTTP ${res.status}: ${text}`);
      err.response = { status: res.status, text, json };
      throw err;
    }
    return json;
  };

  try {
    return await tryGet();
  } catch (e) {
    // Fallback to POST variant
    try {
      return await tryPost();
    } catch (e2) {
      throw e2;
    }
  }
}

async function fetchCrawlResults(crawlId) {
  const apiKey = getEnvApiKey();
  const url = `${API_BASE}/crawl/result?id=${encodeURIComponent(crawlId)}`;
  const res = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${apiKey}` } });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : undefined; } catch {}
  if (!res.ok) {
    const err = new Error(`Result HTTP ${res.status}: ${text}`);
    err.response = { status: res.status, text, json };
    throw err;
  }
  return json;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function saveCrawlResults(outDir, statusJson, crawlId) {
  let results = statusJson && (statusJson.results || statusJson.data || statusJson.pages || []);
  if (!Array.isArray(results) || results.length === 0) {
    try {
      const resultJson = await fetchCrawlResults(crawlId);
      results = resultJson.results || resultJson.data || resultJson.pages || [];
    } catch {}
  }
  if (!Array.isArray(results)) results = [];
  const pagesDir = path.join(outDir, 'pages');
  let saved = 0;
  for (const item of results) {
    if (!item || !item.url) continue;
    const fileHtml = urlToFilePath(pagesDir, item.url, '.html');
    const html = item.html || extractField(item, 'html') || '';
    const markdown = item.markdown || extractField(item, 'markdown') || '';
    if (html) {
      await writeText(fileHtml, html);
      saved += 1;
    }
    if (markdown) {
      const mdPath = fileHtml.replace(/\.html$/, '.md');
      await writeText(mdPath, markdown);
    }
  }
  await writeText(path.join(outDir, 'crawl.results.meta.json'), JSON.stringify({ saved, total: results.length }, null, 2));
}

async function scrapeOne(targetUrl) {
  const body = { url: targetUrl, formats: ['html', 'markdown'] };
  return apiFetch('/scrape', { body: JSON.stringify(body) });
}

function isInternal(base, href) {
  try {
    const bu = new URL(base);
    const hu = new URL(href, bu);
    return bu.hostname === hu.hostname && (hu.protocol === 'http:' || hu.protocol === 'https:');
  } catch { return false; }
}

function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    return x.toString();
  } catch { return u; }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function parseSitemapXml(xml) {
  const urls = [];
  const locRegex = /<\s*loc\s*>\s*([^<]+?)\s*<\s*\/\s*loc\s*>/gi;
  let m;
  while ((m = locRegex.exec(xml))) {
    const loc = m[1].trim();
    if (loc) urls.push(loc);
  }
  return urls;
}

async function discoverSitemaps(baseUrl, maxDepth = 5) {
  const base = new URL(baseUrl);
  const candidates = new Set([
    new URL('/robots.txt', base).toString(),
    new URL('/sitemap.xml', base).toString(),
    new URL('/sitemap_index.xml', base).toString(),
  ]);
  const sitemapXmlUrls = new Set();

  // robots.txt discovery
  try {
    const robotsText = await fetchText(new URL('/robots.txt', base).toString());
    for (const line of robotsText.split(/\r?\n/)) {
      const m = line.match(/sitemap:\s*(https?:[^\s#]+)/i);
      if (m && m[1]) sitemapXmlUrls.add(m[1].trim());
    }
  } catch {}

  // Fallback candidates
  for (const c of candidates) {
    if (c.endsWith('robots.txt')) continue;
    sitemapXmlUrls.add(c);
  }

  // Load and expand sitemap indexes (recursive up to maxDepth)
  const toVisit = Array.from(sitemapXmlUrls);
  const visited = new Set();
  const discoveredUrls = new Set();
  let depth = 0;
  while (toVisit.length && depth < maxDepth) {
    const cur = toVisit.shift();
    if (!cur || visited.has(cur)) continue;
    visited.add(cur);
    try {
      const xml = await fetchText(cur);
      const locs = parseSitemapXml(xml);
      for (const loc of locs) {
        if (/\.xml($|[?#])/i.test(loc)) {
          if (!visited.has(loc)) toVisit.push(loc);
        } else if (isInternal(baseUrl, loc)) {
          discoveredUrls.add(normalizeUrl(loc));
        }
      }
    } catch {}
    depth += 1;
  }

  return Array.from(discoveredUrls);
}

async function batchFromUrlList(baseUrl, outDir, urls, concurrency = 5) {
  const internal = Array.from(new Set(urls.filter((u) => isInternal(baseUrl, u)).map(normalizeUrl)));
  if (internal.length === 0) return { attempted: 0, saved: 0 };
  console.log(`[clone] Batch scraping ${internal.length} pages from sitemap...`);
  const pagesDir = path.join(outDir, 'pages');
  let idx = 0; let saved = 0; const errors = [];

  async function worker() {
    while (idx < internal.length) {
      const myIdx = idx; idx += 1;
      const url = internal[myIdx];
      try {
        const data = await scrapeOne(url);
        const html = extractField(data, 'html') || '';
        const markdown = extractField(data, 'markdown') || '';
        if (html) {
          const fileHtml = urlToFilePath(pagesDir, url, '.html');
          await writeText(fileHtml, html);
          if (markdown) await writeText(fileHtml.replace(/\.html$/, '.md'), markdown);
          saved += 1;
        }
      } catch (e) {
        errors.push({ url, error: e && e.message ? e.message : String(e) });
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i += 1) workers.push(worker());
  await Promise.all(workers);
  await writeText(path.join(outDir, 'sitemap.meta.json'), JSON.stringify({ attempted: internal.length, saved, errors }, null, 2));
  console.log(`[clone] Sitemap batch saved ${saved}/${internal.length} pages.`);
  return { attempted: internal.length, saved };
}

async function batchFromHomepageLinks(baseUrl, outDir, maxPages = 50, concurrency = 5) {
  const linksPath = path.join(outDir, 'homepage.links.json');
  let links = [];
  try {
    links = JSON.parse(await fs.promises.readFile(linksPath, 'utf8')) || [];
  } catch {}
  if (!Array.isArray(links)) links = [];
  const internal = Array.from(new Set(links.filter((u) => isInternal(baseUrl, u)).map(normalizeUrl)));
  const targets = internal.slice(0, maxPages);
  if (targets.length === 0) {
    console.log('[clone] No internal links found on homepage.');
    return { attempted: 0, saved: 0 };
  }

  console.log(`[clone] Batch scraping ${targets.length} pages...`);
  let inFlight = 0; let idx = 0; let saved = 0; const errors = [];
  const pagesDir = path.join(outDir, 'pages');

  async function worker() {
    while (idx < targets.length) {
      const myIdx = idx; idx += 1;
      const url = targets[myIdx];
      try {
        const data = await scrapeOne(url);
        const html = extractField(data, 'html') || '';
        const markdown = extractField(data, 'markdown') || '';
        if (html) {
          const fileHtml = urlToFilePath(pagesDir, url, '.html');
          await writeText(fileHtml, html);
          if (markdown) await writeText(fileHtml.replace(/\.html$/, '.md'), markdown);
          saved += 1;
        }
      } catch (e) {
        errors.push({ url, error: e && e.message ? e.message : String(e) });
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i += 1) workers.push(worker());
  await Promise.all(workers);
  await writeText(path.join(outDir, 'batch.meta.json'), JSON.stringify({ attempted: targets.length, saved, errors }, null, 2));
  console.log(`[clone] Batch saved ${saved}/${targets.length} pages.`);
  return { attempted: targets.length, saved };
}

async function main() {
  const [, , command = 'start', urlArg] = process.argv;
  const targetUrl = urlArg || process.env.CLONE_URL || 'https://os.ryo.lu/';
  const outDir = toHostDir(targetUrl);
  await ensureDir(outDir);

  if (command === 'start') {
    console.log(`[clone] Scraping homepage: ${targetUrl}`);
    await scrapeHomepage(targetUrl, outDir);
    console.log('[clone] Homepage saved. Starting crawl...');
    const id = await startCrawl(targetUrl, outDir);
    console.log(`[clone] Crawl started: id=${id}`);
    console.log(`[clone] To poll: node scripts/clone-site-firecrawl.js poll ${targetUrl}`);
    return;
  }

  if (command === 'batch') {
    console.log(`[clone] Scraping homepage: ${targetUrl}`);
    await scrapeHomepage(targetUrl, outDir);
    await batchFromHomepageLinks(targetUrl, outDir, Number(process.env.CLONE_LIMIT || 50), Number(process.env.CLONE_CONCURRENCY || 5));
    console.log(`[clone] Saved to ${outDir}`);
    return;
  }

  if (command === 'sitemap') {
    console.log(`[clone] Discovering sitemap URLs for ${targetUrl}`);
    const urls = await discoverSitemaps(targetUrl, 10);
    await writeText(path.join(outDir, 'sitemap.urls.json'), JSON.stringify(urls, null, 2));
    if (urls.length === 0) {
      console.log('[clone] No URLs discovered from sitemap.');
    } else {
      await batchFromUrlList(targetUrl, outDir, urls, Number(process.env.CLONE_CONCURRENCY || 5));
    }
    console.log(`[clone] Saved to ${outDir}`);
    return;
  }

  if (command === 'poll') {
    const metaPath = path.join(outDir, 'crawl.meta.json');
    const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf8'));
    const crawlId = meta.id;
    if (!crawlId) throw new Error('crawl.meta.json missing id');

    console.log(`[clone] Polling crawl status id=${crawlId}`);
    const started = Date.now();
    const maxMs = 15 * 60 * 1000; // 15 minutes
    let status;
    while (true) {
      try {
        status = await pollCrawlStatus(crawlId);
        const st = status.status || status.state || 'unknown';
        const progress = status.progress || status.completed || 0;
        console.log(`[clone] status=${st} progress=${progress}`);
        await writeText(path.join(outDir, 'crawl.status.json'), JSON.stringify(status, null, 2));
        if (/completed|succeeded|done/i.test(st)) break;
        if (/failed|error/i.test(st)) throw new Error(`Crawl failed: ${JSON.stringify(status).slice(0, 300)}`);
      } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        console.log(`[clone] transient error while polling: ${msg}`);
      }
      if (Date.now() - started > maxMs) throw new Error('Crawl polling timed out');
      await sleep(5000);
    }

    console.log('[clone] Saving crawl results...');
    await saveCrawlResults(outDir, status, crawlId);
    console.log(`[clone] Saved to ${outDir}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch(async (err) => {
  try {
    const logDir = path.join('snapshots', 'logs');
    await ensureDir(logDir);
    await writeText(path.join(logDir, 'clone-error.log'), String(err && err.stack ? err.stack : err));
  } catch {}
  console.error('[clone] Error:', err.message || err);
  process.exit(1);
});
