/** QC review → summary report + rerun-only-failed plan; page regen uses sibling multishot list. Offline. */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findMultishotList, summarizeQcReview, planRerunFailed, regenerateQcPage } from '@/agents/assembly/qc-review-rerun';
import { importQcReview } from '@/agents/assembly/qc-human-review';
import { runMultiShotOneClick } from '@/agents/assembly/multishot-oneclick';
import { createFakeH3Provider } from '@/agents/assembly/fake-h3-provider';
import type { ShotQcRecord } from '@/agents/assembly/shot-qc-record';

const tmp = () => mkdtempSync(join(tmpdir(), 'rr-'));
const rec = (qc: string, id: string, status: ShotQcRecord['identity']['status'] = 'PENDING_REVIEW', note = ''): ShotQcRecord => ({
  schemaVersion: 1, shotId: id, takePath: `/t/${id}.mp4`, probe: { width: 1, height: 1, fps: 24, durationSeconds: 1 },
  stills: (['first', 'mid', 'last'] as const).map((role) => ({ role, timeSeconds: 0, path: join(qc, id, `${role}.png`), contentSha256: 'a'.repeat(64) })),
  identity: { status, reviewer: status === 'PENDING_REVIEW' ? null : '吴琦', reviewedAt: status === 'PENDING_REVIEW' ? null : 't', note },
  gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' }, createdAt: 'x',
});
function layout(statuses: Record<string, [ShotQcRecord['identity']['status'], string?]>) {
  const work = tmp(); const run = join(work, 'run'); const qc = join(run, 'qc');
  const ids = Object.keys(statuses);
  for (const id of ids) { mkdirSync(join(qc, id), { recursive: true }); writeFileSync(join(qc, id, 'qc-record.json'), JSON.stringify(rec(qc, id, ...statuses[id]))); }
  writeFileSync(join(work, 'multishot-list.json'), JSON.stringify({ shots: [...ids].reverse().map((shotId, order) => ({ shotId, order, positivePrompt: `P-${shotId}` })) }));
  const cp = { schemaVersion: 1, episodeId: 'e', requestSha256: 'x', shots: Object.fromEntries(ids.map((id) => [id, { status: 'SUCCEEDED', exitCode: 0, artifactPath: `/t/${id}.mp4`, attempts: 1 }])) };
  writeFileSync(join(run, 'checkpoint.json'), JSON.stringify(cp));
  return { work, run, qc };
}

describe('sibling multishot list', () => {
  it('found from qc dir (../../multishot-list.json) and gives order + prompts', async () => {
    const { qc } = layout({ S01: ['PENDING_REVIEW'], S02: ['PENDING_REVIEW'] });
    const l = await findMultishotList(qc);
    expect(l?.order).toEqual(['S02', 'S01']);
    expect(l?.prompts.S01).toBe('P-S01');
  });
  it('regenerateQcPage uses list order and prompts, review form on', async () => {
    const { qc } = layout({ S01: ['PENDING_REVIEW'], S02: ['PENDING_REVIEW'] });
    const page = await regenerateQcPage(qc);
    const html = readFileSync(page.html, 'utf8');
    expect(html.indexOf('<h2>S02')).toBeLessThan(html.indexOf('<h2>S01'));
    expect(html).toContain('P-S01');
    expect(html).toContain('id="export-review"');
  });
  it('no list → falls back to id order without prompts', async () => {
    const qc = join(tmp(), 'qc'); mkdirSync(join(qc, 'S01'), { recursive: true });
    writeFileSync(join(qc, 'S01', 'qc-record.json'), JSON.stringify(rec(qc, 'S01')));
    expect(await findMultishotList(qc)).toBeNull();
    expect((await regenerateQcPage(qc)).count).toBe(1);
  });
});

describe('review summary', () => {
  it('counts and lists failed with notes, writes md+json', async () => {
    const { qc } = layout({ S01: ['HUMAN_PASS'], S02: ['HUMAN_FAIL', '发色偏'], S03: ['PENDING_REVIEW'], S04: ['HUMAN_FAIL', '多了剑'] });
    const s = await summarizeQcReview(qc);
    expect(s).toMatchObject({ total: 4, pass: 1, fail: 2, pending: 1 });
    expect(s.failed.map((f) => f.shotId)).toEqual(['S04', 'S02']); // list order (reversed)
    expect(s.failed[1]).toMatchObject({ note: '发色偏', reviewer: '吴琦' });
    expect(s.g3).toBe('NOT_EVALUATED');
    expect(readFileSync(join(qc, 'review-summary.md'), 'utf8')).toContain('多了剑');
    expect(JSON.parse(readFileSync(join(qc, 'review-summary.json'), 'utf8')).fail).toBe(2);
  });
});

