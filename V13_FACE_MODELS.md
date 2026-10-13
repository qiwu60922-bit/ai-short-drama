# V13 本地人脸模型（可商用，CPU，离线）— 2026-10-13
| 用途 | 模型 | 许可证（已核实原文） | sha256 |
|---|---|---|---|
| 检测 + 5 点对齐 | OpenCV Zoo YuNet `face_detection_yunet_2023mar.onnx` | MIT — https://github.com/opencv/opencv_zoo/blob/main/models/face_detection_yunet/LICENSE | 8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4 |
| 512 维 embedding | fal AuraFace-v1 `glintr100.onnx` | Apache-2.0（模型卡 license: apache-2.0）— https://huggingface.co/fal/AuraFace-v1 | a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60 |

- 权重不入库，放 `/workspace/v11/models/face/`（`V13_FACE_MODEL` / `V13_FACE_DET` 可覆盖）；Python 依赖 venv：`V13_PYTHON=/workspace/v11/venv/bin/python`（opencv-python-headless + onnxruntime）。
- 代码拒绝 InsightFace 非商用权重文件名（w600k / det_10g / scrfd / buffalo / antelope / genderage）。AuraFace 仓库里其它文件不要用。
- 阈值 cosineMin=0.45 **未针对 AuraFace 在真实角色参考图上标定**；只能经 PR 审阅修改。

## 样例真实分数（演示素材 assets/demo-*.png，仅测试材料，非角色参考）
| 帧 | 相似度 | 判定 |
|---|---|---|
| 同帧提亮 | 0.8393 | MACHINE_OK |
| 同帧缩放 0.8 | 0.4905 | MACHINE_OK（贴近阈值） |
| 同帧水平翻转（半遮挡侧脸） | 0.1519 | FAIL |
| 另一人（demo-anime） | 0.0524 | FAIL |
| 无脸 | — | FAIL |
gate=FAIL；V11_G3=NOT_EVALUATED；机器不写 g3。

服装/场景直方图（参考=demo-romance）：demo-anime costume 0.5249 FAIL，scene 0.5249 **MACHINE_OK** —— 直方图对场景区分力弱，需要真参考图后再评估/换方法。

## 口型评分：仍 🟡（未接入）
- joonson/syncnet_python：代码 MIT，但权重 `syncnet_v2.model` 无单独许可证、训练于 VoxCeleb（研究用途）→ 不用。
- ByteDance LatentSync-1.6 `stable_syncnet.pt`：HF 模型卡 license **openrail++**，不是 MIT/Apache/BSD → 按规则不用。
- 未找到 MIT/Apache/BSD 许可的 SyncNet 类权重。
