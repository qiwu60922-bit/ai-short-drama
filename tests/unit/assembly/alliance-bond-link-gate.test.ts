/**
 * V12 Alliance×Bond Link — 人物同盟 × 契约关系联表, offline, ≠Final ≠G3.
 * 《七块五…》《邱秘书的婚事》《觉醒伪神…》结构层对照.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceBondLink } from '@/agents/assembly/alliance-bond-link-gate';

const couple = {
  id: '夫妻同盟',
  label: '夫妻撑腰线',
  members: ['妻子', '丈夫'],
  formedEp: 1,
};

const eventsOk = [
  { allianceId: '夫妻同盟', ep: 1, role: 'seed', note: '截留津贴压垮同盟' },
  { allianceId: '夫妻同盟', ep: 20, role: 'echo', note: '电话惊悉' },
  { allianceId: '夫妻同盟', ep: 40, role: 'payoff', evidence: '祠堂领条', note: '丈夫撑腰' },
];

const bondOk = {
  id: '婚姻契约',
  partyA: '妻子',
  partyB: '丈夫',
  contractEp: 1,
  contractLabel: '协议婚姻',
  companionEps: [12, 20, 28],
  upgradeEp: 40,
  upgradeLabel: '祠堂领条真情撑腰',
};

const pack = (
  extra: {
    alliances?: Array<Record<string, unknown>>;
    events?: Array<Record<string, unknown>>;
    bonds?: Array<Record<string, unknown>>;
    links?: Array<Record<string, unknown>>;
    latestEp?: number;
  } = {},
) => ({
  series: '七块五',
  latestEp: extra.latestEp ?? 80,
  alliances: extra.alliances ?? [couple],
  events: extra.events ?? eventsOk,
  bonds: extra.bonds ?? [bondOk],
  links: extra.links ?? [{ id: 'L1', allianceId: '夫妻同盟', bondId: '婚姻契约' }],
});

const failCodes = (r: ReturnType<typeof evaluateAllianceBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAllianceBondLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAllianceBondLink', () => {
  it('同盟 seed→payoff 对齐契约 upgrade 同集 → PASS; gates untouched', () => {
    const r = evaluateAllianceBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateAllianceBondLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('dup link id → DUP_ID FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        links: [
          { id: 'dup', allianceId: '夫妻同盟', bondId: '婚姻契约' },
          { id: 'dup', allianceId: '夫妻同盟', bondId: '婚姻契约' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown alliance/bond → UNKNOWN_* FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        links: [
          { id: 'a', allianceId: 'ghost', bondId: '婚姻契约' },
          { id: 'b', allianceId: '夫妻同盟', bondId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['UNKNOWN_ALLIANCE', 'UNKNOWN_BOND']),
    );
  });

  it('party not in members → MEMBER_MISMATCH FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        bonds: [{ ...bondOk, partyB: '外人' }],
      }),
    );
    expect(failCodes(r)).toContain('MEMBER_MISMATCH');
  });

  it('contract without alliance seed → CONTRACT_WITHOUT_SEED FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        events: [
          { allianceId: '夫妻同盟', ep: 10, role: 'seed', note: '晚于契约' },
          { allianceId: '夫妻同盟', ep: 20, role: 'echo', note: 'x' },
          { allianceId: '夫妻同盟', ep: 40, role: 'payoff', note: 'y' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('CONTRACT_WITHOUT_SEED');
  });

  it('upgrade without alliance payoff → TERMINAL_WITHOUT_PAYOFF FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        events: [
          { allianceId: '夫妻同盟', ep: 1, role: 'seed', note: 'a' },
          { allianceId: '夫妻同盟', ep: 20, role: 'echo', note: 'b' },
          { allianceId: '夫妻同盟', ep: 30, role: 'echo', note: 'c' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('TERMINAL_WITHOUT_PAYOFF');
  });

  it('alliance payoff without bond terminal → PAYOFF_WITHOUT_TERMINAL FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        bonds: [
          {
            id: '婚姻契约',
            partyA: '妻子',
            partyB: '丈夫',
            contractEp: 1,
            contractLabel: '协议婚姻',
            companionEps: [12, 20],
          },
        ],
      }),
    );
    expect(failCodes(r)).toContain('PAYOFF_WITHOUT_TERMINAL');
  });

  it('terminalEp ≠ payoff ep → EP_MISMATCH FAIL', () => {
    const r = evaluateAllianceBondLink(
      pack({
        bonds: [{ ...bondOk, upgradeEp: 50, upgradeLabel: '晚一拍撑腰' }],
      }),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('both pending → PENDING_PAIR WARN + PASS', () => {
    const r = evaluateAllianceBondLink(
      pack({
        events: [
          { allianceId: '夫妻同盟', ep: 1, role: 'seed', note: 'a' },
          { allianceId: '夫妻同盟', ep: 10, role: 'echo', note: 'b' },
          { allianceId: '夫妻同盟', ep: 20, role: 'echo', note: 'c' },
        ],
        bonds: [
          {
            id: '婚姻契约',
            partyA: '妻子',
            partyB: '丈夫',
            contractEp: 1,
            contractLabel: '协议婚姻',
            companionEps: [10, 20],
          },
        ],
        latestEp: 25,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });
});
