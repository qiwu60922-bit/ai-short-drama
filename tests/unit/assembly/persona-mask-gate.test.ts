/**
 * V12 Persona-Mask Gate — 伪装人设/假身份账本（抓包与崩塌）, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果/抖音 hits 2026-10-22～10-24:
 * 《枝头春意闹》(造谣假人设→当场抓包),
 * 《逃婚三年，江少的花心人设崩了》(花心 mask→绯闻维持→真心 reveal),
 * 《算不平的糊涂账》(表面账 vs 真实账本对照 — 报告侧).
 * plant → maintain → reveal; same-ep plant+reveal allowed.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaMask } from '@/agents/assembly/persona-mask-gate';

const ledger = (entries: Array<Record<string, unknown>>, latestEp = 20) => ({
  series: 'T',
  latestEp,
  entries,
});

const failCodes = (r: ReturnType<typeof evaluatePersonaMask>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluatePersonaMask>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluatePersonaMask', () => {
  it('plant → maintain → reveal PASS; gates untouched', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '花心人设',
          wearer: '江少',
          plantEp: 1,
          maintainEps: [3, 5, 8],
          revealEp: 12,
          revealLabel: '真心崩塌',
        },
        {
          id: '病弱国公宠',
          wearer: '宋枝',
          plantEp: 1,
          plantAtSec: 10,
          revealEp: 1,
          revealAtSec: 40,
          revealLabel: '当场抓包',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ total: 2, revealed: 2, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('same-ep plant+reveal allowed when revealAtSec ≥ plantAtSec', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '当场抓包',
          wearer: '宋枝',
          plantEp: 1,
          plantAtSec: 5,
          revealEp: 1,
          revealAtSec: 30,
          revealLabel: '本人到场',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('REVEAL_BEFORE_PLANT');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluatePersonaMask({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate ids → DUP_ID FAIL', () => {
    const r = evaluatePersonaMask(
      ledger([
        { id: 'x', wearer: 'A', plantEp: 1, revealEp: 2, revealLabel: '揭' },
        { id: 'x', wearer: 'B', plantEp: 3, revealEp: 4, revealLabel: '揭' },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('plant/reveal/maintain beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluatePersonaMask(
      ledger(
        [
          {
            id: '未来',
            wearer: 'A',
            plantEp: 1,
            maintainEps: [25],
            revealEp: 26,
            revealLabel: '晚',
          },
        ],
        20,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('revealEp before plantEp → REVEAL_BEFORE_PLANT FAIL', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '颠倒',
          wearer: 'A',
          plantEp: 5,
          revealEp: 2,
          revealLabel: '早揭',
        },
      ]),
    );
    expect(failCodes(r)).toContain('REVEAL_BEFORE_PLANT');
  });

  it('same ep but revealAtSec before plantAtSec → REVEAL_BEFORE_PLANT FAIL', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '同集颠倒',
          wearer: '宋枝',
          plantEp: 1,
          plantAtSec: 40,
          revealEp: 1,
          revealAtSec: 10,
          revealLabel: '抓包',
        },
      ]),
    );
    expect(failCodes(r)).toContain('REVEAL_BEFORE_PLANT');
  });

  it('reveal without revealLabel → REVEAL_WITHOUT_LABEL FAIL', () => {
    const r = evaluatePersonaMask(
      ledger([{ id: '无标签', wearer: 'A', plantEp: 1, revealEp: 3 }]),
    );
    expect(failCodes(r)).toContain('REVEAL_WITHOUT_LABEL');
  });

  it('maintainEp before plantEp → MAINTAIN_BEFORE_PLANT FAIL', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '早维持',
          wearer: '江少',
          plantEp: 5,
          maintainEps: [2, 6],
          revealEp: 8,
          revealLabel: '崩',
        },
      ]),
    );
    expect(failCodes(r)).toContain('MAINTAIN_BEFORE_PLANT');
  });

  it('maintainEp after revealEp → MAINTAIN_AFTER_REVEAL FAIL', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '晚维持',
          wearer: '江少',
          plantEp: 1,
          maintainEps: [3, 15],
          revealEp: 10,
          revealLabel: '崩',
        },
      ]),
    );
    expect(failCodes(r)).toContain('MAINTAIN_AFTER_REVEAL');
  });

  it('plant without reveal → MASK_PENDING WARN (PASS)', () => {
    const r = evaluatePersonaMask(
      ledger(
        [{ id: '待揭', wearer: '江少', plantEp: 1, maintainEps: [2, 3] }],
        5,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('MASK_PENDING');
    expect(r.findings.find((f) => f.code === 'MASK_PENDING')).toMatchObject({
      severity: 'WARN',
      ids: ['待揭'],
    });
  });

  it('plant/reveal without maintainEps → NO_MAINTAIN WARN (PASS)', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '无维持',
          wearer: '宋枝',
          plantEp: 1,
          revealEp: 1,
          revealAtSec: 20,
          revealLabel: '当场抓包',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_MAINTAIN');
  });

  it('empty maintainEps array → NO_MAINTAIN WARN', () => {
    const r = evaluatePersonaMask(
      ledger([
        {
          id: '空维持',
          wearer: 'A',
          plantEp: 1,
          maintainEps: [],
          revealEp: 4,
          revealLabel: '揭',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_MAINTAIN');
  });

  it('wearer required by schema → SCHEMA FAIL when missing', () => {
    const r = evaluatePersonaMask(
      ledger([{ id: '缺佩戴者', plantEp: 1, revealEp: 2, revealLabel: '揭' }]),
    );
    expect(failCodes(r)).toContain('SCHEMA');
  });
});
