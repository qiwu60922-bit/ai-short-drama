/** V12 Auto Edit Worker (port of cloud-h3-live/scripts/auto_edit.py) — trim+concat, dry-run default, offline. */
import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beatWindow, validateEditPlan, runAutoEdit, editPlanFromTakes, AUTO_EDIT_EXIT } from '@/agents/assembly/auto-edit-worker';

const tmp = () => mkdtempSync(join(tmpdir(), 'ae-'));
const plan = (dir: string, over: Record<string, unknown> = {}) => ({
  schema: 'v12/BeatPlan/v1', planId: 'p1', policy: { zeroPost: true }, targetDurationSec: { min: 3, max: 9 },
  beats: [
    { beatId: 'b01', order: 1, sourceShotId: 'S01', sourcePath: join(dir, 'a.mp4'), inSec: 1, outSec: 3 },
    { beatId: 'b02', order: 0, sourceShotId: 'S02', sourcePath: join(dir, 'b.mp4'), ss: 0.5, dur: 1.5 },
  ],
  ...over,
});
const fake = (dir: string) => { writeFileSync(join(dir, 'a.mp4'), 'x'); writeFileSync(join(dir, 'b.mp4'), 'x'); };

describe('beatWindow', () => {
  it('supports inSec+outSec, ss+dur, inSec+dur; rejects bad windows', () => {
    expect(beatWindow({ inSec: 1, outSec: 3 })).toEqual({ ss: 1, dur: 2 });
    expect(beatWindow({ ss: 0.5, dur: 1.5 })).toEqual({ ss: 0.5, dur: 1.5 });
    expect(beatWindow({ inSec: 2, dur: 1 })).toEqual({ ss: 2, dur: 1 });
    expect(() => beatWindow({ inSec: 3, outSec: 1 })).toThrow(/outSec/);
    expect(() => beatWindow({ ss: -1, dur: 1 })).toThrow();
    expect(() => beatWindow({})).toThrow();
  });
});

describe('validateEditPlan', () => {
  it('valid plan → no errors; planned duration and order', () => {
    const d = tmp(); fake(d);
    const v = validateEditPlan(plan(d));
    expect(v.errors).toEqual([]);
    expect(v.plannedSeconds).toBe(3.5);
    expect(v.beats.map((b) => b.beatId)).toEqual(['b02', 'b01']);
  });
  it('flags schema, zeroPost, duplicate ids/orders, missing source', () => {
    const d = tmp();
    const p = plan(d, { schema: 'x', policy: { zeroPost: false } });
    (p.beats as any[])[1].beatId = 'b01'; (p.beats as any[])[1].order = 1;
    const e = validateEditPlan(p).errors.join('\n');
    for (const s of ['schema', 'zeroPost', 'duplicate beatId', 'duplicate order', 'missing source']) expect(e).toContain(s);
  });
});

