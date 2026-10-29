/**
 * V12 Ability×PersonaMask Link — 金手指 × 伪装人设, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityMaskLink } from '@/agents/assembly/ability-mask-link-gate';

const seer = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};

const mask = {
  id: '预言家伪装',
  wearer: 'linyang',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 4,
  revealLabel: '当场揭穿唯一预言家',
};

const uses = [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
  { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 4, day: 4, option: '查验身份' },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 4,
  abilities: [seer],
  uses,
  masks: [mask],
  links: [{ id: 'L1', abilityId: 'seer', maskId: '预言家伪装' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAbilityMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAbilityMaskLink', () => {
  it('holder=wearer + use after reveal → PASS', () => {
    const r = evaluateAbilityMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateAbilityMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityMaskLink(
          pack({
            links: [
              { id: 'd', abilityId: 'seer', maskId: '预言家伪装' },
              { id: 'd', abilityId: 'seer', maskId: '预言家伪装' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateAbilityMaskLink(
      pack({
        links: [
          { id: 'a', abilityId: 'ghost', maskId: '预言家伪装' },
          { id: 'b', abilityId: 'seer', maskId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_ABILITY', 'UNKNOWN_MASK']));
  });

  it('holder ≠ wearer → HOLDER_WEARER_MISMATCH', () => {
    expect(
      failCodes(
        evaluateAbilityMaskLink(
          pack({
            masks: [{ ...mask, wearer: 'other' }],
          }),
        ),
      ),
    ).toContain('HOLDER_WEARER_MISMATCH');
  });

  it('reveal before acquired → REVEAL_BEFORE_ACQUIRED', () => {
    expect(
      failCodes(
        evaluateAbilityMaskLink(
          pack({
            abilities: [{ ...seer, acquiredEp: 3 }],
            masks: [{ ...mask, revealEp: 2, maintainEps: [] }],
            uses: [{ abilityId: 'seer', by: 'linyang', ep: 3, day: 1, option: '查验身份' }],
            latestEp: 3,
          }),
        ),
      ),
    ).toContain('REVEAL_BEFORE_ACQUIRED');
  });

  it('no use after reveal → NO_USE_AFTER_REVEAL', () => {
    expect(
      failCodes(
        evaluateAbilityMaskLink(
          pack({
            uses: [
              { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
              { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
              { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
            ],
          }),
        ),
      ),
    ).toContain('NO_USE_AFTER_REVEAL');
  });

  it('pending mask → MASK_PENDING_WITH_ABILITY WARN', () => {
    const r = evaluateAbilityMaskLink(
      pack({
        masks: [{ id: '预言家伪装', wearer: 'linyang', plantEp: 1, maintainEps: [2] }],
        latestEp: 3,
        uses: [
          { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
          { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
          { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('MASK_PENDING_WITH_ABILITY');
    expect(r.verdict).toBe('PASS');
  });
});
