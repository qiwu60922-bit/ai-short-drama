/**
 * V12 Foreshadow×Peak Link — 伏笔回收 × 巅峰兑现, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowPeakLink } from '@/agents/assembly/foreshadow-peak-link-gate';

const item = {
  id: '伪人身份',
  name: '预言家真伪',
  priority: 'S' as const,
  plantEp: 1,
  status: 'closed' as const,
  payoffEp: 8,
  lastAdvancedEp: 4,
};

const peak = {
  id: '身份对峙',
  openEp: 1,
  peakEp: 8,
  peakLabel: '揭伪人对峙',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  items: [item],
  peaks: [peak],
  links: [{ id: 'L1', foreshadowId: '伪人身份', peakId: '身份对峙' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateForeshadowPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateForeshadowPeakLink', () => {
  it('payoff at peak → PASS', () => {
    const r = evaluateForeshadowPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / not at peak', () => {
    expect(failCodes(evaluateForeshadowPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowPeakLink(
          pack({
            links: [
              { id: 'd', foreshadowId: '伪人身份', peakId: '身份对峙' },
              { id: 'd', foreshadowId: '伪人身份', peakId: '身份对峙' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateForeshadowPeakLink(
          pack({
            items: [{ ...item, payoffEp: 7 }],
          }),
        ),
      ),
    ).toContain('PAYOFF_NOT_AT_PEAK');
  });

  it('peak without link → PEAK_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateForeshadowPeakLink(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_FORESHADOW',
    );
  });

  it('orphan foreshadow → PENDING_FORESHADOW WARN', () => {
    const r = evaluateForeshadowPeakLink(
      pack({
        items: [
          item,
          {
            id: '旁路',
            name: '旁路伏笔',
            priority: 'A' as const,
            plantEp: 2,
            status: 'closed' as const,
            payoffEp: 8,
            lastAdvancedEp: 3,
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_FORESHADOW');
    expect(r.verdict).toBe('PASS');
  });
});
