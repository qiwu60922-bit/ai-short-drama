/**
 * V12 Handoff×Foreshadow Link — 承接×伏笔联表, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffForeshadowLink } from '@/agents/assembly/handoff-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 20,
  handoffs: [{
    id: 'H10-11',
    prevEp: 10,
    nextEp: 11,
    prev: {
      episode: 'EP10',
      shots: [
        { shotId: 'EP10-AH0', durSec: 4, cast: [], beatRole: 'hook', action: '唤回开场' },
        { shotId: 'EP10-AH1', durSec: 8, cast: [], beatRole: 'increment', action: '对视蓄势' },
        { shotId: 'EP10-AH2', durSec: 8, cast: [], beatRole: 'reversal', action: '记忆闪回' },
        { shotId: 'EP10-AH3', durSec: 10, cast: [], beatRole: 'cliffhanger', action: '门外脚步未解' },
      ],
    },
    next: {
      episode: 'EP11',
      shots: [
        { shotId: 'EP11-AH0', durSec: 2, cast: [], beatRole: 'hook', action: '门外脚步未解' },
        { shotId: 'EP11-AH1', durSec: 6, cast: [], beatRole: 'increment', action: '追问来人' },
        { shotId: 'EP11-AH2', durSec: 5, cast: [], beatRole: 'reversal', action: '身份揭开' },
        { shotId: 'EP11-AH3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '新悬念' },
      ],
    },
  }],
  items: [{ id: '伪人身份', name: '预言家真伪', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', handoffId: 'H10-11', foreshadowId: '伪人身份', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateHandoffForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffForeshadowLink', () => {
  it('handoff.prevEp + foreshadow payoff @ep → PASS', () => {
    const r = evaluateHandoffForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluateHandoffForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateHandoffForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_HANDOFF');
  });
});
