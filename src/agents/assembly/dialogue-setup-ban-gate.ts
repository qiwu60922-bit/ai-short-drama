/**
 * V12 · Dialogue-After-Hook × Setup-After-Hook Ban Gate (钩后对白 + 钩后禁铺垫 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候》/密爽向: 第一钩后不得回 setup，且对白不得抢钩前灌剧情.
 * Embeds evaluateDialogueAfterHook + evaluateSetupAfterHookBan; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  DIALOGUE_BEFORE_HOOK / SETUP_AFTER_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDialogueAfterHook,
  type DialogueAfterHookFinding,
  type DialogueAfterHookOptions,
  type DialogueAfterHookReport,
} from './dialogue-after-hook-gate';
import {
  evaluateSetupAfterHookBan,
  type SetupAfterHookBanFinding,
  type SetupAfterHookBanOptions,
} from './setup-after-hook-ban-gate';

export type DialogueSetupBanOptions = DialogueAfterHookOptions;

export type DialogueSetupBanFinding = {
  code: DialogueAfterHookFinding['code'] | SetupAfterHookBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DialogueSetupBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DialogueAfterHookReport['metrics'] & {
    setupAfterHookShots: number;
  };
  findings: DialogueSetupBanFinding[];
  thresholds: Required<DialogueSetupBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDialogueSetupBan(
  shotSpecRaw: unknown,
  opts: DialogueSetupBanOptions = {},
): DialogueSetupBanReport {
  const dlg = evaluateDialogueAfterHook(shotSpecRaw, opts);
  const banOpts: SetupAfterHookBanOptions = { ...opts };
  const ban = evaluateSetupAfterHookBan(shotSpecRaw, banOpts);

  const findings: DialogueSetupBanFinding[] = [
    ...(dlg.findings as DialogueSetupBanFinding[]),
  ];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_AFTER_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DialogueSetupBanFinding);
    }
  }

  const thresholds: Required<DialogueSetupBanOptions> = {
    ...dlg.thresholds,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...dlg.metrics,
      setupAfterHookShots: ban.metrics.setupAfterHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
