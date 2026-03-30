#!/usr/bin/env ts-node
import path from 'path';
import { generateAlignmentReport, loadCachedReport, isCacheFresh } from '../src/lib/methodology/alignment';

const args = process.argv.slice(2);
const force = args.includes('--force');
const jsonOnly = args.includes('--json');
const maxAgeMin = (() => {
  const idx = args.findIndex((a) => a === '--max-age-min');
  if (idx >= 0 && args[idx + 1]) {
    const n = Number(args[idx + 1]);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 15;
})();

function main() {
  const projectRoot = path.resolve(process.cwd());
  if (!force && isCacheFresh(maxAgeMin * 60 * 1000)) {
    const cached = loadCachedReport();
    if (cached) {
      if (jsonOnly) {
        process.stdout.write(JSON.stringify(cached, null, 2));
      } else {
        process.stdout.write(`Using cached report from ${cached.generatedAt}.\n`);
        process.stdout.write(`Score: ${cached.summary.score}% (${cached.summary.level})\n`);
        process.stdout.write(`${cached.files.reportMarkdownPath}\n`);
      }
      process.exit(0);
    }
  }

  const report = generateAlignmentReport(projectRoot);
  if (jsonOnly) {
    process.stdout.write(JSON.stringify(report, null, 2));
  } else {
    process.stdout.write(`Generated report at ${report.files.reportMarkdownPath}\n`);
    process.stdout.write(`Score: ${report.summary.score}% (${report.summary.level})\n`);
  }
}

main();



