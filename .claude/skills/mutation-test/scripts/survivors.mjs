#!/usr/bin/env node
// Every mutant Stryker left alive, out of its JSON report, one per line, then the count of each status:
//
//   survivors.mjs [reports/mutation/mutation.json]
//
// Read from the report, never from the console: the clear-text reporter prints survivors before its
// table, so anything that keeps only the tail of the output drops them without a word.
import { readFileSync } from 'node:fs';

const ALIVE = new Set(['Survived', 'NoCoverage']);
const report = JSON.parse(
  readFileSync(process.argv[2] ?? 'reports/mutation/mutation.json', 'utf8'),
);

const counts = new Map();
for (const [file, { source, mutants }] of Object.entries(report.files)) {
  const lines = source.split('\n');
  for (const { status, mutatorName, replacement, location } of mutants) {
    counts.set(status, (counts.get(status) ?? 0) + 1);
    if (!ALIVE.has(status)) continue;
    const { line, column } = location.start;
    const original = lines[line - 1].trim();
    console.log(
      `${file}:${line}:${column} ${status} ${mutatorName} → ${replacement} | ${original}`,
    );
  }
}
if (counts.size === 0) {
  console.log('0 mutants: nothing was proved. Mutate the changed lines by hand and run the suite.');
  process.exit(1);
}
console.log(
  [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, n]) => `${status} ${n}`)
    .join(', '),
);
