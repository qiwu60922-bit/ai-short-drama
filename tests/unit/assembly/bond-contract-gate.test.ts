/**
 * V12 Bond-Contract Gate — 契约关系→真情升级/解除账本, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits 2026-10-28:
 * 《邱秘书的婚事》（契约女友提案 → 暗中帮扶 → 受伤后真情升级/求婚）,
 * 《后妈只想苟…》（昨日候选对照：协议婚姻→真情 tipping）,
 * 《十八岁太奶奶…》《在八月盛夏》（今日对照，本测不绑 ensemble / motif）.
 * contract → companionEps[] → upgrade|dissolve(+label); same-ep contract+upgrade allowed.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondContract } from '@/agents/assembly/bond-contract-gate';

const ledger = (entries: Array<Record<string, unknown>>, latestEp = 80) => ({
  series: 'T',
  latestEp,
  entries,
});

const failCodes = (r: ReturnType<typeof evaluateBondContract>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateBondContract>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateBondContract', () => {
  it('contract → companion → upgrade PASS; gates untouched', () => {
    const r = evaluateBondContract(
      ledger(
        [
          {
            id: '邱秘书契约',
            partyA: '邱秘书',
            partyB: '陆总',
            contractEp: 5,
            contractLabel: '一年契约女友',
            terms: '对外伪装情侣，到期解除',
            companionEps: [12, 28, 45],
            upgradeEp: 70,
            upgradeLabel: '受伤后真情求婚',
          },
        ],
        78,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({
      total: 1,
      upgraded: 1,
      dissolved: 0,
      pending: 0,
      withCompanion: 1,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('same-ep contract+upgrade allowed when upgradeAtSec ≥ contractAtSec', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '同集升级',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractAtSec: 10,
          contractLabel: '假订婚',
          upgradeEp: 1,
          upgradeAtSec: 90,
          upgradeLabel: '当场真情告白',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('UPGRADE_BEFORE_CONTRACT');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateBondContract({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate ids → DUP_ID FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: 'x',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractLabel: '契约',
          upgradeEp: 2,
          upgradeLabel: '真情',
        },
        {
          id: 'x',
          partyA: 'C',
          partyB: 'D',
          contractEp: 3,
          contractLabel: '契约',
          dissolveEp: 4,
          dissolveLabel: '解除',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('contract/upgrade/dissolve/companion beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateBondContract(
      ledger(
        [
          {
            id: '未来',
            partyA: 'A',
            partyB: 'B',
            contractEp: 1,
            contractLabel: '契约',
            companionEps: [25],
            upgradeEp: 26,
            upgradeLabel: '晚',
          },
        ],
        20,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('upgradeEp before contractEp → UPGRADE_BEFORE_CONTRACT FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '颠倒升级',
          partyA: 'A',
          partyB: 'B',
          contractEp: 10,
          contractLabel: '契约',
          upgradeEp: 3,
          upgradeLabel: '早升级',
        },
      ]),
    );
    expect(failCodes(r)).toContain('UPGRADE_BEFORE_CONTRACT');
  });

  it('same ep but upgradeAtSec before contractAtSec → UPGRADE_BEFORE_CONTRACT FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '同集颠倒',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractAtSec: 80,
          contractLabel: '契约',
          upgradeEp: 1,
          upgradeAtSec: 10,
          upgradeLabel: '真情',
        },
      ]),
    );
    expect(failCodes(r)).toContain('UPGRADE_BEFORE_CONTRACT');
  });

  it('dissolveEp before contractEp → DISSOLVE_BEFORE_CONTRACT FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '颠倒解除',
          partyA: 'A',
          partyB: 'B',
          contractEp: 10,
          contractLabel: '契约',
          dissolveEp: 3,
          dissolveLabel: '早解除',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DISSOLVE_BEFORE_CONTRACT');
  });

  it('upgrade without upgradeLabel → UPGRADE_WITHOUT_LABEL FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '无升级标签',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractLabel: '契约',
          upgradeEp: 8,
        },
      ]),
    );
    expect(failCodes(r)).toContain('UPGRADE_WITHOUT_LABEL');
  });

  it('dissolve without dissolveLabel → DISSOLVE_WITHOUT_LABEL FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '无解除标签',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractLabel: '契约',
          dissolveEp: 8,
        },
      ]),
    );
    expect(failCodes(r)).toContain('DISSOLVE_WITHOUT_LABEL');
  });

  it('both upgradeEp and dissolveEp → BOTH_TERMINALS FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '双终结',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractLabel: '契约',
          upgradeEp: 5,
          upgradeLabel: '真情',
          dissolveEp: 6,
          dissolveLabel: '解除',
        },
      ]),
    );
    expect(failCodes(r)).toContain('BOTH_TERMINALS');
  });

  it('companion ep before contractEp → COMPANION_BEFORE_CONTRACT FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '早陪伴',
          partyA: 'A',
          partyB: 'B',
          contractEp: 10,
          contractLabel: '契约',
          companionEps: [5],
          upgradeEp: 15,
          upgradeLabel: '真情',
        },
      ]),
    );
    expect(failCodes(r)).toContain('COMPANION_BEFORE_CONTRACT');
  });

  it('companion ep after terminal → COMPANION_AFTER_TERMINAL FAIL', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '晚陪伴',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractLabel: '契约',
          companionEps: [12],
          upgradeEp: 8,
          upgradeLabel: '真情',
        },
      ]),
    );
    expect(failCodes(r)).toContain('COMPANION_AFTER_TERMINAL');
  });

  it('contracted not terminated → PENDING WARN + PASS', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '蓄势',
          partyA: '邱秘书',
          partyB: '陆总',
          contractEp: 5,
          contractLabel: '一年契约女友',
          companionEps: [12],
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING');
    expect(r.metrics.pending).toBe(1);
  });

  it('upgraded with no companion → NO_COMPANION WARN + PASS', () => {
    const r = evaluateBondContract(
      ledger([
        {
          id: '直达',
          partyA: 'A',
          partyB: 'B',
          contractEp: 1,
          contractLabel: '契约',
          upgradeEp: 50,
          upgradeLabel: '真情求婚',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_COMPANION');
  });

  it('empty entries PASS', () => {
    const r = evaluateBondContract(ledger([], 10));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.total).toBe(0);
  });
});
