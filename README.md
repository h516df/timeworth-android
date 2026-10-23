# TimeWorth Android

把工作、时间、收入、消费和生活目标联系起来的安卓手机 App。

> 当前状态：Android 0.1.0 已发布，[打开发布页](https://github.com/h516df/timeworth-android/releases/tag/v0.1.0)，可下载 timeworth-0.1.0.apk（约 2.4 MB，Android 8+，原签名非调试包）。**main 现在包含完整的 Android 工程源码**，可直接构建。真机安装与公开稳定更新渠道尚未验收。

> **许可证**：MIT，见 [LICENSE](LICENSE)。
> **架构**：Android 原生壳（Java，`android/`）+ 本地网页产品界面（`ui-preview/`，原样打进 assets，WebView 加载）。财务计算逻辑在 `ui-preview/dist/finance.js`，跟 UI 分开，独立可读。
> **自行构建**：`cd android && ./gradlew assembleDebug`（本机用 JDK 21 + Android SDK 35 验证通过，产出约 2.9 MB debug 包）。正式包需要你自己的签名密钥——本仓库不含任何密钥。
> **已知缺口**：真机安装与覆盖升级未验收；应用内更新读的是上游分发通道，换签名后需要改配置才有意义。

## 产品方向

帮助用户理解一份工作的实际时薪、一笔消费对应的工作时间，以及消费和分期如何影响未来的结余与生活目标。

- **平台**：安卓手机。
- **视觉偏好**：苹果式的清晰排版、充分留白、细腻层次和自然动效，兼顾安卓系统操作习惯。
- **数据方向**：优先本地保存、免登录，支持备份、恢复和迁移。
- **复用原则**：评估已有项目和依赖，核实实际能力与许可证后复用。

## 当前体验流程

[手机打开网页体验版](https://timeworth-mobile-preview.cloudyloom133.chatgpt.site)：看当月工资的月底预计结余 → 工资到账时确认金额 → 查看接下来应还与正在攒的期待。

工资按所选月份保存，支持多次到账和直接修改导入工资；历史月份不改动本月时薪。分期可选本月/下月开始，另收的首期费用单独处理。

历史资产与其他收入分开查看，目标转存不扣工资结余；分期支持已含息费的报价反推，消费时间显示工作日和月份。自定义物品图标、材质主题和连续底栏动效已加入。

减少步骤和操作成本是首要原则，不强制分类预算或逐日手动记账；收录支持本机账单文件与文字，安卓自动采集仍待实现。源码和计算边界见 [原型说明](ui-preview/README.md)，当前任务状态见 [HANDOFF](HANDOFF.md)。

花呗、京东白条是重要需求。实际文件导入格式、消费与分期数据的可获得性仍待验证；目前不承诺完整自动同步。

## 需求与交付

- [需求池 #6](https://github.com/h516df/timeworth-android/issues/6)：唯一产品反馈入口；讨论和零散反馈先收集，明确开发/修复请求直接推进，相关批次集中交付一个预览。
- [当前交接](HANDOFF.md)：核对产品 PR 和任务分支后接续，不只按 main 的旧规划重做。
- [安卓交付与更新缺口](docs/ANDROID_DELIVERY.md)；[通用工作流](docs/AI_WORKFLOW.md)。
- [多个 Codex 的分工与整合](docs/MULTI_CODEX.md)：共享登记、独立任务和一个整合者，用户无需调度。

## 文档

- [产品草案与计算规则](docs/PRODUCT.md)
- [UI / UX 方向](docs/DESIGN.md)
- [参考项目与复用候选](docs/REFERENCES.md)
- [开发与发布准备情况](docs/READINESS.md)
- [纯云端开发、签名与交付](docs/CLOUD_DELIVERY.md)

## 开发与交付状态

完整 Android 工程已合入 main：Java + Android Gradle Plugin，包名 `dev.h516.timeworth`，最低 Android 8.0，构建入口 `android/gradlew`。原签名 APK 已随 v0.1.0 发布；真机安装、覆盖升级与独立长期签名恢复仍未验收。公开分发复用 `h516df/app-releases` 的独立 timeworth 入口，尚未切换 stable 清单。

账户的 GitHub Actions 计费限制解除前，云端工作流无法启动；本机可直接构建。

本轮[交付复盘](docs/RETROSPECTIVE_20261021.md)已落实为[规则与核验工具](docs/DELIVERY.md)。发行时由代理运行`python3 cloud/verify_release.py --contract release/delivery-contract.json --receipt /tmp/timeworth-release-receipt.json`，核对真实发行级别、原生附件摘要、标签与latest；用户无需填写技术表格。

真实工资、个人账单、账号密钥、签名文件和私人备份不应提交到仓库。测试使用明确标注的合成数据。正式GitHub发行不代表未测设备或公开更新渠道已经通过。

## 云端开发入口

后续开发默认使用云端：[打开开发工作区](https://codespaces.new/h516df/timeworth-android) · [环境、检查命令与迁移边界](CLOUD_DEVELOPMENT.md)。

## 开发工作流

已接入 [通用云端工作流 0.3](docs/AI_WORKFLOW.md)，文档来源固定为工具库 [13ff0db](https://github.com/h516df/vibe-ui-quality-kit/commit/13ff0dbcdae921c0ce972630fe5947d98a62b8f0)。接入脚本和检查配置协议仍为 0.1，采用来源保持 6bdaf2e7c9ec63f1cf7d02760a83a32b595bd1a0，没有顺带升级。验证命令见 [CLOUD_DEVELOPMENT](CLOUD_DEVELOPMENT.md)。本轮只落实工作流，TW-001 动画反馈仍待做，网页 05 未重新发布。

多个Codex任务从[共享协调入口](docs/MULTI_CODEX.md)开始：原子领取、独立分工、明确移交和一个整合者集中交付；协作工具不代表产品功能或安卓更新已完成。
