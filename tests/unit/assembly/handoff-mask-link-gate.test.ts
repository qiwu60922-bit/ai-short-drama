/**
 * V12 Handoff×Mask Link — 承接×伪装 (invert maskHandoff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffMaskLink } from '@/agents/assembly/handoff-mask-link-gate';

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
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', maskId: '花心纨绔', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffMaskLink', () => {
  it('handoff @ reveal → PASS', () => {
    const r = evaluateHandoffMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / HANDOFF_NOT_AT_REVEAL / HANDOFF_WITHOUT_MASK', () => {
    expect(failCodes(evaluateHandoffMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffMaskLink(
          pack({
            handoffs: [{ id: 'H8-9', prevEp: 7, nextEp: 8, prev: cliffPrev, next: cliffNext }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_REVEAL');
    expect(failCodes(evaluateHandoffMaskLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_MASK',
    );
  });
});
