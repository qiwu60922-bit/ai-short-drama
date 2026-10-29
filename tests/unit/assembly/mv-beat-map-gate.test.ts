/**
 * V12 MV Beat-Map — 分镜拍点映射, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMvBeatMap } from '@/agents/assembly/mv-beat-map-gate';

const shot = (partial: Record<string, unknown>) => ({
  no: '1',
  start: 0,
  end: 2,
  dur: 2,
  section: 'intro',
  lyric: '',
  shot: 'MS',
  angle: 'eye',
  subject: 'hero',
  move: 'static',
  trans: 'cut',
  beat: '1',
  asset: 'A1',
  ...partial,
});

const good = () => ({
  fps: 24,
  shots: [
    shot({ no: '1', start: 0, end: 2, dur: 2, section: 'intro', beat: '1', shot: 'ELS' }),
    shot({ no: '2', start: 2, end: 4, dur: 2, section: 'verse', beat: '2', shot: 'MS' }),
    shot({ no: '3', start: 4, end: 5, dur: 1, section: 'verse', beat: '3', shot: 'CU' }),
    shot({ no: '4', start: 5, end: 7, dur: 2, section: 'chorus', beat: '4', shot: 'MCU' }),
    shot({ no: '5', start: 7, end: 10, dur: 3, section: 'outro', beat: '5', shot: 'ELS' }),
  ],
});

const failCodes = (r: ReturnType<typeof evaluateMvBeatMap>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMvBeatMap>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMvBeatMap', () => {
  it('mapped beats → PASS', () => {
    const r = evaluateMvBeatMap(good());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.shotsWithBeat).toBe(5);
    expect(r.metrics.distinctBeats).toBeGreaterThanOrEqual(4);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('empty beat → BEAT_EMPTY', () => {
    const doc = good();
    doc.shots[1] = shot({ no: '2', start: 2, end: 4, dur: 2, section: 'verse', beat: '', shot: 'MS' });
    expect(failCodes(evaluateMvBeatMap(doc))).toContain('BEAT_EMPTY');
  });

  it('monotone beat → BEAT_MONOTONE WARN', () => {
    const doc = good();
    for (const s of doc.shots) (s as { beat: string }).beat = '1';
    const r = evaluateMvBeatMap(doc);
    expect(warnCodes(r)).toContain('BEAT_MONOTONE');
    expect(r.verdict).toBe('PASS');
  });

  it('schema fail bubbles', () => {
    expect(failCodes(evaluateMvBeatMap({ shots: [] }))).toContain('SCHEMA');
  });
});
