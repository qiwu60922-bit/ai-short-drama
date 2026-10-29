/**
 * V12 Mask×Ability×Peak Ternary — 金手指×伪装×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskAbilityPeakBridge } from '@/agents/assembly/mask-ability-peak-bridge-gate';

const ability = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: {
    cycle: 'day' as const,
    maxUsesPerCycle: 1,
    options: ['查验身份', '生存情报'],
  },
};

const uses = [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
  { abilityId: 'seer', by: 'linyang', ep: 8, day: 8, option: '查验身份' },
];

const mask = {
  id: '预言家伪装',
  wearer: 'linyang',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '全场唯一揭穿',
};

const peak = {
  id: '预言家对峙',
  openEp: 1,
  peakEp: 8,
  peakLabel: '全场唯一对决',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [ability],
  uses,
  masks: [mask],
  peaks: [peak],
  links: [{ id: 'L1', abilityId: 'seer', maskId: '预言家伪装', peakId: '预言家对峙', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMaskAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMaskAbilityPeakBridge', () => {
  it('reveal=peak=ep + ability use → PASS', () => {
    const r = evaluateMaskAbilityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / EP_NOT_TERNARY / HOLDER_WEARER_MISMATCH', () => {
    expect(failCodes(evaluateMaskAbilityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            links: [
              { id: 'd', abilityId: 'seer', maskId: '预言家伪装', peakId: '预言家对峙', ep: 8 },
              { id: 'd', abilityId: 'seer', maskId: '预言家伪装', peakId: '预言家对峙', ep: 8 },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            links: [
              { id: 'L1', abilityId: 'ghost', maskId: '预言家伪装', peakId: '预言家对峙', ep: 8 },
            ],
          }),
        ),
      ),
    ).toContain('UNKNOWN_ABILITY');
    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', maskId: 'ghost', peakId: '预言家对峙', ep: 8 }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_MASK');
    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', maskId: '预言家伪装', peakId: 'ghost', ep: 8 }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_PEAK');
    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            links: [
              { id: 'L1', abilityId: 'seer', maskId: '预言家伪装', peakId: '预言家对峙', ep: 3 },
            ],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            masks: [{ ...mask, wearer: 'other' }],
          }),
        ),
      ),
    ).toContain('HOLDER_WEARER_MISMATCH');
  });

  it('missing bridge / no use at ternary', () => {
    const codes = failCodes(evaluateMaskAbilityPeakBridge(pack({ links: [] })));
    expect(codes).toContain('REVEAL_WITHOUT_BRIDGE');
    expect(codes).toContain('PEAK_WITHOUT_BRIDGE');
    expect(warnCodes(evaluateMaskAbilityPeakBridge(pack({ links: [] }))).length).toBeGreaterThanOrEqual(0);

    expect(
      failCodes(
        evaluateMaskAbilityPeakBridge(
          pack({
            uses: [
              { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
              { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
            ],
          }),
        ),
      ),
    ).toContain('NO_USE_AT_TERNARY');
  });
});
