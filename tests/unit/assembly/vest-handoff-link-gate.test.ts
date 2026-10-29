/**
 * V12 Vest×Handoff Link — 马甲×承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestHandoffLink } from '@/agents/assembly/vest-handoff-link-gate';

const prev = {
  "episode": "EP08",
  "shots": [
    { "shotId": "EP08-S0", "durSec": 4, "cast": [], "beatRole": "hook", "action": "开场" },
    { "shotId": "EP08-S1", "durSec": 8, "cast": [], "beatRole": "increment", "action": "对峙" },
    { "shotId": "EP08-S2", "durSec": 8, "cast": [], "beatRole": "reversal", "action": "证据" },
    { "shotId": "EP08-S3", "durSec": 10, "cast": [], "beatRole": "cliffhanger", "action": "门外有人未解" }
  ]
};
const next = {
  "episode": "EP09",
  "shots": [
    { "shotId": "EP09-S0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "承接" },
    { "shotId": "EP09-S1", "durSec": 2, "cast": [], "beatRole": "increment", "action": "加压" },
    { "shotId": "EP09-S2", "durSec": 8, "cast": [], "beatRole": "reversal", "action": "反转" },
    { "shotId": "EP09-S3", "durSec": 8, "cast": [], "beatRole": "cliffhanger", "action": "再悬" }
  ]
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 8,
    dropLabel: '公开机长身份反击',
  }],
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev, next }],
  links: [{ id: 'L1', vestId: '机长马甲', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestHandoffLink', () => {
  it('drop @ handoff.prevEp → PASS', () => {
    const r = evaluateVestHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / HANDOFF_NOT_AT_DROP / DROP_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluateVestHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestHandoffLink(
          pack({
            vests: [{
              id: '机长马甲',
              wearer: '苏见晴',
              vestLabel: '机长',
              plantEp: 1,
              teaseEps: [3, 5],
              dropEp: 7,
              dropLabel: '公开机长身份反击',
            }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_DROP');
    expect(failCodes(evaluateVestHandoffLink(pack({ links: [] })))).toContain(
      'DROP_WITHOUT_HANDOFF',
    );
  });
});
