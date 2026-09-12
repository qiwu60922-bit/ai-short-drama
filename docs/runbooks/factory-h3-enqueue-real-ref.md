# Factory `enqueueH3Take` · 真图联调 Runbook（Wave12 U1–U9）

> **日期:** 2026-09-12 · Wave12-B  
> **硬禁:** 缺 IR-20…22 → **零** Comfy submit；解锁 ≠ G3 ≠ publish；禁 AutoDL 开机步骤写进本页；禁 migrate APPLY

对照：`WAVE12_DESIGN_CHECKLIST.md` U1–U9 · `IR20_UNLOCK_GATE.md` · `assert-ref-dna.ts`

## 开闸前（缺一禁跑）

1. U1 IR-01…12 PASS  
2. U2–U4 IR-20…22：`refDna.bindings` 含 characterId + appearanceRevisionId + refContentSha256；sha 匹配或 `approvedTemporary`；多角色覆盖或 `leadOnly=true`  
3. U5 操作员类型 ≠ smoke 占位（`hero_portrait` | `dna_locked_export`）  
4. U6–U7 CharacterDNA / Continuity / HumanLock 既有 preflight 绿  
5. U8 `generatorKey=local.comfy.minimax_h3` + R12 官方图  
6. U9 **不**因解锁写 G3 PASS  

拒因码：`COMFY_I2V_REF_NO_DNA` / `COMFY_I2V_REF_SHA_MISMATCH` / `COMFY_I2V_REF_ROLE_GAP`（经 `INVALID_INPUT` message 前缀）。

## 调用示意

```ts
await enqueueH3Take({
  shotSpec,
  takeManifestId,
  preflight,
  referenceImageName: 'ye-yuan-front-fullbody.jpg',
  refDna: {
    bindings: [{
      characterId: 'ye-yuan',
      appearanceRevisionId: 'app-rev-1',
      refContentSha256: '<64-hex>',
      appearanceContentSha256: '<64-hex>',
      operatorKind: 'hero_portrait',
    }],
    leadOnly: true,
  },
  useFixture: false,
}, deps);
```

## 单测

```bash
npx vitest run tests/unit/e2e/v11-h3-enqueue-preflight.test.ts tests/unit/schemas/ref-binding.test.ts
```

*W12B-04: 本文不含 AutoDL / migrate APPLY 步骤。*
