/**
 * V12 Story-Ledger Suite — pre-gen rehearsal/assembly 总入口.
 * 挂载 #71–#76 跨账本闸门；缺席 section = SKIP；全空 = EMPTY_SUITE FAIL.
 * PASS ≠ Final ≠ G3. $0 offline.
 */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  evaluateStoryLedgerSuite,
  STORY_LEDGER_GATE_IDS,
} from '@/agents/assembly/story-ledger-suite';
import { runEp01Rehearsal } from '@/agents/assembly/ep01-rehearsal';

const ensembleOk = {
  members: [
    {
      id: '太奶奶',
      name: '顾晚晴',
      roleSlot: 'matriarch',
      functionTag: '穿越太奶奶温情重整',
      lookTag: '十八岁少女皮囊',
      voiceTag: '科学院大佬口吻',
      spotlightEps: [1, 60],
    },
    {
      id: '七十岁儿子',
      name: '顾成',
      roleSlot: 'heir',
      functionTag: '老年儿子赡养线',
      lookTag: '花甲老人',
      voiceTag: '无奈絮叨',
      spotlightEps: [5],
    },
    {
      id: '老三',
      name: '顾老三',
      roleSlot: 'grandchild',
      functionTag: '创伤后失智恢复单元',
      lookTag: '痴呆傻笑',
      voiceTag: '童声残留',
      spotlightEps: [28],
    },
  ],
  units: [
    { id: '开场', ep: 1, leadIds: ['太奶奶'], supportIds: ['七十岁儿子'], warmth: true },
    { id: '失智', ep: 28, leadIds: ['老三'], supportIds: ['太奶奶'], warmth: true },
  ],
};

const fakeOk = {
  surfaceEntries: [
    { id: 'S1', ep: 1, claim: '家用全交公婆', amount: 5000, party: '儿媳' },
  ],
  trueEntries: [
    {
      id: 'T1',
      ep: 1,
      claim: '公婆截留家用转给小叔',
      amount: 5000,
      party: '公婆',
      evidenceLabel: '银行流水截图',
    },
  ],
  links: [
    {
      id: 'L1',
      surfaceId: 'S1',
      trueId: 'T1',
      reconcileEp: 8,
      reconcileLabel: '甩银行流水揭穿截留',
    },
  ],
};

const bundle = (sections: Record<string, unknown> = {}, latestEp = 84) => ({
  series: 'suite-demo',
  latestEp,
  ...sections,
});

const failCodes = (r: ReturnType<typeof evaluateStoryLedgerSuite>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('STORY_LEDGER_GATE_IDS', () => {
  it('lists story-ledger gates including reactionPeakLink', () => {
    expect([...STORY_LEDGER_GATE_IDS]).toEqual([
      'bondFrequencyLink',
      'vestMaskPeakLink',
      'frequencyPeakLink',
      'amnesiaMotifLink',
      'ensembleCast',
      'fakeLedgerReconcile',
      'cliffCascadeLink',
      'foreshadowMotifLink',
      'allianceBondLink',
      'personaVestLink',
      'stageGoalConflictLink',
      'reactionPeakLink',
    ]);
  });
});

describe('evaluateStoryLedgerSuite', () => {
  it('ensemble + fakeLedger both PASS → suite PASS; skipped listed; gates untouched', () => {
    const r = evaluateStoryLedgerSuite(
      bundle({ ensembleCast: ensembleOk, fakeLedgerReconcile: fakeOk }),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.schema).toBe('v12/StoryLedgerSuite/v1');
    expect(r.metrics).toMatchObject({ ran: 2, passed: 2, failed: 0, skipped: 10 });
    expect(r.results.ensembleCast.status).toBe('PASS');
    expect(r.results.fakeLedgerReconcile.status).toBe('PASS');
    expect(r.results.bondFrequencyLink.status).toBe('SKIP');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad top-level schema → SCHEMA FAIL', () => {
    const r = evaluateStoryLedgerSuite({ series: 'x' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('unknown section key → SCHEMA FAIL (strict)', () => {
    const r = evaluateStoryLedgerSuite(bundle({ notAGate: { foo: 1 } }));
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('no sections → EMPTY_SUITE FAIL', () => {
    const r = evaluateStoryLedgerSuite(bundle({}));
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('EMPTY_SUITE');
    expect(r.metrics.ran).toBe(0);
  });

  it('one child FAIL bubbles as GATE_FAIL + suite FAIL', () => {
    const thin = {
      members: [
        {
          id: 'only',
          name: '独苗',
          roleSlot: 'heir',
          functionTag: '一人包办',
          lookTag: 'a',
          voiceTag: 'b',
          spotlightEps: [1],
        },
      ],
      units: [{ id: 'u', ep: 1, leadIds: ['only'] }],
    };
    const r = evaluateStoryLedgerSuite(
      bundle({ ensembleCast: thin, fakeLedgerReconcile: fakeOk }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(r.results.ensembleCast.status).toBe('FAIL');
    expect(r.results.fakeLedgerReconcile.status).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 2, passed: 1, failed: 1 });
    expect(failCodes(r)).toContain('GATE_FAIL');
  });

  it('only fakeLedger section runs; others SKIP', () => {
    const r = evaluateStoryLedgerSuite(bundle({ fakeLedgerReconcile: fakeOk }, 20));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 1, passed: 1, skipped: 11 });
    expect(r.results.fakeLedgerReconcile.report?.verdict).toBe('PASS');
  });
});

describe('ep01-rehearsal storyLedgerGate wiring', () => {
  const SPEC = {
    episode: 'T',
    shots: [
      { shotId: 'S0', durSec: 3, cast: [], action: '推门·停步·对视' },
      { shotId: 'S1', durSec: 3, cast: [], action: '转身·甩账本·定格' },
      { shotId: 'S2', durSec: 3, cast: [], action: '特写流水·抬头·冷笑' },
      { shotId: 'S3', durSec: 3, cast: [], action: '退步·关灯·黑场' },
    ],
  };

  it('enforce + FAIL stops before generation (exit 36, stage storyLedger)', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sls-'));
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      storyLedger: bundle({}),
      storyLedgerGate: 'enforce',
      detectors: 'off',
    });
    expect(r.ok).toBe(false);
    expect(r.exitCode).toBe(36);
    expect(r.stage).toBe('storyLedger');
    expect(r.storyLedger?.verdict).toBe('FAIL');
    expect(existsSync(join(w, 'story-ledger-suite-report.json'))).toBe(true);
    const dumped = JSON.parse(
      readFileSync(join(w, 'story-ledger-suite-report.json'), 'utf8'),
    );
    expect(dumped.verdict).toBe('FAIL');
  });

  it('warn + FAIL still continues (does not block)', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sls-'));
    // empty refIndex + no scene → may fail convert; we only assert storyLedger ran & stage ≠ storyLedger block
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      storyLedger: bundle({}),
      storyLedgerGate: 'warn',
      detectors: 'off',
      allowCandidatesForDryRun: true,
    });
    expect(r.stage).not.toBe('storyLedger');
    expect(r.storyLedger?.verdict).toBe('FAIL');
    expect(r.notes.some((n) => n.includes('story-ledger-suite'))).toBe(true);
  });

  it('off (default) ignores storyLedger payload', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sls-'));
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      storyLedger: bundle({}),
      detectors: 'off',
      allowCandidatesForDryRun: true,
    });
    expect(r.storyLedger).toBeUndefined();
    expect(existsSync(join(w, 'story-ledger-suite-report.json'))).toBe(false);
  });
});
