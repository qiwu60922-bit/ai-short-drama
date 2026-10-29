/**
 * V12 Bond×Mask Link — 契约升级/解除 × 伪装揭穿, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondMaskLink } from '@/agents/assembly/bond-mask-link-gate';

const bond = {
  id: '邱秘书契约',
  partyA: '邱秘书',
  partyB: '陆总',
  contractEp: 5,
  contractLabel: '一年契约女友',
  companionEps: [12, 28, 45],
  upgradeEp: 70,
  upgradeLabel: '受伤后真情求婚',
};

const mask = {
  id: '拜金人设',
  wearer: '邱秘书',
  plantEp: 5,
  maintainEps: [12, 28],
  revealEp: 70,
  revealLabel: '真情崩塌揭穿',
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '云海不相逢',
  latestEp: 78,
  bonds: [bond],
  masks: [mask],
  links: [{ id: 'L1', bondId: '邱秘书契约', maskId: '拜金人设' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateBondMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateBondMaskLink', () => {
  it('upgrade at reveal → PASS', () => {
    const r = evaluateBondMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / not at reveal', () => {
    expect(failCodes(evaluateBondMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondMaskLink(
          pack({
            links: [
              { id: 'd', bondId: '邱秘书契约', maskId: '拜金人设' },
              { id: 'd', bondId: '邱秘书契约', maskId: '拜金人设' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateBondMaskLink(
          pack({
            bonds: [{ ...bond, upgradeEp: 60, upgradeLabel: '提前升级' }],
          }),
        ),
      ),
    ).toContain('TERMINAL_NOT_AT_REVEAL');
  });

  it('reveal without link → REVEAL_WITHOUT_BOND', () => {
    expect(failCodes(evaluateBondMaskLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_BOND');
  });

  it('orphan bond → PENDING_BOND WARN', () => {
    const r = evaluateBondMaskLink(
      pack({
        bonds: [
          bond,
          {
            id: '旁路契约',
            partyA: 'A',
            partyB: 'B',
            contractEp: 2,
            contractLabel: '旁路',
            companionEps: [3],
            upgradeEp: 10,
            upgradeLabel: '旁路升级',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_BOND');
    expect(r.verdict).toBe('PASS');
  });
});
