/**
 * V12 Handoff×Quality×Peak Ternary — 承接×表演×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffQualityPeakBridge } from '@/agents/assembly/handoff-quality-peak-bridge-gate';

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

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
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
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', handoffId: 'H10-11', peakId: '对峙峰值', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateHandoffQualityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffQualityPeakBridge', () => {
  it('handoff + peak + quality @ep → PASS', () => {
    const r = evaluateHandoffQualityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateHandoffQualityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateHandoffQualityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
