# TimeWorth Android

把工作、时间、收入、消费和生活目标联系起来的安卓手机 App。

> 当前状态：[Android v0.1.0已正式发布](https://github.com/h516df/timeworth-android/releases/tag/v0.1.0)，原生附件timeworth-0.1.0.apk约2.4MB，Android8+、原签名非调试包。main保存协作入口和工作流，完整应用源码在发布标签及[PR #15](https://github.com/h516df/timeworth-android/pull/15)依赖链；尚未合入main。

## 产品方向

帮助用户理解一份工作的实际时薪、一笔消费对应的工作时间，以及消费和分期如何影响未来的结余与生活目标。

- **平台**：安卓手机。
- **视觉偏好**：苹果式的清晰排版、充分留白、细腻层次和自然动效，兼顾安卓系统操作习惯。
- **数据方向**：优先本地保存、免登录，支持备份、恢复和迁移。
- **复用原则**：评估已有项目和依赖，核实实际能力与许可证后复用。

## 建议的第一版流程

填写工资和工时 → 查看时薪 → 导入或录入账单 → 查看消费和分期应还 → 模拟购买后的结余。

花呗、京东白条是重要需求。实际文件导入格式、消费与分期数据的可获得性仍待验证；目前不承诺完整自动同步。

## 协作与当前成果

- [需求池 #6](https://github.com/h516df/timeworth-android/issues/6)：讨论/体验反馈先记录；明确要求开发或修复时直接推进。由代理组织相关批次、集中检查与交付，用户无需管理 GitHub。
- [当前交接](HANDOFF.md)：核对产品 PR 和任务分支后接续，不只按 main 的旧规划重做。
- [通用工作流 0.4](docs/AI_WORKFLOW.md)；[安卓交付与更新缺口](docs/ANDROID_DELIVERY.md)。

- [多个 Codex 的分工与整合](docs/MULTI_CODEX.md)：共享登记、独立任务和一个整合者，用户无需调度。

## 文档

- [产品草案与计算规则](docs/PRODUCT.md)
- [UI / UX 方向](docs/DESIGN.md)
- [参考项目与复用候选](docs/REFERENCES.md)
- [开发与发布准备情况](docs/READINESS.md)
- [纯云端开发、签名与交付](docs/CLOUD_DELIVERY.md)

## 开发与交付状态

执行方式为纯云端，不依赖用户本地电脑。已有Android工程和原签名APK，包名dev.h516.timeworth，最低Android8.0；实际构建与GitHub正式发行均已完成。根main不包含未合并产品源码，继续应用开发时先读[当前交接](HANDOFF.md)及发布标签/相关PR。

当前下载位于私有GitHub Release，需有访问权的GitHub登录。公开分发与自动更新仍复用既有h516df/app-releases的独立timeworth入口，但尚未切换stable清单；真机安装/覆盖升级和独立长期签名恢复未验收。

本轮[交付复盘](docs/RETROSPECTIVE_20261021.md)已落实为[规则与核验工具](docs/DELIVERY.md)。发行时由代理运行`python3 cloud/verify_release.py --contract release/delivery-contract.json --receipt /tmp/timeworth-release-receipt.json`，核对真实发行级别、原生附件摘要、标签与latest；用户无需填写技术表格。

真实工资、个人账单、账号密钥、签名文件和私人备份不应提交到仓库。测试使用明确标注的合成数据。正式GitHub发行不代表未测设备或公开更新渠道已经通过。

## 云端开发入口

后续开发默认使用云端：[打开开发工作区](https://codespaces.new/h516df/timeworth-android) · [环境、检查命令与迁移边界](CLOUD_DEVELOPMENT.md)。
