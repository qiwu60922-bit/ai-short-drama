/** Wave14 · REF_INDEX bindings (never auto-lock), QC summary page, ep01 offline rehearsal. */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { bindingsFromRefIndex } from '@/agents/assembly/ref-index-bindings';
import { renderQcHtml, renderQcMarkdown, writeQcSummary } from '@/agents/assembly/qc-summary-page';
import { runEp01Rehearsal } from '@/agents/assembly/ep01-rehearsal';
import type { ShotQcRecord } from '@/agents/assembly/shot-qc-record';

const fx = (n: string) => JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01', n), 'utf8'));
const REF = fx('REF_INDEX.json');
const tmp = () => mkdtempSync(join(tmpdir(), 'ep01-'));

describe('REF_INDEX → bindings', () => {
  it('default: only HUMAN_LOCK bound; LOCK_CANDIDATE / DELETED / RESOLVED excluded', () => {
    const { bindings, decisions } = bindingsFromRefIndex(REF);
    expect(Object.keys(bindings).sort()).toEqual(['qi-ye', 'zhui-yu-shitu']);
    expect(decisions.find((d) => d.characterId === 'fei-yue-li')).toMatchObject({ outcome: 'EXCLUDED' });
    expect(decisions.find((d) => d.characterId === 'ye-yuan')).toMatchObject({ outcome: 'EXCLUDED' });
    expect(bindings['zhui-yu-shitu'].firstFramePath).toMatch(/rooftop_gothic\.png$/);
    expect(bindings['qi-ye']).toMatchObject({ operatorKind: 'dna_locked_export' });
    expect(bindings['qi-ye'].refContentSha256).toBe(bindings['qi-ye'].appearanceContentSha256);
  });
  it('opt-in candidate: temporary, no appearance sha claimed, never LOCKED', () => {
    const { bindings, decisions } = bindingsFromRefIndex(REF, { allowCandidatesForDryRun: true });
    const fei = bindings['fei-yue-li'];
    expect(decisions.find((d) => d.characterId === 'fei-yue-li')?.outcome).toBe('TEMPORARY_DRY_RUN');
    expect(fei.appearanceContentSha256).toBeUndefined();
    expect(fei.approvedTemporary?.reason).toMatch(/not HUMAN_LOCK/);
    expect(fei.operatorKind).toBe('hero_portrait');
  });
  it('candidate without index dryRun=ALLOW_PORTRAIT stays excluded even with opt-in', () => {
    const idx = structuredClone(REF); delete idx['fei-yue-li'].dryRun;
    expect(bindingsFromRefIndex(idx, { allowCandidatesForDryRun: true }).bindings['fei-yue-li']).toBeUndefined();
  });
  it('on-disk verification: missing file or sha mismatch → excluded', () => {
    const miss = bindingsFromRefIndex(REF, { verifySha: () => null });
    expect(Object.keys(miss.bindings)).toHaveLength(0);
    const bad = bindingsFromRefIndex(REF, { verifySha: () => '0'.repeat(64) });
    expect(bad.decisions.every((d) => d.outcome === 'EXCLUDED')).toBe(true);
  });
});

const rec = (id: string, status: ShotQcRecord['identity']['status'] = 'PENDING_REVIEW'): ShotQcRecord => ({
  schemaVersion: 1, shotId: id, takePath: `/q/${id}.mp4`, takeSha256: 'a'.repeat(64),
  probe: { width: 1344, height: 768, fps: 24, durationSeconds: 6 },
  stills: (['first', 'mid', 'last'] as const).map((role, i) => ({ role, timeSeconds: i * 3, path: `/q/qc/${id}/${role}.png`, contentSha256: 'b'.repeat(64) })),
  identity: { status, reviewer: status === 'PENDING_REVIEW' ? null : '吴琦', reviewedAt: null, note: '' },
  gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' }, createdAt: 'x',
});

