/**
 * V12 Ensemble-Cast Gate — 家庭群像差异化分工, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits:
 * 《十八岁太奶奶驾到，重整家族荣耀3》(穿越太奶奶 + 70岁儿子 + 五重孙单元分工),
 * 《小奶团回裴家》(多哥哥群像可辨),
 * 《满院亲戚全是上古大妖》(亲戚群像职能差异 — 报告侧对照).
 * members 须 unique function/look/voice；units 的 lead 须落在其 spotlightEps.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateEnsembleCast,
  ENSEMBLE_CAST_DEFAULTS,
} from '@/agents/assembly/ensemble-cast-gate';

const ledger = (
  members: Array<Record<string, unknown>>,
  units: Array<Record<string, unknown>>,
  latestEp = 84,
) => ({ series: '太奶奶3', latestEp, members, units });

const failCodes = (r: ReturnType<typeof evaluateEnsembleCast>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateEnsembleCast>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const taiNai = {
  id: '太奶奶',
  name: '顾晚晴',
  roleSlot: 'matriarch' as const,
  functionTag: '穿越太奶奶温情重整',
  lookTag: '十八岁少女皮囊',
  voiceTag: '科学院大佬口吻',
  spotlightEps: [1, 12, 40, 60],
};
const son = {
  id: '七十岁儿子',
  name: '顾成',
  roleSlot: 'heir' as const,
  functionTag: '老年儿子赡养线',
  lookTag: '花甲老人',
  voiceTag: '无奈絮叨',
  spotlightEps: [5, 18, 45],
};
const laoSan = {
  id: '老三',
  name: '顾老三',
  roleSlot: 'grandchild' as const,
  functionTag: '创伤后失智恢复单元',
  lookTag: '痴呆傻笑',
  voiceTag: '童声残留',
  spotlightEps: [20, 28, 35],
};
const laoSi = {
  id: '老四',
  name: '顾老四',
  roleSlot: 'grandchild' as const,
  functionTag: '黄昏恋单元',
  lookTag: '油头中年',
  voiceTag: '油腻调情',
  spotlightEps: [30, 38],
};

const unitsOk = [
  { id: '开场反差', ep: 1, leadIds: ['太奶奶'], supportIds: ['七十岁儿子'], warmth: true },
  { id: '失智针灸', ep: 28, leadIds: ['老三'], supportIds: ['太奶奶'], warmth: true },
  { id: '黄昏恋', ep: 38, leadIds: ['老四'], supportIds: ['太奶奶'], warmth: true },
  { id: '听证重整', ep: 60, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false },
];

describe('evaluateEnsembleCast', () => {
  it('exposes defaults: minMembers=3, maxLeadShare=0.6', () => {
    expect(ENSEMBLE_CAST_DEFAULTS).toMatchObject({ minMembers: 3, maxLeadShare: 0.6 });
  });

  it('太奶奶家庭群像差异化 PASS；gates untouched', () => {
    const r = evaluateEnsembleCast(ledger([taiNai, son, laoSan, laoSi], unitsOk, 84));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ members: 4, units: 4 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateEnsembleCast({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate member id → DUP_ID FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, { ...son, id: '太奶奶' }],
        [{ id: 'u', ep: 1, leadIds: ['太奶奶'] }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('members < minMembers → THIN_ENSEMBLE FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son],
        [{ id: 'u', ep: 1, leadIds: ['太奶奶'] }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('THIN_ENSEMBLE');
  });

  it('duplicate functionTag → DUP_FUNCTION_TAG FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, { ...laoSan, functionTag: taiNai.functionTag }],
        unitsOk,
        84,
      ),
    );
    expect(failCodes(r)).toContain('DUP_FUNCTION_TAG');
  });

  it('duplicate lookTag → DUP_LOOK_TAG FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, { ...laoSan, lookTag: taiNai.lookTag }],
        unitsOk,
        84,
      ),
    );
    expect(failCodes(r)).toContain('DUP_LOOK_TAG');
  });

  it('duplicate voiceTag → DUP_VOICE_TAG FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, { ...laoSan, voiceTag: taiNai.voiceTag }],
        unitsOk,
        84,
      ),
    );
    expect(failCodes(r)).toContain('DUP_VOICE_TAG');
  });

  it('missing look+voice → MISSING_DIFF_TAGS FAIL', () => {
    const bare = {
      id: '路人',
      name: 'X',
      roleSlot: 'other' as const,
      functionTag: '独一份职能',
      spotlightEps: [2],
    };
    const r = evaluateEnsembleCast(
      ledger([taiNai, son, bare], [{ id: 'u', ep: 2, leadIds: ['路人'] }], 10),
    );
    expect(failCodes(r)).toContain('MISSING_DIFF_TAGS');
  });

  it('unknown lead in unit → UNKNOWN_MEMBER FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, laoSan],
        [{ id: 'u', ep: 1, leadIds: ['鬼'] }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('UNKNOWN_MEMBER');
  });

  it('unit without lead → UNIT_NO_LEAD FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, laoSan],
        [{ id: 'u', ep: 1, leadIds: [] }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('UNIT_NO_LEAD');
  });

  it('lead ep not in spotlightEps → LEAD_NOT_SPOTLIGHTED FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, laoSan],
        [{ id: 'u', ep: 99, leadIds: ['太奶奶'] }],
        100,
      ),
    );
    expect(failCodes(r)).toContain('LEAD_NOT_SPOTLIGHTED');
  });

  it('future ep → FUTURE_EP FAIL', () => {
    const r = evaluateEnsembleCast(
      ledger(
        [{ ...taiNai, spotlightEps: [1, 200] }, son, laoSan],
        [{ id: 'u', ep: 1, leadIds: ['太奶奶'] }],
        84,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('member never in any unit → ORPHAN_MEMBER WARN', () => {
    const ghost = {
      id: '太爷爷伏笔',
      name: '顾太爷',
      roleSlot: 'other' as const,
      functionTag: '系列伏笔太爷爷',
      lookTag: '只闻其名',
      voiceTag: '旁白提及',
      spotlightEps: [84],
    };
    // units without 老四 so ghost is the only unused member
    const unitsNoSi = unitsOk.filter((u) => u.id !== '黄昏恋');
    const r = evaluateEnsembleCast(
      ledger([taiNai, son, laoSan, laoSi, ghost], unitsNoSi, 84),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('ORPHAN_MEMBER');
  });

  it('one lead monopolizes units → LEAD_MONOPOLY WARN', () => {
    const monopolyUnits = [
      { id: 'a', ep: 1, leadIds: ['太奶奶'] },
      { id: 'b', ep: 12, leadIds: ['太奶奶'] },
      { id: 'c', ep: 40, leadIds: ['太奶奶'] },
      { id: 'd', ep: 5, leadIds: ['七十岁儿子'] },
    ];
    const r = evaluateEnsembleCast(
      ledger([taiNai, son, laoSan], monopolyUnits, 84),
    );
    expect(warnCodes(r)).toContain('LEAD_MONOPOLY');
  });

  it('member missing spotlightEps → NO_SPOTLIGHT WARN', () => {
    const noSpot = {
      id: '闲角',
      name: 'Y',
      roleSlot: 'servant' as const,
      functionTag: '跑龙套',
      lookTag: '灰色围裙',
      voiceTag: '轻声应是',
      spotlightEps: [],
    };
    const r = evaluateEnsembleCast(
      ledger(
        [taiNai, son, noSpot],
        [
          { id: 'u1', ep: 1, leadIds: ['太奶奶'] },
          { id: 'u2', ep: 5, leadIds: ['七十岁儿子'] },
        ],
        10,
      ),
    );
    expect(warnCodes(r)).toContain('NO_SPOTLIGHT');
  });
});
