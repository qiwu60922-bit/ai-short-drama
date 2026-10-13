/**
 * V11 dual-write / read flags — all default false (Wave2).
 * Unset / anything other than explicit "true"/"1" => false.
 * Source: /workspace/v11/wave2/DUAL_WRITE_FLAGS.md
 * Wave5: V11_ENFORCE_PREVIS_POLICY (default false).
 * Wave6: V11_MOCK_TAKE_PIPELINE (default false; tests/demo may enable).
 * Wave10: V11_LOCAL_COMFY_RENDER (default false);
 *         V11_COMFY_USE_FIXTURE (unset => true for unit/fixture path);
 *         V11_COMFY_BASE_URL (default http://127.0.0.1:8188).
 */

function envTruthy(name: string): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return false;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === '1';
}

/** Unset / empty => true; only explicit false/0/no disables. */
function envTruthyDefaultTrue(name: string): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return true;
  const v = String(raw).trim().toLowerCase();
  if (v === '') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return v === 'true' || v === '1' || v === 'yes';
}

export function isV11DualWriteTakes(): boolean {
  return envTruthy('V11_DUAL_WRITE_TAKES');
}

export function isV11DualWriteCharacterDna(): boolean {
  return envTruthy('V11_DUAL_WRITE_CHARACTER_DNA');
}

export function isV11DualWriteStoryBible(): boolean {
  return envTruthy('V11_DUAL_WRITE_STORY_BIBLE');
}

export function isV11DualWriteSceneBible(): boolean {
  return envTruthy('V11_DUAL_WRITE_SCENE_BIBLE');
}

export function isV11DualWriteShotSpec(): boolean {
  return envTruthy('V11_DUAL_WRITE_SHOT_SPEC');
}

export function isV11ReadPreferV11(): boolean {
  return envTruthy('V11_READ_PREFER_V11');
}

export function isV11FreezePanelJsonTruth(): boolean {
  return envTruthy('V11_FREEZE_PANEL_JSON_TRUTH');
}

/** Wave5: when true, PRO/CINEMA enqueue requires previsRef. Default false. */
export function isV11EnforcePrevisPolicy(): boolean {
  return envTruthy('V11_ENFORCE_PREVIS_POLICY');
}

/** Wave6: when true, documents mock take pipeline as allowed entry. Default false (prod-safe). */
export function isV11MockTakePipeline(): boolean {
  return envTruthy('V11_MOCK_TAKE_PIPELINE');
}

/** Wave10: live Comfy HTTP allowed only when true. Default false. */
export function isV11LocalComfyRender(): boolean {
  return envTruthy('V11_LOCAL_COMFY_RENDER');
}

/**
 * Wave10: use recorded fixtures (no network). Unset => true (unit-test safe default).
 * Set false/0 only together with V11_LOCAL_COMFY_RENDER=true for Phase B.
 */
export function isV11ComfyUseFixture(): boolean {
  return envTruthyDefaultTrue('V11_COMFY_USE_FIXTURE');
}

/** Wave10 Comfy base URL — V11_COMFY_BASE_URL or COMFY_BASE_URL. */
export function resolveV11ComfyBaseUrl(): string {
  const a = process.env.V11_COMFY_BASE_URL?.trim();
  if (a) return a.replace(/\/$/, '');
  const b = process.env.COMFY_BASE_URL?.trim();
  if (b) return b.replace(/\/$/, '');
  return 'http://127.0.0.1:8188';
}

/** Snapshot of all Wave2+Wave5+Wave6+Wave10 flags (for tests / diagnostics). */
export function getV11Flags(): {
  V11_DUAL_WRITE_TAKES: boolean;
  V11_DUAL_WRITE_CHARACTER_DNA: boolean;
  V11_DUAL_WRITE_STORY_BIBLE: boolean;
  V11_DUAL_WRITE_SCENE_BIBLE: boolean;
  V11_DUAL_WRITE_SHOT_SPEC: boolean;
  V11_READ_PREFER_V11: boolean;
  V11_FREEZE_PANEL_JSON_TRUTH: boolean;
  V11_ENFORCE_PREVIS_POLICY: boolean;
  V11_MOCK_TAKE_PIPELINE: boolean;
  V11_LOCAL_COMFY_RENDER: boolean;
  V11_COMFY_USE_FIXTURE: boolean;
  V11_COMFY_BASE_URL: string;
} {
  return {
    V11_DUAL_WRITE_TAKES: isV11DualWriteTakes(),
    V11_DUAL_WRITE_CHARACTER_DNA: isV11DualWriteCharacterDna(),
    V11_DUAL_WRITE_STORY_BIBLE: isV11DualWriteStoryBible(),
    V11_DUAL_WRITE_SCENE_BIBLE: isV11DualWriteSceneBible(),
    V11_DUAL_WRITE_SHOT_SPEC: isV11DualWriteShotSpec(),
    V11_READ_PREFER_V11: isV11ReadPreferV11(),
    V11_FREEZE_PANEL_JSON_TRUTH: isV11FreezePanelJsonTruth(),
    V11_ENFORCE_PREVIS_POLICY: isV11EnforcePrevisPolicy(),
    V11_MOCK_TAKE_PIPELINE: isV11MockTakePipeline(),
    V11_LOCAL_COMFY_RENDER: isV11LocalComfyRender(),
    V11_COMFY_USE_FIXTURE: isV11ComfyUseFixture(),
    V11_COMFY_BASE_URL: resolveV11ComfyBaseUrl(),
  };
}
