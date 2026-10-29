/**
 * V12 Handoff×Bond Link — 承接×契约 (invert bondHandoff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffBondLink } from '@/agents/assembly/handoff-bond-link-gate';

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
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '机长契约',
    partyA: '苏见晴',
    partyB: '傅司宴',
    contractEp: 1,
    contractLabel: '契约联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 8,
    upgradeLabel: '真心升级',
  }],
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', bondId: '机长契约', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffBondLink', () => {
  it('handoff @ terminal → PASS', () => {
    const r = evaluateHandoffBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / HANDOFF_NOT_AT_TERMINAL / HANDOFF_WITHOUT_BOND', () => {
    expect(failCodes(evaluateHandoffBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffBondLink(
          pack({
            handoffs: [{ id: 'H8-9', prevEp: 7, nextEp: 8, prev: cliffPrev, next: cliffNext }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_TERMINAL');
    expect(failCodes(evaluateHandoffBondLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_BOND',
    );
  });
});
