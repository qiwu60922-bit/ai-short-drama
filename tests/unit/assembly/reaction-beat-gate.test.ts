/**
 * V12 Reaction Beat Gate — 天幕式反应镜, offline, ≠Final ≠G3.
 * Reverse-engineered (public text/structure only) from 《天幕直播》反应镜放大情绪 (2026-10-15 leftover).
 */
import { describe, expect, it } from 'vitest';
import { evaluateReactionBeats, REACTION_BEAT_DEFAULTS } from '@/agents/assembly/reaction-beat-gate';
import { BEAT_ROLES } from '@/agents/assembly/hook-structure-gate';

type S = { durSec: number; beatRole?: string };
const spec = (shots: S[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});
const failCodes = (r: ReturnType<typeof evaluateReactionBeats>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateReactionBeats>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateReactionBeats', () => {
  it('exposes defaults and reaction is in BEAT_ROLES', () => {
    expect(REACTION_BEAT_DEFAULTS).toEqual({
      reactionWindowSec: 8,
      lookbackSec: 12,
      requireReaction: false,
    });
    expect(BEAT_ROLES).toContain('reaction');
  });

  it('reversal followed by reaction within window → PASS', () => {
    const r = evaluateReactionBeats(
      spec([
        { durSec: 3, beatRole: 'hook' },
        { durSec: 6, beatRole: 'setup' },
        { durSec: 6, beatRole: 'reversal' },
        { durSec: 3, beatRole: 'reaction' },
        { durSec: 6, beatRole: 'cliffhanger' },
        { durSec: 2, beatRole: 'reaction' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics).toMatchObject({ turnShots: 2, reactionShots: 2, missingAfterTurn: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('reversal with no reaction → REACTION_MISSING WARN by default', () => {
    const r = evaluateReactionBeats(
      spec([
        { durSec: 3, beatRole: 'hook' },
        { durSec: 10, beatRole: 'reversal' },
        { durSec: 10, beatRole: 'setup' },
        { durSec: 5, beatRole: 'cliffhanger' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('REACTION_MISSING');
    expect(r.metrics.missingAfterTurn).toBeGreaterThan(0);
  });

  it('requireReaction upgrades missing to FAIL', () => {
    const r = evaluateReactionBeats(
      spec([
        { durSec: 3, beatRole: 'hook' },
        { durSec: 10, beatRole: 'reversal' },
        { durSec: 10, beatRole: 'setup' },
      ]),
      { requireReaction: true },
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('REACTION_MISSING');
  });

  it('reaction with no prior turn → REACTION_ORPHAN WARN', () => {
    const r = evaluateReactionBeats(
      spec([
        { durSec: 3, beatRole: 'reaction' },
        { durSec: 3, beatRole: 'hook' },
        { durSec: 6, beatRole: 'setup' },
        { durSec: 6, beatRole: 'cliffhanger' },
        { durSec: 2, beatRole: 'reaction' },
      ]),
    );
    expect(warnCodes(r)).toContain('REACTION_ORPHAN');
  });

  it('invalid beatRole → INVALID_ROLE FAIL', () => {
    const r = evaluateReactionBeats(spec([{ durSec: 3, beatRole: 'nope' }]));
    expect(failCodes(r)).toContain('INVALID_ROLE');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateReactionBeats({ episode: 'T' });
    expect(failCodes(r)).toEqual(['SCHEMA']);
  });
});
