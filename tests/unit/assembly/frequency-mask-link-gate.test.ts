/**
 * V12 Frequency×Mask Link — 第N次 tipping × 伪装揭穿, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyMaskLink } from '@/agents/assembly/frequency-mask-link-gate';

const freq = {
  id: '离婚要挟',
  actor: '丈夫',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 99,
  plantEp: 1,
  ticks: [
    { ep: 3, n: 10 },
    { ep: 10, n: 50 },
    { ep: 20, n: 99, label: '第99次' },
  ],
  tipEp: 20,
  tipLabel: '接受第99次离婚彻底离开',
};

const mask = {
  id: '完美人设',
  wearer: '丈夫',
  plantEp: 1,
  maintainEps: [5, 12],
  revealEp: 20,
  revealLabel: '假人设崩塌',
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
  latestEp: 51,
  frequencies: [freq],
  masks: [mask],
  links: [{ id: 'L1', frequencyId: '离婚要挟', maskId: '完美人设' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateFrequencyMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateFrequencyMaskLink', () => {
  it('tip at reveal → PASS', () => {
    const r = evaluateFrequencyMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / not aligned', () => {
    expect(failCodes(evaluateFrequencyMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyMaskLink(
          pack({
            links: [
              { id: 'd', frequencyId: '离婚要挟', maskId: '完美人设' },
              { id: 'd', frequencyId: '离婚要挟', maskId: '完美人设' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateFrequencyMaskLink(
          pack({
            masks: [{ ...mask, revealEp: 18, revealLabel: '提前崩塌' }],
          }),
        ),
      ),
    ).toContain('TIP_NOT_AT_REVEAL');
  });

  it('reveal without link → REVEAL_WITHOUT_FREQUENCY', () => {
    expect(failCodes(evaluateFrequencyMaskLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_FREQUENCY',
    );
  });

  it('orphan frequency → PENDING_FREQUENCY WARN', () => {
    const r = evaluateFrequencyMaskLink(
      pack({
        frequencies: [
          freq,
          {
            id: '旁路次数',
            actor: 'X',
            motif: '旁路',
            unit: 'count' as const,
            threshold: 3,
            plantEp: 1,
            ticks: [{ ep: 2, n: 3 }],
            tipEp: 2,
            tipLabel: '旁路 tip',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_FREQUENCY');
    expect(r.verdict).toBe('PASS');
  });
});
