const fs = require('fs');
const path = require('path');
const ignore = require('C:/Users/thoma/.claude/plugins/cache/understand-anything/understand-anything/2.6.3/node_modules/.pnpm/ignore@7.0.5/node_modules/ignore').default;

const defaults = ['node_modules/','.git/','vendor/','venv/','.venv/','__pycache__/','dist/','build/','out/','coverage/','.next/','.cache/','.turbo/','target/','obj/','*.lock','package-lock.json','yarn.lock','pnpm-lock.yaml','*.png','*.jpg','*.jpeg','*.gif','*.svg','*.ico','*.woff','*.woff2','*.ttf','*.eot','*.mp3','*.mp4','*.pdf','*.zip','*.tar','*.gz','*.min.js','*.min.css','*.map','*.generated.*','.idea/','.vscode/','LICENSE','.gitignore','.editorconfig','.prettierrc','.eslintrc*','*.log'];

const root = 'C:/Projects/CleanCopy';
const ig = ignore();
ig.add(defaults);
ig.add(fs.readFileSync(root + '/.understand-anything/.understandignore', 'utf8'));

function walk(dir, results) {
  if (results.length > 50000) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (ig.ignores(rel + '/')) continue;
      walk(full, results);
    } else {
      if (ig.ignores(rel)) continue;
      results.push(rel);
    }
  }
}

const all = [];
walk(root, all);

console.log('SURVIVING FILES:', all.length);
console.log();
console.log('---TOP-LEVEL ENTRIES THAT SURVIVE---');
const top = {};
all.forEach(p => { const t = p.split('/')[0]; top[t] = (top[t] || 0) + 1; });
Object.entries(top).sort((a,b) => b[1] - a[1]).forEach(([t, c]) => console.log('  ' + t.padEnd(40) + c));
console.log();
console.log('---FILE EXTENSION BREAKDOWN (top 15)---');
const ext = {};
all.forEach(p => { const e = path.extname(p) || '(none)'; ext[e] = (ext[e] || 0) + 1; });
Object.entries(ext).sort((a,b) => b[1] - a[1]).slice(0, 15).forEach(([e, c]) => console.log('  ' + e.padEnd(12) + c));
