/**
 * V12 Handoff×Cliff Link — 承接×叠钩 (invert cliffHandoff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffCliffLink } from '@/agents/assembly/handoff-cliff-link-gate';

const cliffPrev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP08-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP08-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP08-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
  ],
};
const cliffNext = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-S0', cast: [], durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
    { shotId: 'EP09-S1', cast: [], durSec: 2, beatRole: 'increment', action: '追兵逼近' },
    { shotId: 'EP09-S2', cast: [], durSec: 10, beatRole: 'reversal', action: '旧友现身' },
    { shotId: 'EP09-S3', cast: [], durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 20,
  cliffLinks: [{ id: 'C8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', cliffLinkId: 'C8-9', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffCliffLink', () => {
  it('same window → PASS', () => {
    const r = evaluateHandoffCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_WINDOW_MISMATCH / HANDOFF_WITHOUT_PAIR', () => {
    expect(failCodes(evaluateHandoffCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffCliffLink(
          pack({
            handoffs: [{ id: 'H8-9', prevEp: 7, nextEp: 8, prev: cliffPrev, next: cliffNext }],
          }),
        ),
      ),
    ).toContain('EP_WINDOW_MISMATCH');
    expect(failCodes(evaluateHandoffCliffLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_PAIR',
    );
  });
});
