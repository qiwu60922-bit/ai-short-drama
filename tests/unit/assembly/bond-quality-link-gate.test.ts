/**
 * V12 Bond×Quality Link — 契约×表演门, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondQualityLink } from '@/agents/assembly/bond-quality-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01',
    scriptBeat: '表演兑现。',
    durationSec: 4,
    dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger' as const, intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null,
    mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '机长契约',
    partyA: '苏见晴',
    partyB: '傅司宴',
    contractEp: 1,
    contractLabel: '契约联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', bondId: '机长契约', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateBondQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondQualityLink', () => {
  it('terminal + quality → PASS', () => {
    const r = evaluateBondQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / TERMINAL_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateBondQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateBondQualityLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_QUALITY');
  });
});
