/**
 * V12 Ensemble×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleRhythmPeakBridge } from '@/agents/assembly/ensemble-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  members: [
    { id: '太奶奶-b153', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '穿越太奶奶温情重整-b153', lookTag: '十八岁少女皮囊-b153', voiceTag: '科学院大佬口吻-b153', spotlightEps: [10] },
    { id: '七十岁儿子-b153', name: '顾成', roleSlot: 'heir', functionTag: '老年儿子赡养线-b153', lookTag: '花甲老人-b153', voiceTag: '无奈絮叨-b153', spotlightEps: [5] },
    { id: '老三-b153', name: '顾老三', roleSlot: 'grandchild', functionTag: '创伤后失智恢复单元-b153', lookTag: '痴呆傻笑-b153', voiceTag: '童声残留-b153', spotlightEps: [10] },
  ],
  units: [{ id: '听证重整-b153', ep: 10, leadIds: ['太奶奶-b153'], supportIds: ['七十岁儿子-b153', '老三-b153'], warmth: false }],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', unitId: '听证重整-b153', rhythmId: 'EP10-rhythm', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleRhythmPeakBridge', () => {
  it('ensemble + rhythm + peak → PASS', () => {
    const r = evaluateEnsembleRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateEnsembleRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
