#!/usr/bin/env node
// Launch Apify TikTok scraper using framework-derived keywords
const fs = require('fs');
const path = require('path');

async function main() {
  const { scrapeTikTokBatch } = require('../src/lib/services/apifyScraper');

  const max = parseInt(process.env.SCRAPE_MAX || '40', 10);
  const keywords = buildKeywordsFromFrameworks(max);

  if (keywords.length === 0) {
    console.error('No keywords to scrape');
    process.exit(1);
  }

  console.log(`Scraping ${keywords.length} keywords...`);
  await scrapeTikTokBatch(keywords);
  console.log('Done');
}

function toHashtag(s) {
  const cleaned = String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '');
  return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
}

function buildKeywordsFromFrameworks(maxKeywords) {
  const results = new Set();
  try {
    const nichesPath = path.join(process.cwd(), 'data', 'niches.json');
    if (fs.existsSync(nichesPath)) {
      const niches = JSON.parse(fs.readFileSync(nichesPath, 'utf-8'));
      niches.forEach((n) => results.add(n));
    }
  } catch {}
  try {
    const rootGenes = path.join(process.cwd(), 'framework_genes.json');
    if (fs.existsSync(rootGenes)) {
      const parsed = JSON.parse(fs.readFileSync(rootGenes, 'utf-8'));
      const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.genes) ? parsed.genes : [];
      for (const g of arr) {
        if (g.name) results.add(g.name);
        if (Array.isArray(g.trigger_words)) g.trigger_words.forEach((w) => results.add(w));
        if (Array.isArray(g.examples)) g.examples.forEach((e) => results.add(String(e).slice(0, 40)));
        if (results.size >= maxKeywords * 3) break;
      }
    }
  } catch {}

  try {
    const custom = path.join(process.cwd(), 'data', 'custom_frameworks.json');
    if (fs.existsSync(custom)) {
      const arr = JSON.parse(fs.readFileSync(custom, 'utf-8'));
      for (const f of arr) {
        if (f?.name) results.add(f.name);
        if (Array.isArray(f?.optimizationTips)) f.optimizationTips.forEach((t) => results.add(String(t).slice(0, 30)));
        if (Array.isArray(f?.patterns)) f.patterns.forEach((p) => results.add(String(p).replace(/[^a-z0-9 ]/gi, ' ').slice(0, 30)));
        if (results.size >= maxKeywords * 4) break;
      }
    }
  } catch {}

  if (results.size < 10) ['authority','story','challenge','tutorial','myth','comparison','transformation','broll','greenscreen'].forEach(k => results.add(k));
  return Array.from(results).slice(0, maxKeywords).map(toHashtag);
}

main().catch((e) => { console.error(e); process.exit(1); });


