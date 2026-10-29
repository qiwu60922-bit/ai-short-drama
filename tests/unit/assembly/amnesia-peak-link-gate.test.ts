/**
 * V12 Amnesia×Peak Link — 失忆唤回 × 巅峰兑现, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaPeakLink } from '@/agents/assembly/amnesia-peak-link-gate';

const amnesia = {
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 1,
  plantCause: '爆炸',
  companionEps: [2, 4, 6],
  recoverEp: 8,
  recoverLabel: '摩天轮唤回',
  recoverTrigger: '圣诞摩天轮',
};

const peak = {
  id: '告白巅峰',
  openEp: 1,
  peakEp: 8,
  peakLabel: '摩天轮对峙',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  amnesias: [amnesia],
  peaks: [peak],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', peakId: '告白巅峰' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAmnesiaPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAmnesiaPeakLink', () => {
  it('recover at peak → PASS', () => {
    const r = evaluateAmnesiaPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / recover mismatch / peak without link', () => {
    expect(failCodes(evaluateAmnesiaPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaPeakLink(
          pack({
            links: [
              { id: 'd', amnesiaId: '祁南失忆', peakId: '告白巅峰' },
              { id: 'd', amnesiaId: '祁南失忆', peakId: '告白巅峰' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateAmnesiaPeakLink(
          pack({
            amnesias: [{ ...amnesia, recoverEp: 7, recoverLabel: '早唤回' }],
          }),
        ),
      ),
    ).toContain('RECOVER_NOT_AT_PEAK');
    expect(failCodes(evaluateAmnesiaPeakLink(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_AMNESIA',
    );
  });

  it('orphan amnesia → PENDING_AMNESIA WARN', () => {
    const r = evaluateAmnesiaPeakLink(
      pack({
        amnesias: [
          amnesia,
          {
            id: '旁路',
            actor: '乙',
            plantEp: 2,
            companionEps: [3],
            recoverEp: 8,
            recoverLabel: '旁路唤回',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_AMNESIA');
    expect(r.verdict).toBe('PASS');
  });
});
