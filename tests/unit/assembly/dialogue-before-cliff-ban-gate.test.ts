/**
 * V12 Dialogue-Before-Cliff Ban — 悬念前禁对白, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateDialogueBeforeCliffBan } from '@/agents/assembly/dialogue-before-cliff-ban-gate';

type S = {
  durSec: number;
  beatRole?: string;
  action?: string;
  dialogue?: string;
};
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const failCodes = (r: ReturnType<typeof evaluateDialogueBeforeCliffBan>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateDialogueBeforeCliffBan', () => {
  it('reaction then cliff, no prior dialogue → PASS', () => {
    const r = evaluateDialogueBeforeCliffBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 4, beatRole: 'cliffhanger', action: '门外脚步' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.dialogueBeforeCliffShots).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('dialogue in lookback before cliff → DIALOGUE_BEFORE_CLIFF', () => {
    expect(
      failCodes(
        evaluateDialogueBeforeCliffBan(
          spec([
            { durSec: 2, beatRole: 'hook', action: '开场' },
            { durSec: 4, beatRole: 'increment', action: '追问' },
            {
              durSec: 3,
              beatRole: 'reversal',
              action: '灌剧情',
              dialogue: '你到底是谁？快说！',
            },
            { durSec: 4, beatRole: 'cliffhanger', action: '门外脚步' },
          ]),
        ),
      ),
    ).toContain('DIALOGUE_BEFORE_CLIFF');
  });
});
