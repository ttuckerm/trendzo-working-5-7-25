const fs = require('fs/promises');
const path = require('path');

function matchesQuery(template, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (template.name.toLowerCase().includes(needle)) return true;
  return (template.keyPatterns || []).some((p) => String(p).toLowerCase().includes(needle));
}

async function loadSeed() {
  const filePath = path.join(process.cwd(), 'data', 'seed', 'recipe-book.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const json = JSON.parse(raw);
  return json.templates || [];
}

function filterSort(templates, params = {}) {
  const { status, q, sort } = params;
  let result = Array.isArray(templates) ? templates.slice() : [];
  if (status) {
    result = result.filter((t) => t.status === status);
  }
  if (q && q.trim().length > 0) {
    result = result.filter((t) => matchesQuery(t, q));
  }
  if (sort) {
    result.sort((a, b) => {
      if (sort === 'success') return (b.successRate || 0) - (a.successRate || 0);
      if (sort === 'uses') return (b.uses || 0) - (a.uses || 0);
      if (sort === 'trend') return (b.trendDelta7d || 0) - (a.trendDelta7d || 0);
      return 0;
    });
  }
  return result;
}

module.exports = { matchesQuery, loadSeed, filterSort };


