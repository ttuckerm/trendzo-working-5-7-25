const fs = require('fs');
const path = require('path');

const root = 'C:/Projects/CleanCopy';
const scan = JSON.parse(fs.readFileSync(root + '/.understand-anything/intermediate/scan-result.json', 'utf8'));

const TARGET = 25;
const files = scan.files;

// Group related non-code files first so they land in the same batch.
// Strategy: bucket by directory + category, then by alphabetic path within.

// Sort files: code-first by directory, then non-code grouped by dir+category
const byDir = {};
files.forEach(f => {
  const dir = path.dirname(f.path);
  const key = `${dir}|${f.fileCategory}`;
  (byDir[key] = byDir[key] || []).push(f);
});

// Flatten in a stable order: walk sorted dir+category keys
const ordered = [];
Object.keys(byDir).sort().forEach(k => {
  byDir[k].sort((a, b) => a.path.localeCompare(b.path)).forEach(f => ordered.push(f));
});

// Build batches of ~TARGET, but never split a directory group across batches if possible
const batches = [];
let current = [];
ordered.forEach(f => {
  current.push(f);
  if (current.length >= TARGET) {
    batches.push(current);
    current = [];
  }
});
if (current.length) batches.push(current);

console.log(`Files: ${files.length}`);
console.log(`Batches: ${batches.length}`);
console.log(`Avg batch size: ${(files.length / batches.length).toFixed(1)}`);

// Write batch plan with batch index, file list, and import data
const importMap = scan.importMap;
const plan = batches.map((batch, idx) => ({
  batchIndex: idx,
  files: batch.map(f => ({ path: f.path, language: f.language, sizeLines: f.sizeLines, fileCategory: f.fileCategory })),
  importMap: Object.fromEntries(batch.map(f => [f.path, importMap[f.path] || []])),
  outputPath: `C:/Projects/CleanCopy/.understand-anything/intermediate/batch-${idx}.json`,
}));

fs.writeFileSync(root + '/.understand-anything/tmp/batches.json', JSON.stringify(plan, null, 0));
console.log(`Wrote plan to: ${root}/.understand-anything/tmp/batches.json`);

// Also write a sidecar "progress" file we'll use to track completion
const progress = { totalBatches: batches.length, completedBatches: [], startedAt: new Date().toISOString() };
fs.writeFileSync(root + '/.understand-anything/tmp/progress.json', JSON.stringify(progress, null, 2));
console.log(`Wrote progress tracker to: ${root}/.understand-anything/tmp/progress.json`);
