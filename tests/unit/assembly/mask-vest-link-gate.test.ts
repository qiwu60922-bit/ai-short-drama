/** V12 Mask×Vest Link — 伪装人设 × 马甲, offline, ≠Final ≠G3. */
import { describe, expect, it } from 'vitest';
import { evaluateMaskVestLink } from '@/agents/assembly/mask-vest-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [
    {
      id: '花心人设',
      wearer: '江少',
      plantEp: 1,
      maintainEps: [3, 5, 8],
      revealEp: 12,
      revealLabel: '真心崩塌',
    },
  ],
  vests: [
    {
      id: '真情马甲',
      wearer: '江少',
      vestLabel: '专情底牌',
      plantEp: 1,
      teaseEps: [4, 7],
      dropEp: 12,
      dropLabel: '真心告白揭穿花心人设',
    },
  ],
  links: [{ id: 'L1', maskId: '花心人设', vestId: '真情马甲' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMaskVestLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMaskVestLink', () => {
  it('same wearer + revealEp=dropEp → PASS', () => {
    const r = evaluateMaskVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateMaskVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskVestLink(
          pack({
            links: [
              { id: 'd', maskId: '花心人设', vestId: '真情马甲' },
              { id: 'd', maskId: '花心人设', vestId: '真情马甲' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateMaskVestLink(
      pack({
        links: [
          { id: 'a', maskId: 'ghost', vestId: '真情马甲' },
          { id: 'b', maskId: '花心人设', vestId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_MASK', 'UNKNOWN_VEST']));
  });

  it('wearer mismatch → WEARER_MISMATCH', () => {
    expect(
      failCodes(
        evaluateMaskVestLink(
          pack({
            vests: [
              {
                id: '真情马甲',
                wearer: '别人',
                vestLabel: '专情底牌',
                plantEp: 1,
                dropEp: 12,
                dropLabel: '揭',
              },
            ],
          }),
        ),
      ),
    ).toContain('WEARER_MISMATCH');
  });

  it('reveal≠drop → REVEAL_DROP_MISMATCH', () => {
    expect(
      failCodes(
        evaluateMaskVestLink(
          pack({
            vests: [
              {
                id: '真情马甲',
                wearer: '江少',
                vestLabel: '专情底牌',
                plantEp: 1,
                dropEp: 15,
                dropLabel: '晚揭',
              },
            ],
          }),
        ),
      ),
    ).toContain('REVEAL_DROP_MISMATCH');
  });

  it('one terminal only → TERMINAL_WITHOUT_PAIR', () => {
    expect(
      failCodes(
        evaluateMaskVestLink(
          pack({
            vests: [
              {
                id: '真情马甲',
                wearer: '江少',
                vestLabel: '专情底牌',
                plantEp: 1,
                teaseEps: [4],
              },
            ],
          }),
        ),
      ),
    ).toContain('TERMINAL_WITHOUT_PAIR');
  });

  it('both pending → PENDING_PAIR WARN', () => {
    const r = evaluateMaskVestLink(
      pack({
        masks: [{ id: '花心人设', wearer: '江少', plantEp: 1, maintainEps: [3] }],
        vests: [
          {
            id: '真情马甲',
            wearer: '江少',
            vestLabel: '专情底牌',
            plantEp: 1,
            teaseEps: [4],
          },
        ],
        latestEp: 8,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
  });
});
