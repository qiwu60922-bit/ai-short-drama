/**
 * V12 Vest×Handoff×Peak Ternary — 马甲×承接×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestHandoffPeakBridge } from '@/agents/assembly/vest-handoff-peak-bridge-gate';

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
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开身份对峙', payoffEp: 9 }],
  links: [{ id: 'L1', vestId: '机长马甲', handoffId: 'H8-9', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestHandoffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestHandoffPeakBridge', () => {
  it('drop + handoff + peak @ep → PASS', () => {
    const r = evaluateVestHandoffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateVestHandoffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestHandoffPeakBridge(
          pack({
            links: [{ id: 'L1', vestId: '机长马甲', handoffId: 'H8-9', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateVestHandoffPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
