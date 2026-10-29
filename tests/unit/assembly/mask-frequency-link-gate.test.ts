/**
 * V12 Mask×Frequency Link — 伪装×频率 (invert frequencyMask), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskFrequencyLink } from '@/agents/assembly/mask-frequency-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 99,
    plantEp: 1,
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 10, n: 99, label: '第99次' }],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  links: [{ id: 'L1', maskId: '花心纨绔', frequencyId: '离婚要挟' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskFrequencyLink', () => {
  it('tip = reveal → PASS', () => {
    const r = evaluateMaskFrequencyLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_NOT_AT_REVEAL / TIP_WITHOUT_MASK', () => {
    expect(failCodes(evaluateMaskFrequencyLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskFrequencyLink(
          pack({
            masks: [{
              id: '花心纨绔',
              wearer: '江少',
              plantEp: 1,
              maintainEps: [2, 3],
              revealEp: 9,
              revealLabel: '真心崩塌',
            }],
          }),
        ),
      ),
    ).toContain('TIP_NOT_AT_REVEAL');
    expect(failCodes(evaluateMaskFrequencyLink(pack({ links: [] })))).toContain(
      'TIP_WITHOUT_MASK',
    );
  });
});
