/**
 * V12 Cliff×Ability×Peak Ternary — 悬念×金手指×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffAbilityPeakBridge } from '@/agents/assembly/cliff-ability-peak-bridge-gate';

const cliffPrev = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP09-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP09-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP09-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
  ],
};
const cliffNext = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', cast: [], durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
    { shotId: 'EP10-S1', cast: [], durSec: 2, beatRole: 'increment', action: '追兵逼近' },
    { shotId: 'EP10-S2', cast: [], durSec: 10, beatRole: 'reversal', action: '旧友现身' },
    { shotId: 'EP10-S3', cast: [], durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [{
    id: 'seer',
    holder: 'linyang',
    acquiredEp: 1,
    exclusive: true,
    rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
  }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 9, day: 9, option: '生存情报' },
  ],
  cliffLinks: [{ id: 'C9-10', prevEp: 9, nextEp: 10, prev: cliffPrev, next: cliffNext }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 9, peakLabel: '公开身份对峙', payoffEp: 9 }],
  links: [{ id: 'L1', cliffLinkId: 'C9-10', abilityId: 'seer', peakId: '对峙峰值', ep: 9 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffAbilityPeakBridge', () => {
  it('cliff prev + use + peak @ep → PASS', () => {
    const r = evaluateCliffAbilityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCliffAbilityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffAbilityPeakBridge(
          pack({
            links: [{ id: 'L1', cliffLinkId: 'C9-10', abilityId: 'seer', peakId: '对峙峰值', ep: 8 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateCliffAbilityPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
