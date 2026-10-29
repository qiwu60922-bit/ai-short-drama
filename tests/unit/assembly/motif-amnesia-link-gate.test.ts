/**
 * V12 Motif×Amnesia Link — 母题×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifAmnesiaLink } from '@/agents/assembly/motif-amnesia-link-gate';

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

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 399,
  motifs: [ferris],
  appearances: ferrisApps,
  amnesias: [qiNan],
  links: [{ id: '唤回×摩天轮', motifId: 'ferris', amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifAmnesiaLink', () => {
  it('motif payoff ↔ recover → PASS', () => {
    const r = evaluateMotifAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / MOTIF_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateMotifAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifAmnesiaLink(pack({ links: [] })))).toContain(
      'MOTIF_WITHOUT_AMNESIA',
    );
  });
});
