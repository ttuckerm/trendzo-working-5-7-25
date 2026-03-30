#!/usr/bin/env node
/**
 * Ingest frameworks from a Markdown file.
 * 
 * Usage:
 *   node scripts/ingest-frameworks-from-md.js path/to/frameworks.md
 * 
 * The Markdown file should contain code blocks with either:
 * - JSON array of FrameworkGene-like objects (for cache):
 *   ```json frameworks
 *   [ { id, name, description, detection_method, success_rate, applicability, examples, trigger_words, pattern_type, emotional_impact, viral_score_multiplier } ]
 *   ```
 * - JSON array of FrameworkPattern-like objects (for comprehensive library):
 *   ```json patterns
 *   [ { id, name, category, tier, viralRate, description, patterns: ["regex"], visualCues, platformAlignment, benchmarks, optimizationTips } ]
 *   ```
 */
const fs = require('fs');
const path = require('path');

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function extractCodeBlocks(markdown) {
  const blocks = [];
  const regex = /```json\s*(\w+)?\s*[\r\n]([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown))) {
    blocks.push({ label: (match[1] || '').trim(), content: match[2] });
  }
  return blocks;
}

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function mergeUniqueById(existing, incoming) {
  const map = new Map(existing.map((e) => [String(e.id), e]));
  for (const item of incoming) {
    map.set(String(item.id), { ...map.get(String(item.id)), ...item });
  }
  return Array.from(map.values());
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function coerceFrameworkGenes(items) {
  return items.map((g, idx) => ({
    id: typeof g.id === 'number' ? g.id : idx,
    name: String(g.name || `Gene_${idx}`),
    description: String(g.description || ''),
    detection_method: String(g.detection_method || 'regex'),
    success_rate: typeof g.success_rate === 'number' ? g.success_rate : 0.7,
    applicability: Array.isArray(g.applicability) ? g.applicability.map(String) : [],
    examples: Array.isArray(g.examples) ? g.examples.map(String) : [],
    pattern_type: g.pattern_type ? String(g.pattern_type) : undefined,
    trigger_words: Array.isArray(g.trigger_words) ? g.trigger_words.map(String) : [],
    emotional_impact: typeof g.emotional_impact === 'number' ? g.emotional_impact : undefined,
    viral_score_multiplier: typeof g.viral_score_multiplier === 'number' ? g.viral_score_multiplier : 1.0
  }));
}

function coerceFrameworkPatterns(items) {
  return items.map((p, idx) => ({
    id: String(p.id ?? `custom_${idx}`),
    name: String(p.name || `Custom Pattern ${idx}`),
    category: ['hook-driven','visual-format','content-series','algorithm-optimization','growth-research'].includes(p.category) ? p.category : 'hook-driven',
    tier: [1,2,3].includes(p.tier) ? p.tier : 3,
    viralRate: typeof p.viralRate === 'number' ? p.viralRate : 0.12,
    description: String(p.description || ''),
    patterns: Array.isArray(p.patterns) ? p.patterns.map(String) : [],
    visualCues: Array.isArray(p.visualCues) ? p.visualCues.map(String) : [],
    platformAlignment: p.platformAlignment || { tiktok: 3, instagram: 3, youtube: 3, linkedin: 3 },
    benchmarks: p.benchmarks || {},
    optimizationTips: Array.isArray(p.optimizationTips) ? p.optimizationTips.map(String) : []
  }));
}

function main() {
  const mdPath = process.argv[2];
  if (!mdPath) {
    console.error('Usage: node scripts/ingest-frameworks-from-md.js path/to/frameworks.md');
    process.exit(1);
  }

  const markdown = readFile(mdPath);
  const blocks = extractCodeBlocks(markdown);

  let genesIncoming = [];
  let patternsIncoming = [];

  if (blocks.length > 0) {
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block.content);
        if (!Array.isArray(parsed)) continue;
        if (block.label === 'patterns') {
          patternsIncoming.push(...coerceFrameworkPatterns(parsed));
        } else {
          // default to genes when label missing or 'frameworks'
          genesIncoming.push(...coerceFrameworkGenes(parsed));
        }
      } catch (e) {
        console.warn('Skipping invalid JSON block:', e.message);
      }
    }
  } else {
    // Fallback: parse freeform numbered frameworks in the document
    const parsed = parseFreeformFrameworks(markdown);
    genesIncoming = parsed.genes;
    patternsIncoming = parsed.patterns;
  }

  // Update framework_genes.json (top-level array format)
  const genesPath = path.join(process.cwd(), 'framework_genes.json');
  let existingGenes = [];
  if (fs.existsSync(genesPath)) {
    try {
      const raw = fs.readFileSync(genesPath, 'utf-8');
      const parsed = JSON.parse(raw);
      existingGenes = Array.isArray(parsed) ? parsed : Array.isArray(parsed.genes) ? parsed.genes : [];
    } catch {}
  }
  const mergedGenes = mergeUniqueById(existingGenes, genesIncoming);
  writeJson(genesPath, mergedGenes);
  console.log(`✅ Wrote ${mergedGenes.length} items to framework_genes.json`);

  // Update data/custom_frameworks.json for comprehensive library
  const customPath = path.join(process.cwd(), 'data', 'custom_frameworks.json');
  let existingPatterns = [];
  if (fs.existsSync(customPath)) {
    try {
      const raw = fs.readFileSync(customPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) existingPatterns = parsed;
    } catch {}
  }
  const mergedPatterns = mergeUniqueById(existingPatterns, patternsIncoming);
  writeJson(customPath, mergedPatterns);
  console.log(`✅ Wrote ${mergedPatterns.length} items to data/custom_frameworks.json`);

  console.log('🎉 Ingestion complete. Restart server or call DELETE /api/admin/cache-stats to refresh caches.');
}

main();

// ===== Freeform parser for numbered framework compendiums =====
function parseFreeformFrameworks(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*(\d{1,3})\.\s+(.+?)\s*$/);
    if (m) {
      if (current) sections.push(current);
      current = { idx: parseInt(m[1], 10), title: m[2].trim(), content: [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);

  const genes = [];
  const patterns = [];

  sections.forEach((sec, i) => {
    const text = sec.content.join('\n');
    const idStr = `md_${sec.idx}`;
    const name = sec.title.replace(/\s*Framework\s*$/i, '').trim();
    const category = classifyCategory(name, text);
    const tips = extractChecklist(text);
    const exampleStrings = extractQuotedExamples(text);
    const success = extractSuccessRate(text);

    // Patterns entry (for comprehensive library)
    patterns.push({
      id: idStr,
      name,
      category,
      tier:  determineTier(name, text),
      viralRate: success || 0.12,
      description: extractDescription(text),
      patterns: exampleStrings.slice(0, 5),
      visualCues: extractVisualCues(text),
      platformAlignment: { tiktok: 3, instagram: 3, youtube: 3, linkedin: 3 },
      benchmarks: {},
      optimizationTips: tips.slice(0, 6)
    });

    // Gene entry (for fast cache)
    genes.push({
      id: 100000 + i,
      name,
      description: extractDescription(text),
      detection_method: 'nlp',
      success_rate: success || 0.7,
      applicability: [category],
      examples: exampleStrings.slice(0, 5),
      pattern_type: category,
      trigger_words: extractKeywords(exampleStrings).slice(0, 10),
      emotional_impact: undefined,
      viral_score_multiplier: 1.0
    });
  });

  return {
    genes: coerceFrameworkGenes(genes),
    patterns: coerceFrameworkPatterns(patterns)
  };
}

function classifyCategory(name, text) {
  const n = `${name} ${text}`.toLowerCase();
  if (/hook/.test(n)) return 'hook-driven';
  if (/format|visual|green screen|split screen|clone|walking|b-roll|shot|angle/.test(n)) return 'visual-format';
  if (/series|episode/.test(n)) return 'content-series';
  if (/algorithm|optimization|seo|watch time|template|percentile|dps/.test(n)) return 'algorithm-optimization';
  return 'growth-research';
}

function determineTier(name, text) {
  const n = `${name} ${text}`.toLowerCase();
  if (/tier\s*1|top\s*1%|mega-?viral/.test(n)) return 1;
  if (/tier\s*2|top\s*5%|hyper-?viral/.test(n)) return 2;
  return 3;
}

function extractChecklist(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^[•\-\*]\s*\[\s*\]\s*(.+)$/); // • [ ] item
    if (m) out.push(m[1].trim());
  }
  return out;
}

function extractQuotedExamples(text) {
  const out = [];
  const re = /"([^"\n]{4,200})"/g;
  let m;
  while ((m = re.exec(text))) {
    out.push(m[1].trim());
  }
  return Array.from(new Set(out));
}

function extractSuccessRate(text) {
  const percents = [];
  const re = /(\d{1,3})\s*%/g;
  let m;
  while ((m = re.exec(text))) {
    const v = parseInt(m[1], 10);
    if (v >= 1 && v <= 100) percents.push(v);
  }
  if (percents.length === 0) return null;
  const best = Math.max(...percents);
  return Math.min(best / 100, 0.95);
}

function extractDescription(text) {
  const first = text.split(/\r?\n/).find(l => /When to Use:|Core Mechanics:|Success Benchmarks|Leverage|Identify|Master|Transform/i.test(l));
  return first ? first.replace(/^\s*[•\-\*]\s*/, '').trim() : '';
}

function extractVisualCues(text) {
  const cues = [];
  if (/green screen/i.test(text)) cues.push('green_screen');
  if (/split screen/i.test(text)) cues.push('split_screen');
  if (/walking|moving/i.test(text)) cues.push('movement');
  if (/b-?roll/i.test(text)) cues.push('b_roll');
  if (/shot|angle/i.test(text)) cues.push('shot_changes');
  return cues;
}

function extractKeywords(examples) {
  const words = [];
  for (const ex of examples) {
    ex.split(/[^a-z0-9]+/i).forEach(w => {
      const lw = w.toLowerCase();
      if (lw.length >= 4 && !['this','that','with','from','your','youre','theyre','about','into','over','under'].includes(lw)) {
        words.push(lw);
      }
    });
  }
  return Array.from(new Set(words));
}

