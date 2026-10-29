/**
 * V12 Frequency×Cliff Link — 频率×悬念叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyCliffLink } from '@/agents/assembly/frequency-cliff-link-gate';

const cliffPrev = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP09-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP09-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP09-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
  ],
};
const cliffNext = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', cast: [], durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
    { shotId: 'EP10-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追问' },
    { shotId: 'EP10-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '反转' },
    { shotId: 'EP10-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '悬念' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
  latestEp: 20,
  frequencies: [{
    id: '离婚99次',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count',
    threshold: 99,
    plantEp: 1,
    ticks: [
      { ep: 3, n: 10 },
      { ep: 5, n: 50 },
      { ep: 10, n: 99, label: '第99次' },
    ],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  cliffLinks: [{ id: 'C9-10', prevEp: 9, nextEp: 10, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', frequencyId: '离婚99次', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyCliffLink', () => {
  it('tip = nextEp → PASS', () => {
    const r = evaluateFrequencyCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TIP_NEXT / TIP_WITHOUT_CLIFF', () => {
    expect(failCodes(evaluateFrequencyCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyCliffLink(
          pack({
            links: [{ id: 'L1', frequencyId: '离婚99次', cliffLinkId: 'C9-10', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TIP_NEXT');
    expect(failCodes(evaluateFrequencyCliffLink(pack({ links: [] })))).toContain('TIP_WITHOUT_CLIFF');
  });
});
