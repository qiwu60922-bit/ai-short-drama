/**
 * V12 Cold-Open Hook — 冷开场钩子, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenHook } from '@/agents/assembly/cold-open-hook-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const coldGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '离婚当天车祸', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '失忆醒来' },
  { durSec: 6, beatRole: 'reversal', action: '发现戒指还在' },
  { durSec: 6, beatRole: 'increment', action: '追查真相' },
  { durSec: 6, beatRole: 'cliffhanger', action: '门外有人' },
];

const failCodes = (r: ReturnType<typeof evaluateColdOpenHook>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateColdOpenHook>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateColdOpenHook', () => {
  it('crisis first → PASS', () => {
    const r = evaluateColdOpenHook(spec(coldGood()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.firstShotRole).toBe('hook');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup before hook → SETUP_BEFORE_HOOK', () => {
    const r = evaluateColdOpenHook(
      spec([
        { durSec: 2, beatRole: 'setup', action: '日常铺垫' },
        { durSec: 2, beatRole: 'hook', action: '危机' },
        { durSec: 6, beatRole: 'reversal', action: '反转' },
        { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['SETUP_BEFORE_HOOK']));
  });

  it('late hook → COLD_OPEN_LATE', () => {
    const r = evaluateColdOpenHook(
      spec([
        { durSec: 3, beatRole: 'increment', action: '慢热' },
        { durSec: 2, beatRole: 'hook', action: '迟来的钩' },
        { durSec: 6, beatRole: 'reversal', action: '反转' },
        { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { coldOpenWindowSec: 2 },
    );
    expect(failCodes(r)).toContain('COLD_OPEN_LATE');
  });

  it('first not hook → FIRST_NOT_HOOK WARN (if still early hook)', () => {
    const r = evaluateColdOpenHook(
      spec([
        { durSec: 1, beatRole: 'increment', action: '快切' },
        { durSec: 1, beatRole: 'hook', action: '危机' },
        { durSec: 6, beatRole: 'reversal', action: '反转' },
        { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(warnCodes(r)).toContain('FIRST_NOT_HOOK');
  });
});
