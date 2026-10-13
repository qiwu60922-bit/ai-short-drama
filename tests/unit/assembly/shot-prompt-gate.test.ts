/**
 * V12 Shot Prompt Gate — per-shot pre-generation check of the prompt actually sent to H3. Offline. ≠Final ≠G3.
 * Ideas adapted (MIT) from:
 *  - 2395300049-sys/anti-prompt scripts/check_prompt_gates.py (1900/2000 字闸门, 流程管理违禁词, 台词 5字/秒+停顿估时)
 *  - workerpro666-ctrl/aigc-director-five-lines SKILL.md (动作/情绪/摄影/视觉/剪辑 五线完整度验收)
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateShotPrompts, speechUnits, DEFAULT_PROCESS_TERMS } from '@/agents/assembly/shot-prompt-gate';

type S = Record<string, unknown> & { durSec: number };
const full = (extra: Partial<S> = {}): S => ({
  durSec: 6, camera: 'MS 主角左后方腰高，缓推', action: '祁夜推开门', emotion: '警惕→震惊', visual: '冷蓝月光，雾', cutMotive: '视线引导', cast: ['qi-ye'], ...extra,
});
const spec = (shots: S[]) => ({ episode: 'T', shots: shots.map((s, i) => ({ shotId: `S${i + 1}`, cast: [], ...s })) });
const codes = (r: ReturnType<typeof evaluateShotPrompts>, sev?: 'FAIL' | 'WARN') =>
  r.findings.filter((f) => !sev || f.severity === sev).map((f) => f.code);

describe('speechUnits', () => {
  it('counts CJK chars one each, latin words one each, ignores punctuation', () => {
    expect(speechUnits('这破学校……停电？')).toBe(6);
    expect(speechUnits('Who is there?')).toBe(3);
    expect(speechUnits('——！？…… ')).toBe(0);
    expect(speechUnits(null)).toBe(0);
  });
});

describe('evaluateShotPrompts', () => {
  it('PASS on a complete, comfortably paced shot list; gates stay NOT_EVALUATED', () => {
    const r = evaluateShotPrompts(spec([full({ dialogue: '谁在上面？' }), full()]));
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.shots[0]).toMatchObject({ shotId: 'S1', speechUnits: 4 });
    expect(r.shots[0].promptChars).toBeGreaterThan(0);
  });

  it('SCHEMA FAIL on malformed input', () => {
    const r = evaluateShotPrompts({ episode: 'T', shots: [] });
    expect(r.verdict).toBe('FAIL');
    expect(codes(r)).toEqual(['SCHEMA']);
  });

  it('PROMPT_HARD_LIMIT FAIL above 2000 chars, PROMPT_NEAR_LIMIT WARN in 1901–2000', () => {
    const hard = evaluateShotPrompts(spec([full({ action: '走'.repeat(2100) })]));
    expect(codes(hard, 'FAIL')).toContain('PROMPT_HARD_LIMIT');
    const near = evaluateShotPrompts(spec([full({ action: '走'.repeat(1880) })]));
    expect(near.verdict).toBe('PASS');
    expect(codes(near, 'WARN')).toContain('PROMPT_NEAR_LIMIT');
  });

  it('counts hardBans into the prompt length (gates what is actually sent)', () => {
    const r = evaluateShotPrompts(spec([full({ action: '走'.repeat(1850) })]), { hardBans: ['禁'.repeat(200)] });
    expect(codes(r, 'FAIL')).toContain('PROMPT_HARD_LIMIT');
  });

  it('PROCESS_TERM FAIL when a process-management phrase leaks into the prompt', () => {
    expect(DEFAULT_PROCESS_TERMS).toContain('接下一段');
    const r = evaluateShotPrompts(spec([full({ action: '祁夜推门，接下一段' })]));
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.find((f) => f.code === 'PROCESS_TERM')?.shotIds).toEqual(['S1']);
  });

  it('DIALOGUE_TOO_FAST FAIL above 6 units/sec; DIALOGUE_TIGHT WARN when 5/s + 1s pause exceeds the shot', () => {
    const fast = evaluateShotPrompts(spec([full({ durSec: 2, dialogue: '你到底是谁为什么在这里出现' })])); // 13 units / 2s
    expect(codes(fast, 'FAIL')).toContain('DIALOGUE_TOO_FAST');
    const tight = evaluateShotPrompts(spec([full({ durSec: 3, dialogue: '你到底是谁为什么在' })])); // 9/5+1 = 2.8 ≤ 3 → ok
    expect(codes(tight)).not.toContain('DIALOGUE_TIGHT');
    const tight2 = evaluateShotPrompts(spec([full({ durSec: 3, dialogue: ['你到底是谁', '为什么在这'] })])); // 10/5+1 = 3 → ok
    expect(codes(tight2)).not.toContain('DIALOGUE_TIGHT');
    const tight3 = evaluateShotPrompts(spec([full({ durSec: 3, dialogue: '你到底是谁', vo: '为什么在这里' })])); // 11/5+1=3.2 > 3, 3.67/s ≤ 6
    expect(tight3.verdict).toBe('PASS');
    expect(codes(tight3, 'WARN')).toContain('DIALOGUE_TIGHT');
  });

  it('FIVE_LINES_MISSING is WARN by default and FAIL in strict mode; first shot exempt from 剪辑线', () => {
    const shots = [full({ cutMotive: undefined }), full({ emotion: undefined, visual: undefined })];
    const r = evaluateShotPrompts(spec(shots));
    expect(r.verdict).toBe('PASS');
    const f = r.findings.find((x) => x.code === 'FIVE_LINES_MISSING')!;
    expect(f.severity).toBe('WARN');
    expect(f.shotIds).toEqual(['S2']);
    expect(r.shots[1].missingLines).toEqual(['情绪', '视觉']);
    expect(r.shots[0].missingLines).toEqual([]);
    const strict = evaluateShotPrompts(spec(shots), { strictFiveLines: true });
    expect(strict.verdict).toBe('FAIL');
  });

  it('accepts existing ShotSpec fields as line evidence: state→情绪, refs/primaryRef→视觉', () => {
    const r = evaluateShotPrompts(spec([full({ emotion: undefined, visual: undefined, state: 'S3-受伤', refs: ['scene-ep01-s01'] })]));
    expect(r.shots[0].missingLines).toEqual([]);
  });

  it('runs on the real EP01 v2 ShotSpec when present (no PASS is invented for G3)', () => {
    let raw: unknown;
    try { raw = JSON.parse(readFileSync(resolve('/workspace/v11/wave14/ep01/shots/SHOT_SPEC.json'), 'utf8')); } catch { return; }
    const r = evaluateShotPrompts(raw);
    expect(r.shots).toHaveLength(16);
    expect(codes(r, 'FAIL')).not.toContain('SCHEMA');
    expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });
});
