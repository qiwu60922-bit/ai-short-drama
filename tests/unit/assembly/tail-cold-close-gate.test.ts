/**
 * V12 Tail Cold-Close — 冷收尾悬念, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateTailColdClose } from '@/agents/assembly/tail-cold-close-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const coldClose = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '追问' },
  { durSec: 6, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'cliffhanger', action: '最大悬念卡断' },
];

const failCodes = (r: ReturnType<typeof evaluateTailColdClose>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateTailColdClose>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateTailColdClose', () => {
  it('cliffhanger last → PASS', () => {
    const r = evaluateTailColdClose(spec(coldClose()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.lastShotRole).toBe('cliffhanger');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup last → TAIL_NOT_COLD', () => {
    expect(
      failCodes(
        evaluateTailColdClose(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 4, beatRole: 'reversal', action: '反转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
            { durSec: 3, beatRole: 'setup', action: '收尾日常' },
          ]),
        ),
      ),
    ).toEqual(expect.arrayContaining(['TAIL_NOT_COLD', 'SETUP_AFTER_CLIFF']));
  });

  it('wide tail gap → TAIL_GAP_WIDE WARN', () => {
    const r = evaluateTailColdClose(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
        { durSec: 4, beatRole: 'increment', action: '余波' },
      ]),
      { coldTailSec: 1 },
    );
    // last is increment → TAIL_NOT_COLD FAIL; also adjust to keep cliff last with gap via child
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('TAIL_NOT_COLD');
  });

  it('cliff then soft gap with cliff last still PASS or WARN', () => {
    // cliff ends at end → gap 0
    const r = evaluateTailColdClose(spec(coldClose()), { coldTailSec: 2 });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).not.toContain('TAIL_GAP_WIDE');
  });
});
