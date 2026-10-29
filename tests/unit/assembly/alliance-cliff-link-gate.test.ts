/**
 * V12 Alliance×Cliff Link — 同盟×悬念叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceCliffLink } from '@/agents/assembly/alliance-cliff-link-gate';

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
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const },
  ],
  cliffLinks: [{ id: 'C9-10', prevEp: 9, nextEp: 10, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', allianceId: 'oni-fang', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceCliffLink', () => {
  it('payoff @ nextEp → PASS', () => {
    const r = evaluateAllianceCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_NEXT / PAYOFF_WITHOUT_CLIFF', () => {
    expect(failCodes(evaluateAllianceCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceCliffLink(
          pack({ links: [{ id: 'L1', allianceId: 'oni-fang', cliffLinkId: 'C9-10', ep: 9 }] }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_NEXT');
    expect(failCodes(evaluateAllianceCliffLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_CLIFF');
  });
});