describe('runAutoEdit', () => {
  it('dry-run default: no ffmpeg, report table', async () => {
    const d = tmp(); fake(d); const runFfmpeg = vi.fn();
    const r = await runAutoEdit(plan(d), { outPath: join(d, 'o.mp4'), workDir: d, runFfmpeg });
    expect(r.exitCode).toBe(0); expect(r.mode).toBe('dry-run');
    expect(runFfmpeg).not.toHaveBeenCalled();
    expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });
  it('invalid plan → 2; protected output → 4; target range miss → WARN', async () => {
    const d = tmp();
    expect((await runAutoEdit(plan(d), { outPath: join(d, 'o.mp4'), workDir: d })).exitCode).toBe(AUTO_EDIT_EXIT.INVALID);
    fake(d);
    const prot = plan(d, { policy: { zeroPost: true, protectedOutputs: [join(d, 'sot.mp4')] } });
    expect((await runAutoEdit(prot, { outPath: join(d, 'sot.mp4'), workDir: d, render: true, runFfmpeg: vi.fn() })).exitCode).toBe(AUTO_EDIT_EXIT.PROTECTED);
    const r = await runAutoEdit(plan(d, { targetDurationSec: { min: 10, max: 20 } }), { outPath: join(d, 'o.mp4'), workDir: d });
    expect(r.warnings.join()).toMatch(/target/);
  });
  it('render with fake ffmpeg: trims each beat in order then concat; ffmpeg failure → 70', async () => {
    const d = tmp(); fake(d);
    const calls: string[][] = [];
    const runFfmpeg = vi.fn(async (args: string[]) => { calls.push(args); writeFileSync(args[args.length - 1], 'v'); return { code: 0, stderr: '' }; });
    const r = await runAutoEdit(plan(d), { outPath: join(d, 'o.mp4'), workDir: d, render: true, runFfmpeg, probeDuration: async () => 3.5 });
    expect(r.exitCode).toBe(0);
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual(expect.arrayContaining(['-ss', '0.5', '-t', '1.5']));
    expect(calls[2]).toEqual(expect.arrayContaining(['-f', 'concat']));
    expect(existsSync(r.receiptPath!)).toBe(true);
    const bad = await runAutoEdit(plan(d), { outPath: join(d, 'o2.mp4'), workDir: d, render: true, runFfmpeg: async () => ({ code: 1, stderr: 'boom' }) });
    expect(bad.exitCode).toBe(AUTO_EDIT_EXIT.FFMPEG_FAILED);
  });
});

describe('editPlanFromTakes', () => {
  it('window mode: centred climax window per take, capped to take length', () => {
    const p = editPlanFromTakes([{ shotId: 'S01', path: '/t/1.mp4', durationSeconds: 6 }, { shotId: 'S02', path: '/t/2.mp4', durationSeconds: 1.5 }], { planId: 'x', windowSeconds: 2 });
    expect(p.beats[0]).toMatchObject({ beatId: 'b01', order: 0, sourceShotId: 'S01', ss: 2, dur: 2 });
    expect(p.beats[1]).toMatchObject({ ss: 0, dur: 1.5 });
    expect(p.policy.zeroPost).toBe(true);
  });
  it('explicit trimHint per shot wins; full mode keeps whole take', () => {
    const p = editPlanFromTakes([{ shotId: 'S01', path: '/a', durationSeconds: 6 }], { planId: 'x', windowSeconds: 2, trimHints: { S01: { ss: 1.5, dur: 2 } } });
    expect(p.beats[0]).toMatchObject({ ss: 1.5, dur: 2 });
    expect(editPlanFromTakes([{ shotId: 'S01', path: '/a', durationSeconds: 6 }], { planId: 'x' }).beats[0]).toMatchObject({ ss: 0, dur: 6 });
  });
});

const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
describe('real ffmpeg', () => {
  it.skipIf(!hasFfmpeg)('two 3s testsrc clips → 2×1s windows → ~2s output', async () => {
    const d = tmp();
    for (const n of ['a', 'b']) execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=160x96:rate=24:duration=3', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest', '-c:v', 'libx264', '-c:a', 'aac', join(d, `${n}.mp4`)]);
    const p = editPlanFromTakes([{ shotId: 'A', path: join(d, 'a.mp4'), durationSeconds: 3 }, { shotId: 'B', path: join(d, 'b.mp4'), durationSeconds: 3 }], { planId: 'r', windowSeconds: 1 });
    const r = await runAutoEdit(p, { outPath: join(d, 'out.mp4'), workDir: join(d, 'w'), render: true });
    expect(r.exitCode).toBe(0);
    expect(r.durationSeconds).toBeGreaterThan(1.8);
    expect(r.durationSeconds).toBeLessThan(2.3);
    expect(readFileSync(r.receiptPath!, 'utf8')).toContain('AUTO_EDIT_RECEIPT');
  }, 60_000);
});
