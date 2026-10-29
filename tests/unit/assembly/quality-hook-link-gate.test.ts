/**
 * V12 Quality×Hook Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityHookLink } from '@/agents/assembly/quality-hook-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};
const shotSpec = {
  episode: 'EP01',
  shots: [
    { shotId: 'EP01-S0', cast: [], durSec: 2, beatRole: 'hook', action: 'crisis open', hookKind: 'situation' },
    { shotId: 'EP01-S1', cast: [], durSec: 4, beatRole: 'setup' },
    { shotId: 'EP01-S2', cast: [], durSec: 6, beatRole: 'increment' },
    { shotId: 'EP01-S3', cast: [], durSec: 6, beatRole: 'increment' },
    { shotId: 'EP01-S4', cast: [], durSec: 6, beatRole: 'setup' },
    { shotId: 'EP01-S5', cast: [], durSec: 6, beatRole: 'increment' },
    { shotId: 'EP01-S6', cast: [], durSec: 6, beatRole: 'reversal' },
    { shotId: 'EP01-S7', cast: [], durSec: 6, beatRole: 'increment' },
    { shotId: 'EP01-S8', cast: [], durSec: 6, beatRole: 'increment' },
    { shotId: 'EP01-S9', cast: [], durSec: 6, beatRole: 'increment' },
    { shotId: 'EP01-S10', cast: [], durSec: 6, beatRole: 'cliffhanger' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '钩子结构',
  latestEp: 20,
  hooks: [{ id: 'EP01-hook', ep: 10, shotSpec }],
  links: [{ id: 'L1', hookId: 'EP01-hook', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityHookLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityHookLink', () => {
  it('quality + hook → PASS', () => {
    const r = evaluateQualityHookLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / HOOK_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityHookLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityHookLink(pack({ links: [] })))).toContain('HOOK_WITHOUT_QUALITY');
  });
});
