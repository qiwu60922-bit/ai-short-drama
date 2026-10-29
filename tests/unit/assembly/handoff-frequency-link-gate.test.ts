/**
 * V12 Handoff×Frequency Link — 承接×频率 (invert frequencyHandoff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffFrequencyLink } from '@/agents/assembly/handoff-frequency-link-gate';

const cliffPrev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-H0', cast: [], durSec: 4, beatRole: 'hook', action: '开场' },
    { shotId: 'EP08-H1', cast: [], durSec: 8, beatRole: 'increment', action: '追问' },
    { shotId: 'EP08-H2', cast: [], durSec: 8, beatRole: 'reversal', action: '反转' },
    { shotId: 'EP08-H3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '悬念' },
  ],
};
const cliffNext = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-H0', cast: [], durSec: 3, beatRole: 'hook', action: '承接' },
    { shotId: 'EP09-H1', cast: [], durSec: 8, beatRole: 'increment', action: '加压' },
    { shotId: 'EP09-H2', cast: [], durSec: 8, beatRole: 'reversal', action: '反转' },
    { shotId: 'EP09-H3', cast: [], durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
  latestEp: 20,
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 99,
    plantEp: 1,
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 8, n: 99, label: '第99次' }],
    tipEp: 8,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', frequencyId: '离婚要挟', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffFrequencyLink', () => {
  it('handoff @ tip → PASS', () => {
    const r = evaluateHandoffFrequencyLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / HANDOFF_NOT_AT_TIP / FREQUENCY_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluateHandoffFrequencyLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffFrequencyLink(
          pack({
            handoffs: [{ id: 'H8-9', prevEp: 7, nextEp: 8, prev: cliffPrev, next: cliffNext }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_TIP');
    expect(failCodes(evaluateHandoffFrequencyLink(pack({ links: [] })))).toContain(
      'FREQUENCY_WITHOUT_HANDOFF',
    );
  });
});
