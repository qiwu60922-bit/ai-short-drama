/**
 * V12 Fake-Ledger Reconcile Gate — 假账本条目级对账（糊涂账物证联表）, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 《算不平的糊涂账》等:
 * 表面账 vs 真实账本逐条对照；甩账本揭穿须有 evidence，且 claim/金额须形成反差.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFakeLedgerReconcile } from '@/agents/assembly/fake-ledger-reconcile-gate';

const pack = (
  surface: Array<Record<string, unknown>>,
  truth: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>,
  latestEp = 20,
) => ({
  series: '糊涂账',
  latestEp,
  surfaceEntries: surface,
  trueEntries: truth,
  links,
});

const failCodes = (r: ReturnType<typeof evaluateFakeLedgerReconcile>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateFakeLedgerReconcile>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const surf = [
  { id: 'S1', ep: 1, claim: '家用全交公婆', amount: 5000, party: '儿媳' },
  { id: 'S2', ep: 3, claim: '医药费自理', amount: 2000, party: '儿媳' },
];
const truth = [
  {
    id: 'T1',
    ep: 1,
    claim: '公婆截留家用转给小叔',
    amount: 5000,
    party: '公婆',
    evidenceLabel: '银行流水截图',
  },
  {
    id: 'T2',
    ep: 3,
    claim: '医药费实由娘家垫付',
    amount: 2000,
    party: '娘家',
    evidenceLabel: '转账回单',
  },
];
const linksOk = [
  {
    id: 'L1',
    surfaceId: 'S1',
    trueId: 'T1',
    reconcileEp: 8,
    reconcileLabel: '甩银行流水揭穿截留',
  },
  {
    id: 'L2',
    surfaceId: 'S2',
    trueId: 'T2',
    reconcileEp: 10,
    reconcileLabel: '甩回单揭穿医药费谎言',
  },
];

describe('evaluateFakeLedgerReconcile', () => {
  it('糊涂账两条对账 PASS；gates untouched', () => {
    const r = evaluateFakeLedgerReconcile(pack(surf, truth, linksOk, 20));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 2, reconciled: 2, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateFakeLedgerReconcile({ series: 'T' }))).toContain('SCHEMA');
  });

  it('duplicate link / entry id → DUP_ID FAIL', () => {
    const r = evaluateFakeLedgerReconcile(
      pack(surf, truth, [
        { ...linksOk[0], id: 'dup' },
        { ...linksOk[1], id: 'dup' },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown surface/true → UNKNOWN_* FAIL', () => {
    const r = evaluateFakeLedgerReconcile(
      pack(surf, truth, [
        { id: 'a', surfaceId: '无', trueId: 'T1', reconcileEp: 8, reconcileLabel: 'x' },
        { id: 'b', surfaceId: 'S1', trueId: '无', reconcileEp: 8, reconcileLabel: 'y' },
      ]),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_SURFACE', 'UNKNOWN_TRUE']));
  });

  it('same claim on both sides → NO_CONTRAST FAIL', () => {
    const t = [{ ...truth[0], claim: surf[0].claim }];
    const r = evaluateFakeLedgerReconcile(
      pack([surf[0]], t, [
        {
          id: 'L',
          surfaceId: 'S1',
          trueId: 'T1',
          reconcileEp: 8,
          reconcileLabel: '甩账',
        },
      ]),
    );
    expect(failCodes(r)).toContain('NO_CONTRAST');
  });

  it('true entry missing evidence → EVIDENCE_MISSING FAIL', () => {
    const t = [{ ...truth[0], evidenceLabel: undefined }];
    const r = evaluateFakeLedgerReconcile(
      pack([surf[0]], t, [
        {
          id: 'L',
          surfaceId: 'S1',
          trueId: 'T1',
          reconcileEp: 8,
          reconcileLabel: '甩账',
        },
      ]),
    );
    expect(failCodes(r)).toContain('EVIDENCE_MISSING');
  });

  it('reconcile before max(entry eps) → RECONCILE_TOO_EARLY FAIL', () => {
    const r = evaluateFakeLedgerReconcile(
      pack([surf[0]], [truth[0]], [
        {
          id: 'L',
          surfaceId: 'S1',
          trueId: 'T1',
          reconcileEp: 1,
          reconcileLabel: '过早甩账',
          reconcileAtSec: 1,
        },
      ]),
    );
    // same-ep allowed if reconcile after plant — use ep before surface
    const r2 = evaluateFakeLedgerReconcile(
      pack(
        [{ ...surf[0], ep: 5 }],
        [{ ...truth[0], ep: 5 }],
        [
          {
            id: 'L',
            surfaceId: 'S1',
            trueId: 'T1',
            reconcileEp: 3,
            reconcileLabel: '过早',
          },
        ],
      ),
    );
    expect(failCodes(r2)).toContain('RECONCILE_TOO_EARLY');
  });

  it('reconcile without label → RECONCILE_WITHOUT_LABEL FAIL', () => {
    const r = evaluateFakeLedgerReconcile(
      pack([surf[0]], [truth[0]], [
        { id: 'L', surfaceId: 'S1', trueId: 'T1', reconcileEp: 8 },
      ]),
    );
    expect(failCodes(r)).toContain('RECONCILE_WITHOUT_LABEL');
  });

  it('future ep → FUTURE_EP FAIL', () => {
    const r = evaluateFakeLedgerReconcile(
      pack(
        [{ ...surf[0], ep: 99 }],
        [truth[0]],
        [
          {
            id: 'L',
            surfaceId: 'S1',
            trueId: 'T1',
            reconcileEp: 8,
            reconcileLabel: 'x',
          },
        ],
        20,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('surface never linked → SURFACE_UNRECONCILED WARN when past idle', () => {
    const r = evaluateFakeLedgerReconcile(
      pack(
        surf,
        [truth[0]],
        [
          {
            id: 'L1',
            surfaceId: 'S1',
            trueId: 'T1',
            reconcileEp: 8,
            reconcileLabel: '只揭一条',
          },
        ],
        20,
      ),
    );
    expect(warnCodes(r)).toContain('SURFACE_UNRECONCILED');
  });

  it('pending pair (no reconcileEp) → PENDING_PAIR WARN', () => {
    const r = evaluateFakeLedgerReconcile(
      pack(
        [surf[0]],
        [truth[0]],
        [{ id: 'L', surfaceId: 'S1', trueId: 'T1' }],
        5,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('amount equal + claim differ still PASS (反差在表述)', () => {
    const r = evaluateFakeLedgerReconcile(
      pack([surf[0]], [truth[0]], [linksOk[0]], 20),
    );
    expect(r.verdict).toBe('PASS');
  });

  it('duplicate surface id → DUP_ID FAIL', () => {
    const r = evaluateFakeLedgerReconcile(
      pack(
        [surf[0], { ...surf[0] }],
        [truth[0]],
        [linksOk[0]],
      ),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });
});
