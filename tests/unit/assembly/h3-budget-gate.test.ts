/**
 * V12 H3 Budget Gate — offline H3 成本方案·分层2K·渠道对比.
 * Method rewritten (MIT) from unrealinux/minimax-h3-budget-video
 * scripts/cost_calc.py + prices.json (2026-10-27):
 * https://github.com/unrealinux/minimax-h3-budget-video
 * ≠Final ≠G3. No MiniMax / paid API / network.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_H3_PRICES,
  evaluateH3Budget,
  type H3BudgetReport,
} from '@/agents/assembly/h3-budget-gate';

const failCodes = (r: H3BudgetReport) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: H3BudgetReport) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function scenarioCny(r: H3BudgetReport, name: string): number | undefined {
  return r.metrics.scenarios.find((s) => s.name === name)?.cny;
}

describe('evaluateH3Budget', () => {
  it('golden finals=30 drafts=30 upgrade=6 → PASS; scenarios match source formula', () => {
    const r = evaluateH3Budget({
      finals: 30,
      seconds: 5,
      drafts: 30,
      upgrade: 6,
    });
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.metrics.baselineAll2k).toBeCloseTo(120, 5);
    expect(r.metrics.inputVideoCost).toBeCloseTo(0, 5);
    expect(scenarioCny(r, '全量 2K（直接生成）')).toBeCloseTo(120, 5);
    expect(scenarioCny(r, '全量 768P（后期超分）')).toBeCloseTo(75, 5);
    expect(scenarioCny(r, '分层：768P 打底 + 选择性 2K')).toBeCloseTo(84, 5);
    expect(scenarioCny(r, '草稿优先：480P 试错 + 768P 定稿 + 选择性 2K')).toBeCloseTo(
      108,
      5,
    );
    expect(scenarioCny(r, 'fal Turbo（768P，美元结算）')).toBeCloseTo(26.8125, 5);
    expect(scenarioCny(r, '混渠道：fal 出 768P + 官方升级 2K')).toBeCloseTo(35.8125, 5);
    expect(scenarioCny(r, 'Replicate 2K（美元结算）')).toBeCloseTo(139.425, 5);
    expect(r.metrics.scenarios).toHaveLength(7);
    expect(r.metrics.cheapestScenario?.name).toBe('fal Turbo（768P，美元结算）');
    expect(r.metrics.cheapestScenario?.cny).toBeCloseTo(26.8125, 5);
    expect(DEFAULT_H3_PRICES.usd_to_cny).toBe(7.15);
    expect(DEFAULT_H3_PRICES.updated).toBe('2026-10-27');
  });

  it('finals=12 no drafts → PASS; 6 scenarios (no draft-first)', () => {
    const r = evaluateH3Budget({ finals: 12, seconds: 5 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.baselineAll2k).toBeCloseTo(48, 5);
    expect(r.metrics.scenarios).toHaveLength(6);
    expect(scenarioCny(r, '草稿优先：480P 试错 + 768P 定稿 + 选择性 2K')).toBeUndefined();
    expect(scenarioCny(r, 'fal Turbo（768P，美元结算）')).toBeCloseTo(10.725, 5);
    expect(scenarioCny(r, 'Replicate 2K（美元结算）')).toBeCloseTo(55.77, 5);
    expect(warnCodes(r)).toEqual([]);
  });

  it('defaults: seconds=5, drafts=0, upgrade=0, inputVideoSeconds=0', () => {
    const r = evaluateH3Budget({ finals: 10 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.seconds).toBe(5);
    expect(r.metrics.drafts).toBe(0);
    expect(r.metrics.upgrade).toBe(0);
    expect(r.metrics.inputVideoSeconds).toBe(0);
    expect(r.metrics.baselineAll2k).toBeCloseTo(40, 5);
  });

  it('input video seconds counted into all official scenarios', () => {
    const r = evaluateH3Budget({
      finals: 10,
      seconds: 5,
      inputVideoSeconds: 3,
      inputModel: 'h3',
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.inputVideoCost).toBeCloseTo(15, 5);
    expect(r.metrics.baselineAll2k).toBeCloseTo(55, 5);
    expect(scenarioCny(r, '全量 768P（后期超分）')).toBeCloseTo(40, 5); // 25+15
    // fal/replicate do NOT add input_cost in source
    expect(scenarioCny(r, 'fal Turbo（768P，美元结算）')).toBeCloseTo(8.9375, 5);
    expect(warnCodes(r)).toContain('INPUT_VIDEO_COSTLY');
  });

  it('inputModel=max uses input_video_max_768 rate', () => {
    const r = evaluateH3Budget({
      finals: 2,
      seconds: 5,
      inputVideoSeconds: 1,
      inputModel: 'max',
    });
    expect(r.metrics.inputVideoCost).toBeCloseTo(1 * 0.97 * 2, 5);
  });

  it('falMode=ref uses fal_turbo_ref for mixed channel', () => {
    const r = evaluateH3Budget({
      finals: 10,
      seconds: 5,
      upgrade: 2,
      falMode: 'ref',
    });
    // mixed = 10*5*0.05*7.15 + 2*5*0.3 = 17.875 + 3 = 20.875
    expect(scenarioCny(r, '混渠道：fal 出 768P + 官方升级 2K')).toBeCloseTo(20.875, 5);
  });

  it('upgrade > finals → UPGRADE_GT_FINALS FAIL', () => {
    const r = evaluateH3Budget({ finals: 5, upgrade: 6 });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UPGRADE_GT_FINALS');
  });

  it('schema garbage / missing finals → SCHEMA or FINALS_REQUIRED FAIL', () => {
    expect(failCodes(evaluateH3Budget(null))).toContain('SCHEMA');
    expect(failCodes(evaluateH3Budget({ nope: true }))).toContain('FINALS_REQUIRED');
    expect(failCodes(evaluateH3Budget({}))).toContain('FINALS_REQUIRED');
  });

  it('finals <= 0 or non-integer → FINALS_INVALID FAIL', () => {
    expect(failCodes(evaluateH3Budget({ finals: 0 }))).toContain('FINALS_INVALID');
    expect(failCodes(evaluateH3Budget({ finals: -3 }))).toContain('FINALS_INVALID');
    expect(failCodes(evaluateH3Budget({ finals: 1.5 }))).toContain('FINALS_INVALID');
  });

  it('seconds <= 0 → SECONDS_INVALID FAIL', () => {
    expect(failCodes(evaluateH3Budget({ finals: 3, seconds: 0 }))).toContain(
      'SECONDS_INVALID',
    );
    expect(failCodes(evaluateH3Budget({ finals: 3, seconds: -1 }))).toContain(
      'SECONDS_INVALID',
    );
  });

  it('negative drafts / inputVideoSeconds → DRAFTS_INVALID / INPUT_VIDEO_INVALID', () => {
    expect(failCodes(evaluateH3Budget({ finals: 3, drafts: -1 }))).toContain(
      'DRAFTS_INVALID',
    );
    expect(
      failCodes(evaluateH3Budget({ finals: 3, inputVideoSeconds: -0.5 })),
    ).toContain('INPUT_VIDEO_INVALID');
  });

  it('0 < drafts < finals → DRAFTS_LT_FINALS WARN (still PASS)', () => {
    const r = evaluateH3Budget({ finals: 10, drafts: 3, upgrade: 1 });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('DRAFTS_LT_FINALS');
  });

  it('upgrade === finals → ALL_UPGRADE_NO_SAVE WARN', () => {
    const r = evaluateH3Budget({ finals: 8, upgrade: 8 });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('ALL_UPGRADE_NO_SAVE');
    // staged == all_2k when upgrade==finals: 8*5*0.5 + 8*5*0.3 = 20+12=32; all2k=32
    expect(scenarioCny(r, '分层：768P 打底 + 选择性 2K')).toBeCloseTo(
      r.metrics.baselineAll2k,
      5,
    );
  });

  it('input.prices override default table', () => {
    const r = evaluateH3Budget({
      finals: 2,
      seconds: 5,
      prices: {
        official_cny: { h3_2k: 1.0 },
      },
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.baselineAll2k).toBeCloseTo(10, 5); // 2*5*1.0
  });
});
