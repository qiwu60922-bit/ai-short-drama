/** (3) summary marks rerun-awaiting-re-review; (1) scene refs from REF_INDEX (never auto-lock). */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { summarizeQcReview } from '@/agents/assembly/qc-review-rerun';
import { bindingsFromRefIndex, sceneRefsFromRefIndex } from '@/agents/assembly/ref-index-bindings';
import { convertShotSpecToMultiShot } from '@/agents/assembly/beatplan-to-multishot';
import type { ShotQcRecord } from '@/agents/assembly/shot-qc-record';

const tmp = () => mkdtempSync(join(tmpdir(), 'rs-'));
const rec = (qc: string, id: string, status: ShotQcRecord['identity']['status'], note = ''): ShotQcRecord => ({
  schemaVersion: 1, shotId: id, takePath: `/t/${id}.mp4`, probe: { width: 1, height: 1, fps: 24, durationSeconds: 1 },
  stills: (['first', 'mid', 'last'] as const).map((role) => ({ role, timeSeconds: 0, path: join(qc, id, `${role}.png`), contentSha256: 'a'.repeat(64) })),
  identity: { status, reviewer: status === 'PENDING_REVIEW' ? null : '吴琦', reviewedAt: null, note },
  gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' }, createdAt: 'x',
});
const put = (qc: string, r: ShotQcRecord, history?: ShotQcRecord) => {
  mkdirSync(join(qc, r.shotId), { recursive: true });
  writeFileSync(join(qc, r.shotId, 'qc-record.json'), JSON.stringify(r));
  if (history) { mkdirSync(join(qc, r.shotId, 'history')); writeFileSync(join(qc, r.shotId, 'history', 'qc-record-1.json'), JSON.stringify(history)); }
};

describe('summary: rerun awaiting re-review', () => {
  it('pending shot with archived HUMAN_FAIL history → RERUN_AWAITING_REREVIEW with previous note', async () => {
    const qc = tmp();
    put(qc, rec(qc, 'S01', 'HUMAN_PASS'));
    put(qc, rec(qc, 'S07', 'PENDING_REVIEW'), rec(qc, 'S07', 'HUMAN_FAIL', '枪影方向不对'));
    put(qc, rec(qc, 'S09', 'PENDING_REVIEW'));
    const s = await summarizeQcReview(qc);
    expect(s.rerunAwaiting).toEqual([{ shotId: 'S07', previousNote: '枪影方向不对', rerunCount: 1 }]);
    expect(s.pendingShots).toEqual(['S09']);
    expect(s.pending).toBe(2);
    const md = readFileSync(join(qc, 'review-summary.md'), 'utf8');
    expect(md).toContain('已重做，待再审');
    expect(md).toContain('枪影方向不对');
  });
  it('re-reviewed after rerun → no longer awaiting', async () => {
    const qc = tmp();
    put(qc, rec(qc, 'S07', 'HUMAN_PASS'), rec(qc, 'S07', 'HUMAN_FAIL', 'x'));
    expect((await summarizeQcReview(qc)).rerunAwaiting).toEqual([]);
  });
});

const REF = JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01/REF_INDEX.json'), 'utf8'));
const SPEC = JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01/SHOT_SPEC.json'), 'utf8'));
const SHA = 'd'.repeat(64);

describe('scene refs from REF_INDEX', () => {
  it('fixture carries S01/S14 scene entries as SPEC_PENDING → no scene binding, character bindings unaffected', () => {
    const r = sceneRefsFromRefIndex(REF);
    expect(r.byShot).toEqual({});
    expect(r.decisions.map((d) => [d.sceneId, d.outcome])).toEqual(expect.arrayContaining([['scene-ep01-s01', 'EXCLUDED'], ['scene-ep01-s14', 'EXCLUDED']]));
    expect(Object.keys(bindingsFromRefIndex(REF).bindings).sort()).toEqual(['qi-ye', 'zhui-yu-shitu']);
  });
  it('HUMAN_LOCK scene entry → binding for listed shots; LOCK_CANDIDATE never bound', () => {
    const idx = structuredClone(REF);
    idx['scene-ep01-s01'] = { ...idx['scene-ep01-s01'], status: 'HUMAN_LOCK', files: [{ path: '/r/s01.png', role: 'scene_establish', sha256: SHA }] };
    idx['scene-ep01-s14'] = { ...idx['scene-ep01-s14'], status: 'LOCK_CANDIDATE', files: [{ path: '/r/s14.png', role: 'scene_title', sha256: SHA }] };
    const r = sceneRefsFromRefIndex(idx);
    expect(Object.keys(r.byShot)).toEqual(['S01']);
    expect(r.byShot.S01).toMatchObject({ characterId: 'scene-ep01-s01', refContentSha256: SHA, appearanceContentSha256: SHA, operatorKind: 'dna_locked_export' });
  });
  it('converter prefers per-shot locked scene ref over placeholder sceneRef', () => {
    const b = (id: string, c: string) => ({ characterId: id, appearanceRevisionId: 'r', refContentSha256: c.repeat(64), appearanceContentSha256: c.repeat(64), firstFramePath: `${id}.png` });
    const bindings = { 'qi-ye': b('qi-ye', 'a'), 'fei-yue-li': b('fei-yue-li', 'b'), 'zhui-yu-shitu': b('zhui-yu-shitu', 'c') };
    const r = convertShotSpecToMultiShot(SPEC, undefined, { workDir: '/w', bindings, sceneRef: b('placeholder', 'e'), sceneRefsByShot: { S01: b('scene-ep01-s01', 'd') } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.list.shots.find((s) => s.shotId === 'S01')?.ref?.characterId).toBe('scene-ep01-s01');
    expect(r.list.shots.find((s) => s.shotId === 'S14')?.ref?.characterId).toBe('placeholder');
  });
});
