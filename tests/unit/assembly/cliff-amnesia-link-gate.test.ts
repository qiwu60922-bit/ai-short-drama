/**
 * V12 Cliff×Amnesia Link — cliff主键×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffAmnesiaLink } from '@/agents/assembly/cliff-amnesia-link-gate';

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
  cliffLinks: [{ id: 'C9-10', prevEp: 9, nextEp: 10, prev: cliffPrev, next: cliffNext }],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  links: [{ id: 'L1', cliffLinkId: 'C9-10', amnesiaId: '祁南失忆', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffAmnesiaLink', () => {
  it('nextEp = recover → PASS', () => {
    const r = evaluateCliffAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / CLIFF_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateCliffAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCliffAmnesiaLink(pack({ links: [] })))).toContain('CLIFF_WITHOUT_AMNESIA');
  });
});
