/**
 * V12 Hook Structure Gate — per-episode 钩子·增量·悬念 three-point check, offline, pre-generation. ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from public breakdowns of 红果 hits 2026-10-13:
 * 《万妖图录传》(开头3秒抛冲突 / 中段反转或信息增量 / 结尾卡最大悬念), 《聚宝仙盆》(废柴反转 + 季末悬念承接),
 * 《不候，过期离婚》(第一场即危机: 离婚当天车祸失忆).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateHookStructure, BEAT_ROLES } from '@/agents/assembly/hook-structure-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({ episode: 'T', shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })) });
// 60s reference episode: hook at 0s, reversal at ~30s, cliffhanger last.
const good = (): S[] => [
  { durSec: 2, beatRole: 'hook' },
  { durSec: 4, beatRole: 'setup' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'setup' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'reversal' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'cliffhanger' },
];
const failCodes = (r: ReturnType<typeof evaluateHookStructure>) => r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHookStructure', () => {
  it('exposes the role vocabulary', () => {
    expect(BEAT_ROLES).toEqual(['hook', 'increment', 'reversal', 'cliffhanger', 'setup', 'reaction']);
  });

  it('hook ≤3s + mid reversal + cliffhanger ending → PASS with metrics, gates untouched', () => {
    const r = evaluateHookStructure(spec(good()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ totalSeconds: 60, firstHookAtSec: 0, turnAtSec: 24, cliffhangerEndsAtSec: 60, untaggedShots: 0, setupSeconds: 10 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('slow open (first conflict at 10s, 万妖 anti-pattern) → HOOK_LATE FAIL', () => {
    const shots = good();
    shots[0] = { durSec: 10, beatRole: 'setup' };
    shots[1] = { durSec: 4, beatRole: 'hook' };
    shots[10] = { durSec: 2, beatRole: 'cliffhanger' };
    const r = evaluateHookStructure(spec(shots));
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('HOOK_LATE');
    expect(r.metrics.firstHookAtSec).toBe(10);
  });

  it('no hook at all → HOOK_LATE FAIL with null metric', () => {
    const shots = good().map((s) => (s.beatRole === 'hook' ? { ...s, beatRole: 'setup' } : s));
    const r = evaluateHookStructure(spec(shots));
    expect(failCodes(r)).toContain('HOOK_LATE');
    expect(r.metrics.firstHookAtSec).toBeNull();
  });

  it('long first shot is a WARN (opening cut too slow), not a FAIL', () => {
    const shots = good();
    shots[0] = { durSec: 5, beatRole: 'hook' };
    shots[1] = { durSec: 1, beatRole: 'setup' };
    const r = evaluateHookStructure(spec(shots));
    expect(r.verdict).toBe('PASS');
    expect(r.findings.find((f) => f.code === 'FIRST_SHOT_LONG')).toMatchObject({ severity: 'WARN', shotIds: ['S0'] });
  });

  it('no reversal/increment in the middle 25–75% window → TURN_MISSING FAIL', () => {
    const shots = good().map((s) => (s.beatRole === 'reversal' || s.beatRole === 'increment' ? { ...s, beatRole: 'setup' } : s));
    const r = evaluateHookStructure(spec(shots));
    expect(failCodes(r)).toContain('TURN_MISSING');
    expect(r.metrics.turnAtSec).toBeNull();
  });

  it('episode ending on a calm shot → CLIFFHANGER_MISSING FAIL', () => {
    const shots = good();
    shots[10] = { durSec: 6, beatRole: 'setup' };
    expect(failCodes(evaluateHookStructure(spec(shots)))).toContain('CLIFFHANGER_MISSING');
  });

  it('a ≤3s title card after the cliffhanger is tolerated (EP01 S14 黑场标题 pattern)', () => {
    const shots = [...good().slice(0, 10), { durSec: 3, beatRole: 'cliffhanger' }, { durSec: 3, beatRole: 'setup' }];
    expect(evaluateHookStructure(spec(shots)).verdict).toBe('PASS');
    const tooLong = [...good().slice(0, 10), { durSec: 3, beatRole: 'cliffhanger' }, { durSec: 4, beatRole: 'setup' }];
    expect(failCodes(evaluateHookStructure(spec(tooLong)))).toContain('CLIFFHANGER_MISSING');
  });

  it('untagged shots WARN by default (归不进三类的镜头该删), FAIL when requireAllTagged', () => {
    const shots = good();
    delete shots[3].beatRole;
    const r = evaluateHookStructure(spec(shots));
    expect(r.verdict).toBe('PASS');
    expect(r.findings.find((f) => f.code === 'UNTAGGED_SHOT')).toMatchObject({ severity: 'WARN', shotIds: ['S3'] });
    expect(evaluateHookStructure(spec(shots), { requireAllTagged: true }).verdict).toBe('FAIL');
  });

  it('unknown beatRole (typo) → INVALID_ROLE FAIL', () => {
    const shots = good();
    shots[4].beatRole = 'twist';
    const r = evaluateHookStructure(spec(shots));
    expect(r.findings.find((f) => f.code === 'INVALID_ROLE')).toMatchObject({ severity: 'FAIL', shotIds: ['S4'] });
  });

  it('setup over half the runtime → SETUP_HEAVY WARN', () => {
    const shots: S[] = [{ durSec: 2, beatRole: 'hook' }, { durSec: 20, beatRole: 'setup' }, { durSec: 6, beatRole: 'reversal' }, { durSec: 14, beatRole: 'setup' }, { durSec: 4, beatRole: 'cliffhanger' }];
    const r = evaluateHookStructure(spec(shots));
    expect(r.findings.find((f) => f.code === 'SETUP_HEAVY')?.severity).toBe('WARN');
  });

  it('thresholds configurable', () => {
    const shots = good();
    shots[0] = { durSec: 2, beatRole: 'setup' };
    shots[1] = { durSec: 4, beatRole: 'hook' };
    expect(evaluateHookStructure(spec(shots)).verdict).toBe('PASS'); // hook starts at 2s < 3s
    expect(failCodes(evaluateHookStructure(spec(shots), { hookWindowSec: 1.5 }))).toContain('HOOK_LATE');
  });

  it('untagged EP01 fixture fails loudly instead of passing silently', () => {
    const ep01 = JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01/SHOT_SPEC.json'), 'utf8'));
    const r = evaluateHookStructure(ep01);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toEqual(expect.arrayContaining(['HOOK_LATE', 'TURN_MISSING', 'CLIFFHANGER_MISSING']));
    expect(r.metrics.untaggedShots).toBe(16);
  });

  it('bad input → FAIL with SCHEMA finding', () => {
    expect(evaluateHookStructure({ shots: [] }).findings[0].code).toBe('SCHEMA');
  });
});
