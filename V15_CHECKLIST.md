# V15 签收清单（草稿，等吴琦签字）— 2026-10-12
全程离线，未花钱。所有 PR 都是叠加的、**均未合并**：#4–#32（#5 独立）。测试：assembly/generation/ledger/detectors/factory/v15 共 199 条全部通过（另有 2 条 voice-design 测试本来就因断网失败，与本系列无关）。
图例：✅ 已离线验证 · 🟡 代码就绪，等真实素材 · ⛔ 需用户决定 · ❌ 有意不实现

## V12 账本与角色 ID
| 项 | 状态 | 证据 |
|---|---|---|
| 生成账本（provider/model/cost/latency/seed/input hash/output sha） | ✅ | #18 #19；两集彩排共 44 条，$0 |
| 统一角色 ID qi-ye / fei-yue-li / zhui-yu-shitu，ye-yuan 只读 | ✅ | #18 #19（退出码 36） |
| 资产 UUID 索引 | ✅ | #20；EP01 彩排 64 个资产，校验通过 |
| concat 重编码 + DTS 单调校验 | ✅ | #21；两集 dtsOk=true |
| 人审收据（机器判定固定 NONE） | ✅ | #22 |

## V13 检测器
| 项 | 状态 | 证据 / 缺什么 |
|---|---|---|
| 连续性：尾帧→首帧（阈值冻结） | ✅ 代码与逻辑；🟡 数值意义 | #23；目前用的是假素材 |
| 身份：人脸 embedding 与角色包比对，FAIL 就是 FAIL | 🟡 | #24；缺模型（建议 AuraFace glintr100 + YuNet）⛔，以及人脸对齐 |
| 服装 / 场景（直方图） | 🟡 | #24；缺 HUMAN_LOCK 参考图 ⛔ |
| 口型：LatentSync/SyncNet，FAIL → G3 BLOCKED | 🟡 | #25；缺评分器及权重许可证 ⛔ |
| LLM QC 只做建议，不能写 g3 | ✅ | #24 |
| 出口条件「身份机器闸门有数值」 | 🟡 **未达成** | 需要模型 + 真实素材 |
| 检测结果汇入彩排 / 工厂报告 | ✅ | #26 #28 |

## V14 工厂
| 项 | 状态 | 证据 |
|---|---|---|
| 真实任务队列，可续跑 | ✅ | #27 |
| script→pack lock→H3→dub→sub→stitch→qc，用仓库已有模块 | ✅（假 H3 / 假 TTS） | #28 |
| 付费步骤需要 HUMAN_GO，默认关闭、在该步停下 | ✅ | #27 #28（退出码 50，付费 handler 调用次数为 0） |
| `--factory-run` | ✅ | `npm run factory` |
| 两集离线彩排 | ✅ | `/workspace/v11/v14-batch-rehearsal-2026-10-12/`：ep01 89.96s，ep02（合成）61.96s |
| 真实 H3 / 真实 TTS | 🟡 ⛔ | 要花钱，需要 HUMAN_GO |

## V15
| 项 | 状态 | 证据 |
|---|---|---|
| 多剧多角色 ID 命名空间 | ✅ | #30 |
| canPublish 只看人工 G3 签收收据（交互式、拒绝 agent/CI） | ✅ | #31；ep01 彩排 canPublish=false，18 条原因 |
| 真实发布动作 | ❌ 有意不实现 | publishAction=NOT_IMPLEMENTED |
| 成本 / 延迟 SLO 看板（静态 HTML/MD） | ✅ | #32；`v14-batch-rehearsal-2026-10-12/slo/`，OK，$0 |
| SLO 预算数值（目前：单集 $0、h3 p95 600s、tts p95 30s） | ⛔ | 由用户定 |

## 需要签字确认的事项
- [ ] 认可以上 ✅ 项已经离线验证
- [ ] 认可 🟡 项为「代码就绪，等真实素材」，不算完成
- [ ] 选定人脸模型和口型评分器（只许可证宽松、可商用的）
- [ ] 锁定参考图（HUMAN_LOCK）
- [ ] PR 合并顺序（#4→…→#32）
- [ ] 第一笔真实花费的 HUMAN_GO（集、步骤、预算上限、有效期）
- [ ] G3 标准不降、机器不判 PASS：继续有效

签字：__________　日期：__________
