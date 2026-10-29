/**
 * V12 Mask×Cliff Link — 伪装×叠钩 (invert cliffMask), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskCliffLink } from '@/agents/assembly/mask-cliff-link-gate';

const prev = {
  "episode": "EP08",
  "shots": [
    { "shotId": "EP08-S0", "durSec": 4, "cast": [], "beatRole": "hook", "action": "危机开场" },
    { "shotId": "EP08-S1", "durSec": 8, "cast": [], "beatRole": "increment", "action": "追查线索" },
    { "shotId": "EP08-S2", "durSec": 8, "cast": [], "beatRole": "reversal", "action": "身份暴露" },
    { "shotId": "EP08-S3", "durSec": 10, "cast": [], "beatRole": "cliffhanger", "action": "持械闯入被围" }
  ]
};
const next = {
  "episode": "EP09",
  "shots": [
    { "shotId": "EP09-S0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "被围承接" },
    { "shotId": "EP09-S1", "durSec": 2, "cast": [], "beatRole": "increment", "action": "追问" },
    { "shotId": "EP09-S2", "durSec": 10, "cast": [], "beatRole": "reversal", "action": "新证" },
    { "shotId": "EP09-S3", "durSec": 8, "cast": [], "beatRole": "cliffhanger", "action": "更大危机" }
  ]
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  cliffLinks: [{ id: 'C8-9', prevEp: 8, nextEp: 9, prev, next }],
  links: [{ id: 'L1', maskId: '花心纨绔', cliffLinkId: 'C8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskCliffLink', () => {
  it('reveal @ cliff.prevEp → PASS', () => {
    const r = evaluateMaskCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / REVEAL_NOT_AT_CLIFF / REVEAL_WITHOUT_CLIFF', () => {
    expect(failCodes(evaluateMaskCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskCliffLink(
          pack({
            masks: [{
              id: '花心纨绔',
              wearer: '江少',
              plantEp: 1,
              maintainEps: [2, 3],
              revealEp: 7,
              revealLabel: '真心崩塌',
            }],
          }),
        ),
      ),
    ).toContain('REVEAL_NOT_AT_CLIFF');
    expect(failCodes(evaluateMaskCliffLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_CLIFF',
    );
  });
});
