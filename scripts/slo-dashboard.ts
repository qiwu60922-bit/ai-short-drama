/** usage: slo-dashboard --out DIR LEDGER.jsonl [LEDGER2.jsonl ...] [--slo slo.json] */
import { readFileSync } from 'node:fs';
import { buildSloReport, writeSloDashboard } from '@/agents/v15/slo-dashboard';
const a = process.argv.slice(2); const oi = a.indexOf('--out'); const si = a.indexOf('--slo');
if (oi < 0) { console.error('usage: slo-dashboard --out DIR LEDGER.jsonl...'); process.exit(2); }
const skip = new Set([oi, oi + 1, si, si + 1].filter(i => i >= 0));
const r = buildSloReport(a.filter((_, i) => !skip.has(i)), si >= 0 ? JSON.parse(readFileSync(a[si + 1], 'utf8')) : {});
console.log(JSON.stringify({ overall: r.overall, totalCostUsd: r.totalCostUsd, ...writeSloDashboard(a[oi + 1], r) }, null, 2));
