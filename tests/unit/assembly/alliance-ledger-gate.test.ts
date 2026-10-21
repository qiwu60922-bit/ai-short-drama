/**
 * V12 Alliance Ledger Gate — 人物同盟账本（seed→echo→payoff）, offline, ≠Final ≠G3.
 * Reverse-engineered (public text/structure only) from 红果/抖音 hits 2026-10-20~21:
 * 《觉醒伪神：神明弃我我自为神7》(恶鬼之牙公会收留→护短→赠神印),
 * 《七块五养全家，丈夫归来后替我撑腰》(夫妻同盟→电话惊悉→祠堂领条撑腰),
 * 《天降福星：沈家小渔》(退婚后立刻种子同盟：系统/认干孙女).
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateAllianceLedger,
  ALLIANCE_LEDGER_DEFAULTS,
} from '@/agents/assembly/alliance-ledger-gate';

const guild = {
  id: 'oni-fang',
  label: '恶鬼之牙',
  members: ['chen-haoyu', 'guild'],
  formedEp: 1,
};

const ledger = (
  events: Array<Record<string, unknown>>,
  opts: { latestEp?: number; alliances?: Array<Record<string, unknown>> } = {},
) => ({
  series: 'T',
  latestEp: opts.latestEp ?? 80,
  alliances: opts.alliances ?? [guild],
  events,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceLedger>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAllianceLedger>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAllianceLedger', () => {
  it('exposes defaults: minEvents=3, maxIdleEps=30', () => {
    expect(ALLIANCE_LEDGER_DEFAULTS).toEqual({ minEvents: 3, maxIdleEps: 30 });
  });

  it('seed + echo + payoff across episodes → PASS; gates untouched', () => {
    const r = evaluateAllianceLedger(
      ledger(
        [
          { allianceId: 'oni-fang', ep: 1, role: 'seed', note: '收留神弃少年' },
          { allianceId: 'oni-fang', ep: 20, role: 'echo', note: '镇兽大比护短' },
          {
            allianceId: 'oni-fang',
            ep: 40,
            role: 'payoff',
            evidence: '红色神印',
            note: '解锁神魔双形态',
          },
        ],
        { latestEp: 45 },
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics).toMatchObject({
      alliances: 1,
      events: 3,
      underEvents: 0,
      idle: 0,
      latestEp: 45,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('夫妻同盟 + 领条撑腰 → PASS (七块五结构)', () => {
    const r = evaluateAllianceLedger(
      ledger(
        [
          { allianceId: 'couple', ep: 1, role: 'seed', note: '留守养家' },
          { allianceId: 'couple', ep: 10, role: 'echo', note: '长途电话惊悉' },
          {
            allianceId: 'couple',
            ep: 30,
            role: 'payoff',
            by: 'lu-weiguo',
            evidence: '领条',
            note: '推开祠堂门替妻撑腰',
          },
        ],
        {
          alliances: [
            {
              id: 'couple',
              label: '陆卫国-宋香兰',
              members: ['lu-weiguo', 'song-xianglan'],
            },
          ],
        },
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
  });

  it('schema garbage → SCHEMA FAIL', () => {
    const r = evaluateAllianceLedger({ series: 'T' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('duplicate alliance id → DUP_ID FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([], {
        alliances: [guild, { ...guild, label: '恶鬼之牙2' }],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('alliance with <2 members → THIN_MEMBERSHIP FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([], {
        alliances: [{ id: 'solo', label: '独行', members: ['only-me'] }],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('THIN_MEMBERSHIP');
  });

  it('event refs unknown alliance → UNKNOWN_ALLIANCE FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([{ allianceId: 'ghost', ep: 1, role: 'seed' }]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UNKNOWN_ALLIANCE');
  });

  it('event ep beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([{ allianceId: 'oni-fang', ep: 99, role: 'seed' }], { latestEp: 10 }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('formedEp beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([], {
        latestEp: 5,
        alliances: [{ ...guild, formedEp: 9 }],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('echo/payoff without any seed → NO_SEED FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([
        { allianceId: 'oni-fang', ep: 10, role: 'echo' },
        { allianceId: 'oni-fang', ep: 20, role: 'payoff' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('NO_SEED');
  });

  it('echo before seed → ECHO_BEFORE_SEED FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([
        { allianceId: 'oni-fang', ep: 5, role: 'echo' },
        { allianceId: 'oni-fang', ep: 10, role: 'seed' },
        { allianceId: 'oni-fang', ep: 20, role: 'payoff' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('ECHO_BEFORE_SEED');
  });

  it('payoff before seed → PAYOFF_BEFORE_SEED FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([
        { allianceId: 'oni-fang', ep: 5, role: 'payoff' },
        { allianceId: 'oni-fang', ep: 10, role: 'seed' },
        { allianceId: 'oni-fang', ep: 20, role: 'echo' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PAYOFF_BEFORE_SEED');
  });

  it('fewer than minEvents → UNDER_EVENTS FAIL', () => {
    const r = evaluateAllianceLedger(
      ledger([
        { allianceId: 'oni-fang', ep: 1, role: 'seed' },
        { allianceId: 'oni-fang', ep: 2, role: 'echo' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UNDER_EVENTS');
    expect(r.metrics.underEvents).toBe(1);
  });

  it('seed+echo no payoff + idle past half maxIdle → MISSING_PAYOFF WARN (still PASS)', () => {
    const r = evaluateAllianceLedger(
      ledger(
        [
          { allianceId: 'oni-fang', ep: 1, role: 'seed' },
          { allianceId: 'oni-fang', ep: 5, role: 'echo' },
          { allianceId: 'oni-fang', ep: 8, role: 'echo' },
        ],
        { latestEp: 40 },
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('MISSING_PAYOFF');
  });

  it('last event idle > maxIdleEps → ALLIANCE_IDLE WARN (still PASS)', () => {
    const r = evaluateAllianceLedger(
      ledger(
        [
          { allianceId: 'oni-fang', ep: 1, role: 'seed' },
          { allianceId: 'oni-fang', ep: 2, role: 'echo' },
          { allianceId: 'oni-fang', ep: 3, role: 'payoff' },
        ],
        { latestEp: 50 },
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('ALLIANCE_IDLE');
    expect(r.metrics.idle).toBe(1);
  });
});
