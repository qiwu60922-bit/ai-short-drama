/**
 * V12 SSC Preflight Gate — offline deterministic QC (人物数量锁·XYZ·冻结前资产·Panel9衔接).
 * Rules adapted (MIT) from yzsp-studio/ssc SKILL.md §3 + references/08-QC. ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateSscPreflight } from '@/agents/assembly/ssc-preflight-gate';

type Row = Record<string, unknown>;

const baseAssets = {
  storyboardSummary: true,
  sceneSchedule: true,
  spaceTruth: true,
  visualAssets: true,
  stageMap: true,
};

const healthy = (extra: Row = {}): Row => ({
  videoTaskId: 'VT-01',
  stage: 'B5',
  a0Present: true,
  assets: { ...baseAssets, storyboardGrid: true },
  a3CompletionStatus: 'PASS',
  pendingAssets: [],
  allowedVisibleCharacters: ['林晓', '陈墨'],
  panels: [
    {
      index: 1,
      visibleCharacters: ['林晓'],
      characters: [{ id: '林晓', stagePositionXy: { x: 0.2, y: 0.5 }, stagePositionXyz: { x: 0.2, y: 0.5, z: 0 } }],
      props: [{ id: 'desk', stagePositionXy: { x: 0.5, y: 0.8 } }],
    },
    {
      index: 9,
      visibleCharacters: ['林晓', '陈墨'],
      characters: [
        { id: '林晓', stagePositionXyz: { x: 0.3, y: 0.4, z: 1 } },
        { id: '陈墨', stagePositionXy: { x: 0.7, y: 0.4 } },
      ],
    },
  ],
  characterShapeColorMap: { 林晓: 'red-square', 陈墨: 'orange-square' },
  propShapeColorMap: { desk: 'red-circle' },
  panel9ContinuityHandoff: { rolePositions: { 林晓: 'L' }, eyeline: 'right', props: {}, camera: 'MCU' },
  nextPanel1ContinuityStart: { rolePositions: { 林晓: 'L' }, eyeline: 'right', props: {}, camera: 'MCU' },
  ...extra,
});

const codes = (r: ReturnType<typeof evaluateSscPreflight>, sev?: 'FAIL' | 'WARN') =>
  r.findings.filter((x) => !sev || x.severity === sev).map((x) => x.code);

describe('evaluateSscPreflight', () => {
  it('PASS on a healthy B5 payload; gates stay NOT_EVALUATED; metrics counted', () => {
    const r = evaluateSscPreflight(healthy());
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.metrics).toMatchObject({
      panelCount: 2,
      allowedCount: 2,
      findingCounts: { FAIL: 0, WARN: 0 },
    });
  });

  it('SCHEMA FAIL on malformed input', () => {
    expect(codes(evaluateSscPreflight(null))).toEqual(['SCHEMA']);
    expect(codes(evaluateSscPreflight({ videoTaskId: 'x' }))).toEqual(['SCHEMA']);
    expect(codes(evaluateSscPreflight(healthy({ stage: 'Z9' })))).toEqual(['SCHEMA']);
    expect(evaluateSscPreflight({}).verdict).toBe('FAIL');
  });

  it('E01_MISSING_ASSETS FAIL when a0 missing or stage assets incomplete', () => {
    expect(codes(evaluateSscPreflight(healthy({ a0Present: false })), 'FAIL')).toContain('E01_MISSING_ASSETS');
    const a5Missing = healthy({
      stage: 'A5',
      assets: { ...baseAssets, storyboardSummary: false },
      characterShapeColorMap: { 林晓: 'red-square' },
      propShapeColorMap: { desk: 'red-circle' },
      panel9ContinuityHandoff: undefined,
      nextPanel1ContinuityStart: undefined,
    });
    delete a5Missing.panel9ContinuityHandoff;
    delete a5Missing.nextPanel1ContinuityStart;
    expect(codes(evaluateSscPreflight(a5Missing), 'FAIL')).toContain('E01_MISSING_ASSETS');

    const b5NoGrid = healthy({ assets: { ...baseAssets } });
    expect(codes(evaluateSscPreflight(b5NoGrid), 'FAIL')).toContain('E01_MISSING_ASSETS');
  });

  it('E14_PENDING_AS_PASS FAIL on pending/unknown/none/empty status or non-empty pendingAssets', () => {
    for (const status of ['PENDING', 'UNKNOWN', 'NONE', '']) {
      expect(codes(evaluateSscPreflight(healthy({ a3CompletionStatus: status })), 'FAIL')).toContain('E14_PENDING_AS_PASS');
    }
    expect(codes(evaluateSscPreflight(healthy({ pendingAssets: ['char-sheet'] })), 'FAIL')).toContain('E14_PENDING_AS_PASS');
  });

  it('E05_SPATIAL FAIL when provided coordinates are bare numbers/arrays/strings/missing keys', () => {
    const bad = healthy({
      panels: [
        {
          index: 1,
          visibleCharacters: ['林晓'],
          characters: [{ id: '林晓', stagePositionXy: [0.2, 0.5] }],
        },
      ],
    });
    expect(codes(evaluateSscPreflight(bad), 'FAIL')).toContain('E05_SPATIAL');

    const bare = healthy({
      panels: [
        {
          index: 1,
          visibleCharacters: ['林晓'],
          characters: [{ id: '林晓', stagePositionXyz: '0,0,1' }],
        },
      ],
    });
    expect(codes(evaluateSscPreflight(bare), 'FAIL')).toContain('E05_SPATIAL');

    const missingKey = healthy({
      panels: [
        {
          index: 1,
          visibleCharacters: ['林晓'],
          characters: [{ id: '林晓', stagePositionXy: { x: 0.2 } }],
        },
      ],
    });
    expect(codes(evaluateSscPreflight(missingKey), 'FAIL')).toContain('E05_SPATIAL');
  });

  it('E15_CHARACTER_COUNT FAIL for unknown names, count over allowed, or empty allow-list with visible people', () => {
    const unknown = healthy({
      panels: [{ index: 1, visibleCharacters: ['林晓', '陌生人'] }],
    });
    expect(codes(evaluateSscPreflight(unknown), 'FAIL')).toContain('E15_CHARACTER_COUNT');

    const over = healthy({
      allowedVisibleCharacters: ['林晓'],
      panels: [{ index: 1, visibleCharacters: ['林晓', '陈墨'] }],
    });
    expect(codes(evaluateSscPreflight(over), 'FAIL')).toContain('E15_CHARACTER_COUNT');

    const emptyAllowed = healthy({
      allowedVisibleCharacters: [],
      panels: [{ index: 1, visibleCharacters: ['林晓'] }],
    });
    expect(codes(evaluateSscPreflight(emptyAllowed), 'FAIL')).toContain('E15_CHARACTER_COUNT');
  });

  it('E13_SHAPE_COLOR: A5 WARN vs B5/B8 FAIL when maps missing or empty', () => {
    const a5 = healthy({
      stage: 'A5',
      assets: { ...baseAssets },
      characterShapeColorMap: null,
      propShapeColorMap: null,
      panel9ContinuityHandoff: undefined,
      nextPanel1ContinuityStart: undefined,
    });
    delete a5.panel9ContinuityHandoff;
    delete a5.nextPanel1ContinuityStart;
    const a5r = evaluateSscPreflight(a5);
    expect(codes(a5r, 'WARN')).toContain('E13_SHAPE_COLOR');
    expect(codes(a5r, 'FAIL')).not.toContain('E13_SHAPE_COLOR');
    expect(a5r.verdict).toBe('PASS');

    const b5 = healthy({ characterShapeColorMap: {}, propShapeColorMap: { desk: 'red-circle' } });
    expect(codes(evaluateSscPreflight(b5), 'FAIL')).toContain('E13_SHAPE_COLOR');
    expect(evaluateSscPreflight(b5).verdict).toBe('FAIL');
  });

  it('PANEL9_HANDOFF: skip when both continuity fields omitted; FAIL on empty/mismatch; PASS when keys align', () => {
    const skip = healthy({
      panel9ContinuityHandoff: undefined,
      nextPanel1ContinuityStart: undefined,
    });
    delete skip.panel9ContinuityHandoff;
    delete skip.nextPanel1ContinuityStart;
    expect(codes(evaluateSscPreflight(skip))).not.toContain('PANEL9_HANDOFF');

    const emptyHandoff = healthy({
      panel9ContinuityHandoff: null,
      nextPanel1ContinuityStart: { rolePositions: {}, eyeline: 'L', props: {}, camera: 'WS' },
    });
    expect(codes(evaluateSscPreflight(emptyHandoff), 'FAIL')).toContain('PANEL9_HANDOFF');

    const mismatch = healthy({
      panel9ContinuityHandoff: { rolePositions: {}, eyeline: 'L' },
      nextPanel1ContinuityStart: { rolePositions: {}, eyeline: 'L', props: {}, camera: 'WS' },
    });
    expect(codes(evaluateSscPreflight(mismatch), 'FAIL')).toContain('PANEL9_HANDOFF');

    const ok = evaluateSscPreflight(healthy());
    expect(codes(ok)).not.toContain('PANEL9_HANDOFF');
    expect(ok.verdict).toBe('PASS');
  });

  it('gates are always NOT_EVALUATED even on FAIL', () => {
    const r = evaluateSscPreflight(null);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.verdict).toBe('FAIL');
  });
});
