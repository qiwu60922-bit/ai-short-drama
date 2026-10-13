/**
 * V15 publish gate. canPublish is true only when ALL hold:
 *  - a separate human G3 sign-off receipt (v15/G3SignoffReceipt/v1) exists, self-hash valid, decision G3_PASS, named human signer;
 *  - it binds the exact episode mp4 sha256 and the detectors report sha256;
 *  - every shot in qc/ is HUMAN_PASS (human review receipts, V12);
 *  - detectors are not FAIL / G3 BLOCKED; any INCOMPLETE detector was explicitly acknowledged by the signer.
 * Sign-off can only be created interactively (TTY + typed phrase) and refuses agent/CI environments.
 * There is NO publish action in this codebase: publishAction is always NOT_IMPLEMENTED.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NON_HUMAN_REVIEWER } from '@/agents/assembly/qc-human-review';
export const G3_SIGNOFF_SCHEMA = 'v15/G3SignoffReceipt/v1' as const;
export const G3_CONFIRM_PHRASE = '我本人确认 G3';
const AGENT_ENV = ['GROK_BOT_AGENT', 'GROKBOT', 'CURSOR_AGENT', 'CI', 'GITHUB_ACTIONS', 'AGENT_MODE'];
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
export interface G3SignoffInput { episodeId: string; signer: string; decision: 'G3_PASS' | 'G3_FAIL'; episodeMp4: string; detectorsReport: string; acknowledgedIncomplete?: string[]; note?: string }
export interface G3Attestation { isTTY: boolean; typedPhrase: string; env: Record<string, string | undefined> }
export function createG3Signoff(i: G3SignoffInput, a: G3Attestation) {
  if (!a.isTTY) throw new Error('G3 sign-off must be interactive (TTY); machines cannot sign');
  if (AGENT_ENV.some(k => a.env[k])) throw new Error('G3 sign-off refused in agent/CI environment');
  if (!i.signer?.trim() || NON_HUMAN_REVIEWER.test(i.signer.trim())) throw new Error('G3 signer must be a named human');
  if (a.typedPhrase.trim() !== `${G3_CONFIRM_PHRASE} ${i.episodeId}`) throw new Error(`confirmation phrase mismatch; type exactly: ${G3_CONFIRM_PHRASE} ${i.episodeId}`);
  const core = { schema: G3_SIGNOFF_SCHEMA, episodeId: i.episodeId, signer: i.signer.trim(), signedAt: new Date().toISOString(), decision: i.decision,
    episodeMp4Sha256: sha(readFileSync(i.episodeMp4)), detectorsReportSha256: sha(readFileSync(i.detectorsReport)),
    acknowledgedIncomplete: i.acknowledgedIncomplete ?? [], note: i.note ?? '', method: 'interactive-tty' as const };
  return { ...core, receiptSha256: sha(JSON.stringify(core)) };
}
export type G3Signoff = ReturnType<typeof createG3Signoff>;
export function writeG3Signoff(dir: string, r: G3Signoff): string {
  mkdirSync(dir, { recursive: true }); const p = join(dir, `G3_SIGNOFF_${r.episodeId}.json`); writeFileSync(p, JSON.stringify(r, null, 2)); return p;
}
export async function evaluateCanPublish(x: { episodeId: string; episodeMp4: string; qcDir: string; detectorsReport: string; g3ReceiptPath: string }) {
  const reasons: string[] = [];
  let g: G3Signoff | undefined;
  if (!existsSync(x.g3ReceiptPath)) reasons.push('no human G3 sign-off receipt');
  else {
    g = JSON.parse(readFileSync(x.g3ReceiptPath, 'utf8')) as G3Signoff;
    const { receiptSha256, ...core } = g;
    if (g.schema !== G3_SIGNOFF_SCHEMA) reasons.push('G3 sign-off: bad schema');
    if (sha(JSON.stringify(core)) !== receiptSha256) reasons.push('G3 sign-off receiptSha256 mismatch (edited)');
    if (NON_HUMAN_REVIEWER.test(g.signer ?? '') || !g.signer) reasons.push('G3 sign-off signer not a named human');
    if (g.episodeId !== x.episodeId) reasons.push('G3 sign-off is for another episode');
    if (g.decision !== 'G3_PASS') reasons.push(`G3 decision is ${g.decision}`);
    if (!existsSync(x.episodeMp4) || sha(readFileSync(x.episodeMp4)) !== g.episodeMp4Sha256) reasons.push('episode mp4 sha differs from signed one');
    if (!existsSync(x.detectorsReport) || sha(readFileSync(x.detectorsReport)) !== g.detectorsReportSha256) reasons.push('detectors report differs from signed one');
  }
  if (existsSync(x.detectorsReport)) {
    const s = JSON.parse(readFileSync(x.detectorsReport, 'utf8')).summary ?? {};
    if (s.overall === 'FAIL' || s.g3 === 'BLOCKED') reasons.push('detectors FAIL → G3 BLOCKED');
    const unack = (s.incomplete ?? []).filter((k: string) => !(g?.acknowledgedIncomplete ?? []).includes(k));
    if (unack.length) reasons.push(`incomplete detectors not acknowledged by signer: ${unack.join(', ')}`);
  } else reasons.push('no detectors report');
  const shots = existsSync(x.qcDir) ? readdirSync(x.qcDir).filter(d => existsSync(join(x.qcDir, d, 'qc-record.json'))) : [];
  if (!shots.length) reasons.push('no QC records');
  for (const id of shots) { const st = JSON.parse(readFileSync(join(x.qcDir, id, 'qc-record.json'), 'utf8')).identity?.status;
    if (st !== 'HUMAN_PASS') reasons.push(`${id}: ${st ?? 'PENDING_REVIEW'} (needs HUMAN_PASS)`); }
  return { schema: 'v15/PublishGate/v1' as const, episodeId: x.episodeId, canPublish: reasons.length === 0, reasons, publishAction: 'NOT_IMPLEMENTED' as const, signer: g?.signer ?? null };
}
