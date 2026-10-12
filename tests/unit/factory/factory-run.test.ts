/** V14 · factory orchestration: persistent task queue, HUMAN_GO gate on paid steps, never PASS. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { FACTORY_STEPS, runFactory, loadQueue, FACTORY_EXIT, fakeHandlers, readHumanGo } from '@/agents/factory/factory-run';
const tmp = () => mkdtempSync(join(tmpdir(), 'fac-'));
const cfg = (w: string, over = {}) => ({ episodeId: 'ep01', workDir: w, providers: { h3: 'fake', dub: 'fake' }, ...over });
describe('factory queue', () => {
  it('step order is script→pack_lock→h3→dub→sub→stitch→qc', () =>
    expect(FACTORY_STEPS.map(s => s.id)).toEqual(['script', 'pack_lock', 'h3', 'dub', 'sub', 'stitch', 'qc']));
  it('all-fake run completes; final status DONE_AWAITING_HUMAN_REVIEW (never PASS); queue persisted', async () => {
    const w = tmp(); const r = await runFactory(cfg(w), fakeHandlers());
    expect(r.exitCode).toBe(FACTORY_EXIT.OK); expect(r.status).toBe('DONE_AWAITING_HUMAN_REVIEW');
    const q = loadQueue(w); expect(q.tasks.every(t => t.status === 'DONE')).toBe(true);
    expect(q.tasks.find(t => t.step === 'qc')!.output.g3).toBe('NOT_EVALUATED');
    expect(JSON.stringify(q)).not.toMatch(/"PASS"|"g3":\s*true/);
  });
  it('pack_lock refuses unless pack is HUMAN_LOCK', async () => {
    const w = tmp(); const h = fakeHandlers({ packStatus: 'LOCK_CANDIDATE' });
    const r = await runFactory(cfg(w), h);
    expect(r.exitCode).toBe(FACTORY_EXIT.STEP_FAILED); expect(r.stoppedAt).toBe('pack_lock');
  });
  it('real (paid) provider without HUMAN_GO → stops at that step, AWAITING_HUMAN_GO, nothing paid ran', async () => {
    const w = tmp(); const h = fakeHandlers(); let paidCalls = 0; const orig = h.h3; h.h3 = async (c) => { paidCalls++; return orig(c); };
    const r = await runFactory(cfg(w, { providers: { h3: 'real', dub: 'fake' } }), h);
    expect(r.exitCode).toBe(FACTORY_EXIT.AWAITING_HUMAN_GO); expect(r.stoppedAt).toBe('h3'); expect(paidCalls).toBe(0);
    expect(loadQueue(w).tasks.find(t => t.step === 'h3')!.status).toBe('BLOCKED_HUMAN_GO');
    expect(loadQueue(w).tasks.find(t => t.step === 'pack_lock')!.status).toBe('DONE');
  });
  it('HUMAN_GO must be named human, matching episode+step, within budget; bot/expired/over-budget rejected', async () => {
    const w = tmp(); const go = (o: object) => writeFileSync(join(w, 'HUMAN_GO.json'), JSON.stringify({ schema: 'v14/HumanGo/v1', episodeId: 'ep01', steps: ['h3'], approver: '吴琦', approvedAt: '2026-10-12T15:00:00+08:00', expiresAt: '2099-01-01T00:00:00Z', maxCostUsd: 5, ...o }));
    go({ approver: 'grok' }); expect(readHumanGo(w, 'ep01', 'h3', 1).ok).toBe(false);
    go({ expiresAt: '2000-01-01T00:00:00Z' }); expect(readHumanGo(w, 'ep01', 'h3', 1).ok).toBe(false);
    go({ steps: ['dub'] }); expect(readHumanGo(w, 'ep01', 'h3', 1).ok).toBe(false);
    go({}); expect(readHumanGo(w, 'ep01', 'h3', 9).ok).toBe(false);
    expect(readHumanGo(w, 'ep01', 'h3', 1).ok).toBe(true);
  });
  it('with valid HUMAN_GO the paid step runs and is recorded with approver', async () => {
    const w = tmp(); writeFileSync(join(w, 'HUMAN_GO.json'), JSON.stringify({ schema: 'v14/HumanGo/v1', episodeId: 'ep01', steps: ['h3'], approver: '吴琦', approvedAt: 'x', expiresAt: '2099-01-01T00:00:00Z', maxCostUsd: 5 }));
    const r = await runFactory(cfg(w, { providers: { h3: 'real', dub: 'fake' }, estimatedCostUsd: { h3: 2 } }), fakeHandlers());
    expect(r.exitCode).toBe(0); expect(loadQueue(w).tasks.find(t => t.step === 'h3')!.humanGo?.approver).toBe('吴琦');
  });
  it('resume: failure mid-way, rerun skips DONE steps and retries failed', async () => {
    const w = tmp(); const calls: string[] = []; let failSub = true;
    const h = fakeHandlers(); for (const k of Object.keys(h) as (keyof typeof h)[]) { const f = h[k]; h[k] = async (c: any) => { calls.push(k); if (k === 'sub' && failSub) throw new Error('srt boom'); return f(c); }; }
    const r1 = await runFactory(cfg(w), h); expect(r1.exitCode).toBe(FACTORY_EXIT.STEP_FAILED); expect(r1.stoppedAt).toBe('sub');
    failSub = false; calls.length = 0;
    const r2 = await runFactory(cfg(w), h); expect(r2.exitCode).toBe(0); expect(calls).toEqual(['sub', 'stitch', 'qc']);
    expect(loadQueue(w).tasks.find(t => t.step === 'sub')!.attempts).toBe(2);
  });
  it('a handler claiming PASS/g3 is rejected as STEP_FAILED', async () => {
    const w = tmp(); const h = fakeHandlers(); h.qc = async () => ({ g3: 'PASS' } as any);
    const r = await runFactory(cfg(w), h); expect(r.stoppedAt).toBe('qc'); expect(r.exitCode).toBe(FACTORY_EXIT.STEP_FAILED);
  });
  it('fake handlers write real artifacts on disk', async () => {
    const w = tmp(); await runFactory(cfg(w), fakeHandlers());
    for (const f of ['script/SCRIPT.json', 'dub/DUB_MANIFEST.json', 'sub/ep01.srt', 'stitch/STITCH_MANIFEST.json', 'qc/QC_SUMMARY.json']) expect(existsSync(join(w, f))).toBe(true);
    expect(readFileSync(join(w, 'sub/ep01.srt'), 'utf8')).toMatch(/-->/);
  });
});
