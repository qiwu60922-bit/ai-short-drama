/** V12 human review receipt: proof a named human judged each shot. Machine verdict is always NONE; G3 untouched. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NON_HUMAN_REVIEWER, type QcReviewFile } from './qc-human-review';
export const RECEIPT_SCHEMA = 'v12/HumanReviewReceipt/v1' as const;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
export interface ReceiptShot { shotId: string; verdict: 'HUMAN_PASS' | 'HUMAN_FAIL'; note: string; takePath: string; takeSha256: string | null; stillsSha256: string[] }
export interface ReviewReceipt {
  schema: typeof RECEIPT_SCHEMA; receiptId: string; reviewer: string; reviewedAt: string; reviewFileSha256: string;
  machineVerdict: 'NONE'; gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN'; autoPass: 'FORBIDDEN' };
  shots: ReceiptShot[]; receiptSha256: string;
}
const body = (r: Omit<ReviewReceipt, 'receiptSha256'>) => JSON.stringify(r);
export function buildReviewReceipt(review: QcReviewFile, records: { shotId: string; takePath: string; takeSha256?: string; stills: { contentSha256: string }[] }[], extra: Record<string, unknown> = {}): ReviewReceipt {
  if (!review.reviewer?.trim() || NON_HUMAN_REVIEWER.test(review.reviewer.trim())) throw new Error('receipt requires a named human reviewer');
  if (Object.entries(extra).some(([k, v]) => /g3|autopass|pass/i.test(k) && v)) throw new Error('machine may not assert PASS/G3 in a receipt');
  const byId = new Map(records.map(r => [r.shotId, r]));
  const shots: ReceiptShot[] = review.verdicts.map(v => { const r = byId.get(v.shotId);
    return { shotId: v.shotId, verdict: v.verdict, note: v.note, takePath: r?.takePath ?? '', takeSha256: r?.takeSha256 ?? null, stillsSha256: v.stillsSha256.map(s => s.toLowerCase()) }; });
  const reviewFileSha256 = sha(JSON.stringify(review));
  const core = { schema: RECEIPT_SCHEMA, receiptId: `hrr-${reviewFileSha256.slice(0, 12)}`, reviewer: review.reviewer, reviewedAt: review.reviewedAt, reviewFileSha256,
    machineVerdict: 'NONE' as const, gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const }, shots };
  return { ...core, receiptSha256: sha(body(core)) };
}
export async function writeReviewReceipt(dir: string, r: ReviewReceipt): Promise<string> {
  await mkdir(dir, { recursive: true });
  const p = join(dir, `${r.receiptId}.json`);
  await writeFile(p, JSON.stringify(r, null, 2));
  const md = [`# 人审收据 ${r.receiptId}`, '', `审核人：**${r.reviewer}** · 时间：${r.reviewedAt}`, `机器判定：NONE（机器不代判 PASS）· V11_G3 NOT_EVALUATED · publish FORBIDDEN`, '',
    '| shot | 人审结论 | 备注 | take sha | stills sha |', '|---|---|---|---|---|',
    ...r.shots.map(s => `| ${s.shotId} | ${s.verdict} | ${s.note} | ${(s.takeSha256 ?? '-').slice(0, 12)} | ${s.stillsSha256.map(x => x.slice(0, 8)).join(' ')} |`), '',
    `reviewFileSha256 \`${r.reviewFileSha256}\` · receiptSha256 \`${r.receiptSha256}\``, ''].join('\n');
  await writeFile(p.replace(/\.json$/, '.md'), md);
  return p;
}
export async function verifyReviewReceipt(path: string, qcDir: string) {
  const r: ReviewReceipt = JSON.parse(await readFile(path, 'utf8'));
  const problems: string[] = [];
  const { receiptSha256, ...core } = r;
  if (sha(body(core as any)) !== receiptSha256) problems.push('receiptSha256 mismatch (receipt edited)');
  if (r.machineVerdict !== 'NONE' || r.gates?.V11_G3 !== 'NOT_EVALUATED') problems.push('receipt claims machine verdict/G3');
  if (NON_HUMAN_REVIEWER.test(r.reviewer ?? '')) problems.push('non-human reviewer');
  for (const s of r.shots) {
    try { const q = JSON.parse(await readFile(join(qcDir, s.shotId, 'qc-record.json'), 'utf8'));
      if (q.stills.map((x: any) => x.contentSha256.toLowerCase()).join() !== s.stillsSha256.join()) problems.push(`${s.shotId}: stills changed since receipt`);
    } catch { problems.push(`${s.shotId}: qc-record missing`); }
  }
  return { ok: problems.length === 0, problems };
}
