/**
 * V12 Foreshadow×Cliff Link — 伏笔×悬念叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowCliffLink } from '@/agents/assembly/foreshadow-cliff-link-gate';

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
  series: '伪人降临',
  latestEp: 20,
  items: [{
    id: '伪人身份',
    name: '预言家真伪',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 4,
  }],
  cliffLinks: [cliffLink],
  links: [{ id: 'L1', foreshadowId: '伪人身份', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowCliffLink', () => {
  it('payoff @ nextEp → PASS', () => {
    const r = evaluateForeshadowCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_NEXT / PAYOFF_WITHOUT_CLIFF', () => {
    expect(failCodes(evaluateForeshadowCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowCliffLink(
          pack({ links: [{ id: 'L1', foreshadowId: '伪人身份', cliffLinkId: 'C9-10', ep: 9 }] }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_NEXT');
    expect(failCodes(evaluateForeshadowCliffLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_CLIFF');
  });
});
