/**
 * V12 Vest/Mask×Rhythm Ternary Bridge — 马甲|伪装 × 系列节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestMaskRhythmBridge } from '@/agents/assembly/vest-mask-rhythm-bridge-gate';

const vest = {
  id: '机长马甲',
  wearer: '机长',
  vestLabel: '机长',
  plantEp: 1,
  teaseEps: [3, 5],
  dropEp: 8,
  dropLabel: '公开机长身份反击',
};

const mask = {
  id: '拜金儿媳',
  wearer: '女主',
  plantEp: 1,
  maintainEps: [2, 4],
  revealEp: 8,
  revealLabel: '未来婆婆身份掉落',
};

const denseSpec = (episode: string) => ({
  episode,
  shots: Array.from({ length: 18 }, (_, i) => ({
    shotId: `${episode}-S${i}`,
    cast: [],
    durSec: 2,
    action: 'x·y',
  })),
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '飞上枝头难成凤凰',
  latestEp: 20,
  profile: 'dense' as const,
  vests: [vest],
  masks: [mask],
  links: [
    {
      id: 'L-vest',
      sourceKind: 'vest' as const,
      sourceId: '机长马甲',
      ep: 8,
      shotSpec: denseSpec('EP08'),
      profile: 'dense' as const,
    },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestMaskRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateVestMaskRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateVestMaskRhythmBridge', () => {
  it('vest drop + dense rhythm → PASS', () => {
    const r = evaluateVestMaskRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('mask reveal + dense rhythm → PASS', () => {
    const r = evaluateVestMaskRhythmBridge(
      pack({
        links: [
          {
            id: 'L-mask',
            sourceKind: 'mask',
            sourceId: '拜金儿媳',
            ep: 8,
            shotSpec: denseSpec('EP08'),
            profile: 'dense',
          },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
  });

  it('SCHEMA / DUP / UNKNOWN / no terminal', () => {
    expect(failCodes(evaluateVestMaskRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestMaskRhythmBridge(
          pack({
            links: [
              {
                id: 'd',
                sourceKind: 'vest',
                sourceId: '机长马甲',
                ep: 8,
                shotSpec: denseSpec('EP08'),
              },
              {
                id: 'd',
                sourceKind: 'vest',
                sourceId: '机长马甲',
                ep: 8,
                shotSpec: denseSpec('EP08'),
              },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateVestMaskRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                sourceKind: 'vest',
                sourceId: 'ghost',
                ep: 8,
                shotSpec: denseSpec('EP08'),
              },
            ],
          }),
        ),
      ),
    ).toContain('UNKNOWN_SOURCE');
    expect(
      failCodes(
        evaluateVestMaskRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                sourceKind: 'vest',
                sourceId: '机长马甲',
                ep: 5,
                shotSpec: denseSpec('EP05'),
              },
            ],
          }),
        ),
      ),
    ).toContain('NO_TERMINAL_AT_EP');
  });

  it('profile mismatch → WARN still PASS', () => {
    const r = evaluateVestMaskRhythmBridge(
      pack({
        profile: 'dense',
        links: [
          {
            id: 'L1',
            sourceKind: 'vest',
            sourceId: '机长马甲',
            ep: 8,
            shotSpec: denseSpec('EP08'),
            profile: 'intrigue',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PROFILE_MISMATCH');
    expect(r.verdict).toBe('PASS');
  });

  it('sparse shots under dense → CHILD_RHYTHM_FAIL', () => {
    expect(
      failCodes(
        evaluateVestMaskRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                sourceKind: 'vest',
                sourceId: '机长马甲',
                ep: 8,
                shotSpec: {
                  episode: 'EP08',
                  shots: [{ shotId: 'S0', cast: [], durSec: 40, action: '长镜头发呆' }],
                },
                profile: 'dense',
              },
            ],
          }),
        ),
      ),
    ).toContain('CHILD_RHYTHM_FAIL');
  });
});
