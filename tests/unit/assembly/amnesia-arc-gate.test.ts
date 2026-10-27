/**
 * V12 Amnesia-Arc Gate — 失忆/记忆断裂弧账本, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits 2026-10-27:
 * 《反派拿捏！第三季》（爆炸失忆≈E268 → 陪伴 → 圣诞摩天轮≈E398 唤回）,
 * 《后妈只想苟，老公非要凑第二季》（协议搭伙→真情沦陷 = 关系知识重建对照；本测以失忆弧为主）,
 * 《退役归来，这个保镖不好惹》（保镖马甲/父母隐秘走 vest/foreshadow，本测不绑）.
 * plant → companionEps[] → recover(+label); same-ep plant+recover allowed.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaArc } from '@/agents/assembly/amnesia-arc-gate';

const ledger = (entries: Array<Record<string, unknown>>, latestEp = 400) => ({
  series: 'T',
  latestEp,
  entries,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaArc>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateAmnesiaArc>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAmnesiaArc', () => {
  it('plant → companion → recover PASS; gates untouched', () => {
    const r = evaluateAmnesiaArc(
      ledger(
        [
          {
            id: '祁南失忆',
            actor: '祁南',
            plantEp: 268,
            plantCause: '爆炸',
            companionEps: [280, 320, 360],
            recoverEp: 398,
            recoverLabel: '圣诞摩天轮对视唤回往昔告白深吻',
            recoverTrigger: '圣诞摩天轮',
          },
        ],
        399,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ total: 1, recovered: 1, pending: 0, withCompanion: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('same-ep plant+recover allowed when recoverAtSec ≥ plantAtSec', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '同集唤回',
          actor: '祁南',
          plantEp: 1,
          plantAtSec: 10,
          recoverEp: 1,
          recoverAtSec: 80,
          recoverLabel: '旧物触景唤回',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('RECOVER_BEFORE_PLANT');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateAmnesiaArc({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate ids → DUP_ID FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: 'x',
          actor: 'A',
          plantEp: 1,
          recoverEp: 2,
          recoverLabel: '唤回',
        },
        {
          id: 'x',
          actor: 'B',
          plantEp: 3,
          recoverEp: 4,
          recoverLabel: '唤回',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('plant/recover/companion beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger(
        [
          {
            id: '未来',
            actor: 'A',
            plantEp: 1,
            companionEps: [25],
            recoverEp: 26,
            recoverLabel: '晚',
          },
        ],
        20,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('recoverEp before plantEp → RECOVER_BEFORE_PLANT FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '颠倒',
          actor: 'A',
          plantEp: 10,
          recoverEp: 3,
          recoverLabel: '早唤回',
        },
      ]),
    );
    expect(failCodes(r)).toContain('RECOVER_BEFORE_PLANT');
  });

  it('same ep but recoverAtSec before plantAtSec → RECOVER_BEFORE_PLANT FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '同集颠倒',
          actor: '祁南',
          plantEp: 1,
          plantAtSec: 80,
          recoverEp: 1,
          recoverAtSec: 10,
          recoverLabel: '唤回',
        },
      ]),
    );
    expect(failCodes(r)).toContain('RECOVER_BEFORE_PLANT');
  });

  it('recover without recoverLabel → RECOVER_WITHOUT_LABEL FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '无标签',
          actor: 'A',
          plantEp: 1,
          recoverEp: 8,
        },
      ]),
    );
    expect(failCodes(r)).toContain('RECOVER_WITHOUT_LABEL');
  });

  it('companion ep before plantEp → COMPANION_BEFORE_PLANT FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '早陪伴',
          actor: 'A',
          plantEp: 10,
          companionEps: [5],
          recoverEp: 15,
          recoverLabel: '唤回',
        },
      ]),
    );
    expect(failCodes(r)).toContain('COMPANION_BEFORE_PLANT');
  });

  it('companion ep after recoverEp → COMPANION_AFTER_RECOVER FAIL', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '晚陪伴',
          actor: 'A',
          plantEp: 1,
          companionEps: [12],
          recoverEp: 8,
          recoverLabel: '唤回',
        },
      ]),
    );
    expect(failCodes(r)).toContain('COMPANION_AFTER_RECOVER');
  });

  it('planted not recovered → RECOVER_PENDING WARN + PASS', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '蓄势',
          actor: '祁南',
          plantEp: 268,
          plantCause: '爆炸',
          companionEps: [280],
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('RECOVER_PENDING');
    expect(r.metrics.pending).toBe(1);
  });

  it('recovered with no companion → NO_COMPANION WARN + PASS', () => {
    const r = evaluateAmnesiaArc(
      ledger([
        {
          id: '直达',
          actor: '祁南',
          plantEp: 268,
          recoverEp: 398,
          recoverLabel: '摩天轮唤回',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_COMPANION');
  });

  it('empty entries PASS', () => {
    const r = evaluateAmnesiaArc(ledger([], 10));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.total).toBe(0);
  });
});
