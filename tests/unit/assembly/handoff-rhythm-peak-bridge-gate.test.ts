/**
 * V12 Handoff×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffRhythmPeakBridge } from '@/agents/assembly/handoff-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B155-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B155-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B155-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B155-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};
const prev = {"episode": "EP10", "shots": [{"shotId": "EP10-B155-0", "durSec": 4, "cast": [], "beatRole": "hook", "action": "唤回开场"}, {"shotId": "EP10-B155-1", "durSec": 8, "cast": [], "beatRole": "increment", "action": "对视蓄势"}, {"shotId": "EP10-B155-2", "durSec": 8, "cast": [], "beatRole": "reversal", "action": "记忆闪回"}, {"shotId": "EP10-B155-3", "durSec": 10, "cast": [], "beatRole": "cliffhanger", "action": "门外脚步未解"}]};
const next = {"episode": "EP11", "shots": [{"shotId": "EP11-B155-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "门外脚步未解"}, {"shotId": "EP11-B155-1", "durSec": 6, "cast": [], "beatRole": "increment", "action": "追问来人"}, {"shotId": "EP11-B155-2", "durSec": 5, "cast": [], "beatRole": "reversal", "action": "身份揭开"}, {"shotId": "EP11-B155-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "新悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  handoffs: [{ id: 'H10-11-b155', prevEp: 10, nextEp: 11, prev, next }],
  rhythms: [{ id: 'EP10-rhythm-b155-ho', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值-b155-ho', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', handoffId: 'H10-11-b155', rhythmId: 'EP10-rhythm-b155-ho', peakId: '对峙峰值-b155-ho', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateHandoffRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffRhythmPeakBridge', () => {
  it('handoff + rhythm + peak → PASS', () => {
    const r = evaluateHandoffRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateHandoffRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateHandoffRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
