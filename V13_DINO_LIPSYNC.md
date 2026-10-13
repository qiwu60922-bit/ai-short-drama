# V13：DINOv2 整角色/场景 + 粗口型闸门 — 2026-10-13
## 模型（均为离线 CPU，权重不入库）
| 用途 | 模型 | 许可证 | sha256 |
|---|---|---|---|
| 整角色 / 场景 embedding | DINOv2-small，ONNX 版来自 onnx-community/dinov2-small | Apache-2.0：https://huggingface.co/facebook/dinov2-small ，https://github.com/facebookresearch/dinov2/blob/main/LICENSE | f22797eabf810a75e41de68d378541ebea372122b25c4ce3ef25ff618250c20a |
| 嘴部关键点 | MediaPipe Face Landmarker（float16 v1），pip mediapipe 1.1.0 | Apache-2.0：https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE | 64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff |

文件路径：`/workspace/v11/models/dinov2/dinov2-small.onnx`、`/workspace/v11/models/mediapipe/face_landmarker.task`。MediaPipe 依赖系统的 libEGL（已 apt 安装 libegl1）。

## 口型
- 至今仍未找到代码和权重**都**是 MIT/Apache/BSD 的 SyncNet 类评分器。joonson SyncNet 的权重没有许可证；LatentSync 的权重是 openrail++。
- 兜底的粗闸门：比较嘴部张开程度（内唇间距 ÷ 两眼间距）和音频 RMS。判定规则：
  - 说话时嘴不动（std < 0.01）→ FAIL；
  - 嘴型与音量相关性 < 0.1（允许错开 ±3 帧）→ FAIL；
  - 其余情况一律 NOT_EVALUATED。**这个闸门永远不会输出 MACHINE_OK。**
- 实测：静止人像配持续音 → mouthStd 0.00227，判 FAIL。**还没有在真实对白镜头上标定过。**

## zhui-yu-shitu 整角色识别（以人脸为中心裁出人物，DINOv2 CLS）
| | zhui 自己的其他参考图（最大值） | 对 qi-ye | 对 fei-yue-li |
|---|---|---|---|
| rooftop_gothic | 0.7246 | 0.32 | 0.3403 |
| rooftop_modern | 0.7246 | 0.25 | 0.2667 |
| bloodmoon_grasp | 0.7281 | 0.28 | 0.3969 |
| portrait_feathers | 0.7281 | 0.37 | **0.6033** |
| qi-ye 主图（冒充 zhui） | 0.3699 | — | — → FAIL |
- 阈值：cosineMin **0.66**，margin **0.10**。和 qi-ye 的差距 ≥0.35；和 fei-yue-li 的最小差距只有 0.125（portrait_feathers）。
- **局限：** 样本很少（zhui 4 张，qi-ye 1 张）；DINO 认的是服装、色调和构图，不是脸。只有在人脸模型给出 NOT_EVALUATED 时才启用，它的 FAIL 照样阻断 G3。
- 注意：`qi-ye/sheet/AWAKENED_ALT_FEATHER_TURNAROUND.png` 和 `qi-ye-awakened/TURNAROUND.png` 是同一张图（黑羽板，「非本锁」），没有作为 qi-ye 的参考图使用。

## 场景（DINOv2 CLS 全图）
- 同一场景的变体（裁切、提亮、模糊、平移）≥ **0.7733**；不同场景 ≤ **0.5849** → 阈值 **0.68**。
- 演示素材：同场景裁切 0.8874 → MACHINE_OK，不同场景 0.2387 → FAIL。直方图法之前是 0.4473，离 0.45 只差 0.003；现在离阈值差 0.44。
- 真实场景参考图仍然只有 SCHEMATIC_PLACEHOLDER。