describe('rerun only failed', () => {
  it('dry plan lists HUMAN_FAIL shots only; checkpoint untouched', async () => {
    const { work, run } = layout({ S01: ['HUMAN_PASS'], S02: ['HUMAN_FAIL', 'x'], S03: ['PENDING_REVIEW'] });
    const p = await planRerunFailed(work, { apply: false });
    expect(p.shots).toEqual(['S02']);
    expect(p.applied).toBe(false);
    expect(JSON.parse(readFileSync(join(run, 'checkpoint.json'), 'utf8')).shots.S02.status).toBe('SUCCEEDED');
    expect(existsSync(join(run, 'qc', 'rerun-failed.json'))).toBe(true);
  });
  it('apply: marks failed shots for regeneration, archives old QC record (history kept)', async () => {
    const { work, run } = layout({ S01: ['HUMAN_PASS'], S02: ['HUMAN_FAIL', 'x'] });
    const p = await planRerunFailed(work, { apply: true });
    expect(p.applied).toBe(true);
    const cp = JSON.parse(readFileSync(join(run, 'checkpoint.json'), 'utf8'));
    expect(cp.shots.S02).toMatchObject({ status: 'FAILED', error: expect.stringMatching(/HUMAN_FAIL/) });
    expect(cp.shots.S01.status).toBe('SUCCEEDED');
    expect(readdirSync(join(run, 'qc', 'S02', 'history')).length).toBe(1);
  });
  it('nothing failed → empty plan, no changes', async () => {
    const { work } = layout({ S01: ['HUMAN_PASS'], S02: ['PENDING_REVIEW'] });
    expect((await planRerunFailed(work, { apply: true })).shots).toEqual([]);
  });

  const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
  it.skipIf(!hasFfmpeg)('rehearsal: fake run → review fails 1 → apply → rerun regenerates only that shot, new QC PENDING', async () => {
    const work = tmp(); const runDir = join(work, 'run');
    const SHA = 'c'.repeat(64);
    const list = { schemaVersion: 1, episodeId: 'rr', mode: 'live', workDir: runDir, canvas: { width: 160, height: 96, fps: 24 }, durationRange: { minSeconds: 2, maxSeconds: 4 },
      defaultRef: { characterId: 'q', appearanceRevisionId: 'r', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'q.png' },
      shots: [0, 1, 2].map((i) => ({ shotId: `s${i}`, order: i, seed: String(i + 1), positivePrompt: `p${i}` })) };
    writeFileSync(join(work, 'multishot-list.json'), JSON.stringify(list));
    const port = createFakeH3Provider({ outDir: join(runDir, 'takes'), seconds: 1 });
    const deps = { env: { ONECLICK_LIVE: '1' }, live: port, qc: { enabled: true } };
    expect((await runMultiShotOneClick(list, deps)).exitCode).toBe(0);
    const qc = join(runDir, 'qc');
    const s1 = JSON.parse(readFileSync(join(qc, 's1', 'qc-record.json'), 'utf8'));
    expect((await importQcReview(qc, { schemaVersion: 1, reviewer: '演练审核人', reviewedAt: 't', verdicts: [
      { shotId: 's1', verdict: 'HUMAN_FAIL', note: '演练', stillsSha256: s1.stills.map((x: { contentSha256: string }) => x.contentSha256) }] })).ok).toBe(true);
    await planRerunFailed(work, { apply: true });
    port.calls.length = 0;
    const r2 = await runMultiShotOneClick(list, deps);
    expect(r2.exitCode).toBe(0);
    expect(port.calls).toEqual(['rr-s1']);
    expect(JSON.parse(readFileSync(join(qc, 's1', 'qc-record.json'), 'utf8')).identity.status).toBe('PENDING_REVIEW');
  }, 60_000);
});
