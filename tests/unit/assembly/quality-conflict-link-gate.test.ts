/**
 * V12 Quality×Conflict Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityConflictLink } from '@/agents/assembly/quality-conflict-link-gate';
import fixture from '../../fixtures/v13/story-ledger-suite.v13.json';

const qualityLeap = {
          style: 'live_action',
          shots: [{
            id: 'S01', scriptBeat: '对峙兑现。', durationSec: 4, dramaPurpose: '揭穿可见表演',
            characterIntent: '撕开伪装',
            performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
            camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
            dialogue: null, mouthResting: '嘴唇自然闭合',
            fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
          }],
        };
const pack = (extra: Record<string, unknown> = {}) => {
  const conflicts = (fixture as any).conflictPeakLink?.conflicts
    ?? [{ id: 'C1', label: '冲突', openEp: 1, payoffEp: 10, status: 'open' }];
  return {
    series: '帐中香',
    latestEp: 20,
    conflicts,
    links: [{ id: 'L1', conflictId: conflicts[0].id, ep: conflicts[0].payoffEp ?? 10, qualityLeap }],
    ...extra,
  };
};
const failCodes = (r: ReturnType<typeof evaluateQualityConflictLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityConflictLink', () => {
  it('quality + conflict → PASS', () => {
    const r = evaluateQualityConflictLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityConflictLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityConflictLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_QUALITY');
  });
});
