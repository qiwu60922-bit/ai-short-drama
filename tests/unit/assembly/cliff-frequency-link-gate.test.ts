/**
 * V12 Cliff×Frequency Link — 悬念叠钩×频率 (invert frequencyCliff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffFrequencyLink } from '@/agents/assembly/cliff-frequency-link-gate';

const cliffLink = {
  "id": "C9-10",
  "prevEp": 9,
  "nextEp": 10,
  "prev": {
    "episode": "EP09",
    "shots": [
      {
        "shotId": "EP09-S0",
        "cast": [],
        "durSec": 4,
        "beatRole": "hook",
        "action": "危机开场"
      },
      {
        "shotId": "EP09-S1",
        "cast": [],
        "durSec": 8,
        "beatRole": "increment",
        "action": "追查线索"
      },
      {
        "shotId": "EP09-S2",
        "cast": [],
        "durSec": 8,
        "beatRole": "reversal",
        "action": "身份暴露"
      },
      {
        "shotId": "EP09-S3",
        "cast": [],
        "durSec": 10,
        "beatRole": "cliffhanger",
        "action": "持械闯入皇城大门被围"
      }
    ]
  },
  "next": {
    "episode": "EP10",
    "shots": [
      {
        "shotId": "EP10-S0",
        "cast": [],
        "durSec": 2,
        "beatRole": "hook",
        "action": "皇城门口持械对峙未解"
      },
      {
        "shotId": "EP10-S1",
        "cast": [],
        "durSec": 2,
        "beatRole": "increment",
        "action": "追兵逼近"
      },
      {
        "shotId": "EP10-S2",
        "cast": [],
        "durSec": 10,
        "beatRole": "reversal",
        "action": "旧友现身"
      },
      {
        "shotId": "EP10-S3",
        "cast": [],
        "durSec": 8,
        "beatRole": "cliffhanger",
        "action": "下一场更大危机"
      }
    ]
  }
} as const;

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
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 10, n: 99, label: '第99次' }],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  cliffLinks: [{ ...cliffLink, id: 'C9-10' }],
  links: [{ id: 'L1', frequencyId: '离婚要挟', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffFrequencyLink', () => {
  it('tip @ cliff next → PASS', () => {
    const r = evaluateCliffFrequencyLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_CLIFF_TIP / CLIFF_WITHOUT_FREQUENCY', () => {
    expect(failCodes(evaluateCliffFrequencyLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffFrequencyLink(
          pack({
            links: [{ id: 'L1', frequencyId: '离婚要挟', cliffLinkId: 'C9-10', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_CLIFF_TIP');
    expect(failCodes(evaluateCliffFrequencyLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_FREQUENCY',
    );
  });
});
