/**
 * V12 Stage×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageRhythmPeakBridge } from '@/agents/assembly/stage-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B154-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B154-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B154-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B154-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  seasonId: 'S1',
  latestEp: 20,
  goals: [
    { id: '夺回机长席-b154', label: '夺回机长席', destination: '公开身份对峙胜利', startEp: 1, dueEp: 10, status: 'met' as const },
    { id: '下一关-b154', label: '下一关', destination: '晋级', startEp: 10, dueEp: 25, status: 'open' as const },
  ],
  progress: [
    { goalId: '夺回机长席-b154', ep: 10, advances: true },
    { goalId: '下一关-b154', ep: 18, advances: true },
  ],
  rhythms: [{ id: 'EP10-rhythm-b154-s', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值-b154-s', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', goalId: '夺回机长席-b154', rhythmId: 'EP10-rhythm-b154-s', peakId: '对峙峰值-b154-s', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateStageRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateStageRhythmPeakBridge', () => {
  it('stage + rhythm + peak → PASS', () => {
    const r = evaluateStageRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateStageRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateStageRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