describe('QC summary page', () => {
  it('html: relative triptych, pending count, G3 banner, escapes prompt', () => {
    const html = renderQcHtml([rec('S01'), rec('S02', 'HUMAN_FAIL')], '/q/qc', { title: 't', prompts: { S01: '<script>x</script>' } });
    expect(html).toContain('src="S01/first.png"');
    expect(html).toContain('待复核 1/2');
    expect(html).toContain('NOT_EVALUATED');
    expect(html).not.toContain('<script>x');
    expect(html).toContain('HUMAN_FAIL');
  });
  it('markdown table row per shot', () => {
    const md = renderQcMarkdown([rec('S01')], '/q/qc', { title: 't' });
    expect(md).toContain('| S01 | PENDING_REVIEW | ![](S01/first.png) | ![](S01/mid.png) | ![](S01/last.png) |');
  });
  it('writeQcSummary orders by shot list and skips dirs without record', async () => {
    const d = tmp();
    for (const id of ['S10', 'S02']) { mkdirSync(join(d, id)); writeFileSync(join(d, id, 'qc-record.json'), JSON.stringify({ ...rec(id), stills: rec(id).stills.map((s) => ({ ...s, path: join(d, id, `${s.role}.png`) })) })); }
    mkdirSync(join(d, 'junk'));
    const r = await writeQcSummary(d, { title: 't', order: ['S02', 'S10'] });
    expect(r).toMatchObject({ count: 2, pending: 2 });
    const md = readFileSync(r.md, 'utf8');
    expect(md.indexOf('S02')).toBeLessThan(md.indexOf('S10'));
  });
});

const sceneFile = () => { const p = join(tmp(), 'scene.png'); writeFileSync(p, Buffer.from('fake-scene')); return p; };
const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
describe('ep01 rehearsal', () => {
  const SPEC = fx('SHOT_SPEC.json'), BEAT = fx('WAVE14_EP01_BEATPLAN.json');
  it('without candidate opt-in: fei-yue-li shots unbound → stops at convert (24)', async () => {
    const r = await runEp01Rehearsal({ shotSpec: SPEC, beatPlan: BEAT, refIndex: REF, workDir: tmp(), sceneRefPath: sceneFile() });
    expect(r.exitCode).toBe(24);
    expect(r.problems?.some((p) => p.shotId === 'S07')).toBe(true);
  });
  it('default policy unchanged: v1 96s spec without --duration-range → rejected', async () => {
    const r = await runEp01Rehearsal({ shotSpec: fx('SHOT_SPEC.v1-96s.json'), refIndex: REF, workDir: tmp(), allowCandidatesForDryRun: true, sceneRefPath: sceneFile() });
    expect(r.exitCode).toBe(24);
    expect(r.problems?.[0].code).toBe('DURATION_OUT_OF_RANGE');
  });
  it.skipIf(!hasFfmpeg)('full rehearsal v2 (small canvas, default 60–90, no override): mp4 + 16 QC triptychs + page', async () => {
    const w = tmp();
    const r = await runEp01Rehearsal({ shotSpec: SPEC, beatPlan: BEAT, refIndex: REF, workDir: w, allowCandidatesForDryRun: true,
      canvas: { width: 160, height: 96, fps: 24 } });
    expect(r.exitCode).toBe(0);
    expect(r.run?.concat?.totalSeconds).toBeCloseTo(90, 0);
    expect(existsSync(r.episodeMp4!)).toBe(true);
    expect(readFileSync(r.qcHtml!, 'utf8')).toContain('待复核 16/16');
    expect(r.notes.join(' ')).toMatch(/FAKE provider/);
    expect(existsSync(r.detectors!.reportPath)).toBe(true);
    const det = JSON.parse(readFileSync(r.detectors!.reportPath, 'utf8'));
    expect(det.continuity.pairs.map((p: any) => `${p.from}→${p.to}`)).toEqual(['S09a→S09b', 'S09b→S09c']);
    expect(['FAIL', 'INCOMPLETE']).toContain(r.detectors!.overall); expect(r.detectors!.incomplete).toContain('identity');
    expect(JSON.stringify(det.summary)).not.toMatch(/"PASS"/);
  }, 120_000);
});
