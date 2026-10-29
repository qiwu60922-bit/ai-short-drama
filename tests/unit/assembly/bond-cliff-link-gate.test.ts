/**
 * V12 Bond×Cliff Link — 契约×悬念叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondCliffLink } from '@/agents/assembly/bond-cliff-link-gate';

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
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '江少契约',
    partyA: '江少',
    partyB: '女主',
    contractEp: 1,
    contractLabel: '假面联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  cliffLinks: [{ id: 'C9-10', prevEp: 9, nextEp: 10, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', bondId: '江少契约', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondCliffLink', () => {
  it('upgrade = nextEp → PASS', () => {
    const r = evaluateBondCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERMINAL_NEXT / TERMINAL_WITHOUT_CLIFF', () => {
    expect(failCodes(evaluateBondCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondCliffLink(
          pack({
            links: [{ id: 'L1', bondId: '江少契约', cliffLinkId: 'C9-10', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERMINAL_NEXT');
    expect(failCodes(evaluateBondCliffLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_CLIFF');
  });
});
