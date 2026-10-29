/**
 * V12 Amnesia×Motif Link Gate — 唤回 trigger 须对应已栽种视觉母题, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits + 2026-10-29 候选:
 * 《反派拿捏！第三季》爆炸失忆 → 陪伴 → 圣诞摩天轮唤回（trigger=已栽种母题 payoff 同集）,
 * 《盛夏芬德拉》白玫瑰三次回扣对照（motif 侧）,
 * 《后妈只想苟…》关系知识重建对照（本测不绑）.
 * recoverTrigger === motif.label 且 recoverEp === motif payoff.ep.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaMotifLink } from '@/agents/assembly/amnesia-motif-link-gate';

const pack = (
  amnesias: Array<Record<string, unknown>>,
  motifs: Array<Record<string, unknown>>,
  appearances: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>,
  latestEp = 400,
) => ({ series: 'T', latestEp, amnesias, motifs, appearances, links });

const failCodes = (r: ReturnType<typeof evaluateAmnesiaMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAmnesiaMotifLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const ferris = { id: 'ferris', label: '圣诞摩天轮', kind: 'location' as const };
const ferrisApps = [
  { motifId: 'ferris', ep: 200, role: 'seed', visualState: '初遇摩天轮' },
  { motifId: 'ferris', ep: 280, role: 'echo', visualState: '陪伴回扣摩天轮剪影' },
  { motifId: 'ferris', ep: 320, role: 'echo', visualState: '失忆后同游' },
  { motifId: 'ferris', ep: 360, role: 'echo', visualState: '再经摩天轮广场' },
  { motifId: 'ferris', ep: 398, role: 'payoff', visualState: '圣诞对视唤回' },
];

const qiNan = {
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 268,
  plantCause: '爆炸',
  companionEps: [280, 320, 360],
  recoverEp: 398,
  recoverLabel: '圣诞摩天轮对视唤回往昔告白深吻',
  recoverTrigger: '圣诞摩天轮',
};

describe('evaluateAmnesiaMotifLink', () => {
  it('祁南：摩天轮 trigger=label 且 recover=payoff PASS；gates untouched', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        ferrisApps,
        [{ id: '唤回×摩天轮', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateAmnesiaMotifLink({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('duplicate link id → DUP_ID FAIL', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        ferrisApps,
        [
          { id: 'dup', amnesiaId: '祁南失忆', motifId: 'ferris' },
          { id: 'dup', amnesiaId: '祁南失忆', motifId: 'ferris' },
        ],
        399,
      ),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown amnesia / motif → UNKNOWN_* FAIL', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        ferrisApps,
        [
          { id: 'a', amnesiaId: '无', motifId: 'ferris' },
          { id: 'b', amnesiaId: '祁南失忆', motifId: 'ghost' },
        ],
        399,
      ),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_AMNESIA', 'UNKNOWN_MOTIF']));
  });

  it('recover without trigger → TRIGGER_MISSING FAIL', () => {
    const noTrig = { ...qiNan, recoverTrigger: undefined };
    const r = evaluateAmnesiaMotifLink(
      pack(
        [noTrig],
        [ferris],
        ferrisApps,
        [{ id: '无触', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(failCodes(r)).toContain('TRIGGER_MISSING');
  });

  it('trigger ≠ motif.label → TRIGGER_LABEL_MISMATCH FAIL', () => {
    const bad = { ...qiNan, recoverTrigger: '旧手表' };
    const r = evaluateAmnesiaMotifLink(
      pack(
        [bad],
        [ferris],
        ferrisApps,
        [{ id: '错标', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(failCodes(r)).toContain('TRIGGER_LABEL_MISMATCH');
  });

  it('recoverEp ≠ payoff.ep → EP_MISMATCH FAIL', () => {
    const earlyPay = [
      { motifId: 'ferris', ep: 200, role: 'seed' },
      { motifId: 'ferris', ep: 320, role: 'echo' },
      { motifId: 'ferris', ep: 350, role: 'payoff' },
    ];
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        earlyPay,
        [{ id: '错集', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('no seed before recover → NO_SEED_BEFORE_RECOVER FAIL', () => {
    const lateSeed = [
      { motifId: 'ferris', ep: 390, role: 'seed' },
      { motifId: 'ferris', ep: 395, role: 'echo' },
      { motifId: 'ferris', ep: 398, role: 'payoff' },
    ];
    // seed at 390 is still before recover 398 - need seed AFTER recover to fail
    const after = [
      { motifId: 'ferris', ep: 399, role: 'seed' },
      { motifId: 'ferris', ep: 399, role: 'echo' },
      { motifId: 'ferris', ep: 399, role: 'payoff' },
    ];
    // recover at 398, seed at 399 → NO_SEED_BEFORE_RECOVER; also child motif may fail
    const lateRecover = { ...qiNan, recoverEp: 398 };
    const r = evaluateAmnesiaMotifLink(
      pack(
        [lateRecover],
        [ferris],
        [
          { motifId: 'ferris', ep: 399, role: 'seed', visualState: '晚种' },
          { motifId: 'ferris', ep: 399, role: 'echo' },
          { motifId: 'ferris', ep: 399, role: 'payoff' },
        ],
        [{ id: '晚种', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(failCodes(r)).toContain('NO_SEED_BEFORE_RECOVER');
  });

  it('payoff without recover → PAYOFF_WITHOUT_RECOVER FAIL', () => {
    const pending = {
      id: '未唤回',
      actor: '祁南',
      plantEp: 268,
      companionEps: [280],
    };
    const r = evaluateAmnesiaMotifLink(
      pack(
        [pending],
        [ferris],
        ferrisApps,
        [{ id: '有扣无唤', amnesiaId: '未唤回', motifId: 'ferris' }],
        399,
      ),
    );
    expect(failCodes(r)).toContain('PAYOFF_WITHOUT_RECOVER');
  });

  it('both pending with enough echoes → PENDING_PAIR WARN only', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [{ id: '蓄', actor: 'A', plantEp: 10, companionEps: [12] }],
        [{ id: 'm', label: '旧物', kind: 'prop' }],
        [
          { motifId: 'm', ep: 5, role: 'seed' },
          { motifId: 'm', ep: 8, role: 'echo' },
          { motifId: 'm', ep: 9, role: 'echo' },
        ],
        [{ id: '蓄势', amnesiaId: '蓄', motifId: 'm' }],
        20,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('child amnesia FAIL bubbles CHILD_AMNESIA_FAIL', () => {
    const bad = {
      id: '坏弧',
      actor: 'A',
      plantEp: 10,
      recoverEp: 5,
      recoverLabel: '早唤',
      recoverTrigger: '圣诞摩天轮',
    };
    const r = evaluateAmnesiaMotifLink(
      pack(
        [bad],
        [ferris],
        [
          { motifId: 'ferris', ep: 1, role: 'seed' },
          { motifId: 'ferris', ep: 3, role: 'echo' },
          { motifId: 'ferris', ep: 5, role: 'payoff' },
        ],
        [{ id: 'l', amnesiaId: '坏弧', motifId: 'ferris' }],
        20,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_AMNESIA_FAIL');
  });

  it('child motif FAIL bubbles CHILD_MOTIF_FAIL', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        [{ motifId: 'ferris', ep: 398, role: 'payoff' }], // no seed → CHILD
        [{ id: 'l', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_MOTIF_FAIL');
  });
  it('companionEp without motif echo → COMPANION_WITHOUT_ECHO WARN still PASS', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        [
          { motifId: 'ferris', ep: 200, role: 'seed', visualState: '初遇' },
          { motifId: 'ferris', ep: 320, role: 'echo', visualState: '同游' },
          { motifId: 'ferris', ep: 398, role: 'payoff', visualState: '唤回' },
        ],
        [{ id: '唤回×摩天轮', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        399,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('COMPANION_WITHOUT_ECHO');
  });

  it('echo after recover → ECHO_AFTER_RECOVER FAIL', () => {
    const r = evaluateAmnesiaMotifLink(
      pack(
        [qiNan],
        [ferris],
        [
          ...ferrisApps,
          { motifId: 'ferris', ep: 399, role: 'echo', visualState: '唤回后又来一次' },
        ],
        [{ id: '唤回×摩天轮', amnesiaId: '祁南失忆', motifId: 'ferris' }],
        400,
      ),
    );
    expect(failCodes(r)).toContain('ECHO_AFTER_RECOVER');
  });

});
