/**
 * V12 Cliff×Quality×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffQualityPeakBridge } from '@/agents/assembly/cliff-quality-peak-bridge-gate';

const qualityLeap = {
  style: 'live_action',
  shots: [{
    id: 'S01', scriptBeat: '对峙兑现。', durationSec: 4,
    dramaPurpose: '揭穿可见表演', characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
} as const;
const prev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-B139-0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP08-B139-1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP08-B139-2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP08-B139-3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入被围' },
  ],
};
const next = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-B139-0', cast: [], durSec: 2, beatRole: 'hook', action: '被围承接' },
    { shotId: 'EP09-B139-1', cast: [], durSec: 2, beatRole: 'increment', action: '追问' },
    { shotId: 'EP09-B139-2', cast: [], durSec: 10, beatRole: 'reversal', action: '新证' },
    { shotId: 'EP09-B139-3', cast: [], durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 20,
  cliffLinks: [{ id: 'C8-9', prevEp: 8, nextEp: 9, prev, next }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '持械对峙', payoffEp: 8 }],
  links: [{ id: 'L1', cliffLinkId: 'C8-9', peakId: '对峙峰值', ep: 8, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCliffQualityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffQualityPeakBridge', () => {
  it('cliff + peak + quality → PASS', () => {
    const r = evaluateCliffQualityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCliffQualityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCliffQualityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
