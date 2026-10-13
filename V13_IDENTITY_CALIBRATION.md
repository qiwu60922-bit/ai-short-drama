# V13 身份阈值标定（AuraFace glintr100 + YuNet 对齐）— 2026-10-13
参考图只读，来自 `wave14/ep01/refs`（Director 2026-09-17 钉选）。脚本：`scripts/detectors/calibrate_identity.py`（每张图所有人脸，YuNet 分数≥0.6、边长≥40px；留一法取各角色最大余弦）。

| 角色 | 锁 | 可检出人脸 | 同角色分数 | 最高跨角色分数 | 结论 |
|---|---|---|---|---|---|
| qi-ye | HUMAN_LOCK | 主图 11 张脸 | 两两 0.5138–0.8659；留一法最大值 **0.7417–0.8659** | vs fei-yue-li **0.5947**；vs zhui-yu-shitu **0.4728** | **cosineMin 0.67，margin 0.10** |
| zhui-yu-shitu | HUMAN_LOCK | rooftop_gothic、rooftop_modern 各 1；bloodmoon_grasp、portrait_feathers 0 | gothic↔modern **0.1774** | 对 qi-ye 最高 0.4728 | **不可分 → UNCALIBRATED** |
| fei-yue-li | LOCK_CANDIDATE（非 HUMAN_LOCK） | 1 | 无同角色样本 | 对 qi-ye 0.5947 | **UNCALIBRATED** |

- **qi-ye 对比 zhui-yu-shitu：** 在 qi-ye 参考图上，zhui-yu 那边的脸最高只有 0.4728（rooftop_gothic 对 qi-ye 0.1966），qi-ye 自己最低 0.7417，因此**这个方向可分**。zhui 镜头里出现 qi-ye 的脸（与 qi-ye ≥0.67 且高于与 zhui 的相似度）→ FAIL。
- **反过来不可分：** zhui-yu-shitu 自己的两张参考图只有 0.18，比它和 qi-ye 的分数还低。所以 zhui-yu-shitu 的帧永远不会出 MACHINE_OK，只给 NOT_EVALUATED，交给人审。
- **注意：** qi-ye 的同角色样本都来自同一张设定图，可能偏乐观；有真实镜头后要复核。
- `qi-ye-awakened/TURNAROUND.png`（与 `ex_qi_label_turnaround_sheet.png` 是同一张图，黑羽板，「非本锁」）：作为 qi-ye 判 → 0.3043 FAIL。
- 场景：改为「2×2 网格直方图与全局直方图取小」。演示素材中不同场景从 0.5249（误放行）降到 0.4473 → FAIL，但离 0.45 很近，区分力仍弱。真实场景参考图目前只有 SCHEMATIC_PLACEHOLDER。
