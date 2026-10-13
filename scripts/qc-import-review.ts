/**
 * Import a human QC review file (exported from qc/index.html) into qc-record.json and regenerate the page.
 * npx tsx scripts/qc-import-review.ts --qc-dir <run>/qc --review qc-review-XXX.json [--list multishot-list.json]
 * Page order/prompts come from the sibling multishot-list.json (auto-found) ; also writes review-summary.md/json.
 * Exit 0 applied · 2 usage · 25 rejected (nothing written). Never auto-pass; G3 stays NOT_EVALUATED.
 */
import { readFileSync } from 'node:fs';
import { importQcReview } from '@/agents/assembly/qc-human-review';
import { regenerateQcPage, summarizeQcReview } from '@/agents/assembly/qc-review-rerun';

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const qcDir = arg('--qc-dir'), file = arg('--review');
if (!qcDir || !file) { process.stderr.write('usage: qc-import-review --qc-dir DIR --review FILE\n'); process.exit(2); }
let raw: unknown;
try { raw = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { process.stderr.write(`bad review file: ${(e as Error).message}\n`); process.exit(2); }
importQcReview(qcDir, raw).then(async (r) => {
  let page, summary;
  if (r.ok) { page = await regenerateQcPage(qcDir, { listPath: arg('--list') }); summary = await summarizeQcReview(qcDir, { listPath: arg('--list') }); }
  process.stdout.write(JSON.stringify({ ...r, page, summary }, null, 2) + '\n');
  process.exit(r.ok ? 0 : 25);
});
