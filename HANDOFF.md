# 当前接续记录（2026-10-21 · 工作流接入，App 功能暂停）

- **目标**：落实用户要求的云端低操作成本工作流，并保存为其他项目可复用的私有模板；本分支仅接入规则和检查，不改产品源码或重新部署网页。
- **通用来源**：[vibe-ui-quality-kit 工作流 0.1](https://github.com/h516df/vibe-ui-quality-kit/tree/6bdaf2e7c9ec63f1cf7d02760a83a32b595bd1a0/workflow)，固定提交 `6bdaf2e7c9ec63f1cf7d02760a83a32b595bd1a0`，工具库 PR #3 / codex/reusable-workflow-20261021。docs/AI_WORKFLOW.md 与 cloud/workflow.py 从该包采用；未来升级先审阅差异。
- **基线 / 分支 / PR**：基于 UI 分支 `codex/low-friction-ui-v3-20261021` 的 `2da2b479a721a9d9bc2bd3bca5559c2a7c9c2084`；独立任务分支 `codex/workflow-adoption-20261021` 向 UI 分支提堆叠 PR。原产品 PR #3 保留，main 快照仍为 17849f6；勿误把这轮基础设施当作原生 App 实现。准确提交以本分支远端为准。
- **完成**：AGENTS 工作流入口、版本固定、quick/core 配置、便携脚本、锁定 Playwright 1.62.1 与 npm 依赖、临时随机端口服务与自动清理、GitHub 网页检查。CI 按路径触发并取消同分支过时任务，contents:read，无部署或 Secrets；失败截图保留 3 天。
- **passed**：采用前 UI/QA 的 16 个文件 Git blob 逐个匹配远端基线。采用后 `python3 cloud/workflow.py check --level core` 通过 6 项语法与现有 check-v4/focused-v4 浏览器用例；云端 Playwright 1.62.1、系统 Chromium、日期固定 2026-10-21。上轮只语法验证的便携 QA 本轮实际运行通过。YAML 解析/最小权限/无 schedule 与 pull_request_target、Git 差异检查 passed。工作流包四组单元检查 passed，证据在工具库交接。验证工作树只新增工作流/文档/依赖元数据，产品源码未变。
- **CI 修正**：首次源码 abaf33b 的 UI 工作流运行 39562244066 在启动前失败（job env 不支持 runner.temp）；已把 ARTIFACT_DIR 移到 step env，使用固定 actionlint 1.7.7 对三份 Actions 配置做语义检查 **passed**。此前仅 YAML 解析的检查不足，此次已补到通用规则。修正后的 UI CI 结果以当前分支实际运行记录为准，不提前标 passed。原 Cloud development 是 JSON/Java 等守卫，与网页功能结果分开。已固定依赖；本轮云端复用了同版本工具，GitHub 的首次依赖安装结果需读取实际 CI。
- **not run / 本轮边界**：原生 Android/真机/真实平台通知与同步/全平台账单格式/APK/签名/应用内更新，原云端环境守卫未重跑；不触碰 Secrets/本地电脑/现有服务。没有新后端、多代理、定时收费服务或自动发布。产品结构整理和平台双源码库打包统一仅形成规则，尚未实施。
- **配置**：.ai-workflow.json 是可信命令配置；core 未配置时明确失败。标准运行步骤在 CLOUD_DEVELOPMENT。receipt 需要 Git 远端认证；本会话通过已连接 GitHub 工具核对远端 ref，不把它说成脚本已验证 GitHub 认证。
- **下一步**：先核对本分支 PR/远端 SHA/CI。用户仍暂停产品开发，待新指令继续。将来采用通用包可在云端先干跑后应用，保留项目规则，配置项目自己的测试，不每轮重复全量检查。继续产品时保留原 UI 分支成果和以下历史，不重新搭建。

## 之前的交接（保留历史）

# 当前接续记录（2026-10-21 · 网页体验版 04）

- **目标与长期决定**：用户纠正首页为当月工资结余，不能混入全部资产。少步骤、苹果感、含息费分期、自定义图标和真正有差异的皮肤；长期约定已写入 AGENTS。
- **基线 / 分支 / PR**：main 快照 `17849f696c6811ba85585997a4fa25a376f3665b`；本轮从任务分支 `96b5a0fa2c2075b28c28a77cdad1b26281e963d9` 延续。仍在 `codex/low-friction-ui-v3-20261021` / [PR #3](https://github.com/h516df/timeworth-android/pull/3)，未合并。源码与本记录同一次任务提交，准确提交 SHA 以分支远端和最终回执为准。
- **完成**：工资与历史资产/其他收入隔离；目标自转不重复扣减；可纠正支出资金来源；历史月份回看；摘要式工资流向。报价含息费反推与精确分期分配，天/月/自然收入天换算，图标独立自定义并带入目标，四套材质/字体/布局皮肤、密度/壁纸、场景内菜单及可打断底栏动效。通用收款文字不再误判工资，编辑工资不覆盖历史资产字段。
- **已发布**：[原预览地址](https://timeworth-mobile-preview.cloudyloom133.chatgpt.site)，owner-private 不变。Sites 源码 `c235ae240f391546be59f6512490777df059a541`；部署 `appgdep_6ad85b370ec0819185b0d5f3fe71c5fd`，工具返回 **succeeded**。`ui-preview/` 与这次部署源码一致，QA/交接不进入静态产物。
- **验证 passed**：原始云端 `check-v4.cjs`、`focused-v4.cjs` 交互检查，覆盖工资资产隔离、转存不扣工资、资金来源、实际已还不重复扣减、含息费报价、分期分币精度、时间单位、菜单选择/外部点击/Escape/单次重开、独立图标上传/带入目标、材质/字体/布局、密度/壁纸持久化、摘要明细、快速切换/减少动态效果及 360/390/430/1280px。最后定向验证普通入账/工资消息分类。JS 语法、`git diff --check`、`bash cloud/check.sh` **passed**，后者只验证规划仓库 JSON/Java/差异，不是 APK 验证。
- **可重跑**：启动 `python3 -m http.server 4173 --directory ui-preview/dist`；安装 Playwright/Chromium 后 `node ui-preview/qa/check-v4.cjs` 与 `node ui-preview/qa/focused-v4.cjs`。支持 PLAYWRIGHT_MODULE、CHROMIUM_PATH、PREVIEW_URL，截图写 ARTIFACT_DIR 或临时目录；固定测试日期 2026-10-21。便携脚本改为标准路径后仅做语法检查，原始云端版本的交互用例已通过。旧 v3 脚本保留历史证据，其旧收入口径不可作为 v4 验收。
- **边界 / not run**：实体 Android、原生通知/分享接收、真实支付平台连接、全平台账单格式、ZIP/密码/PDF/OCR、APK/安装/应用内更新均未实现或未测；本轮不访问签名 Secrets。没有后端 API key，浏览器本地数据需导出迁移。Sites 推送凭据仅在会话内存，不存仓库。
- **计算边界**：工资来源归属是一项明确的记账假设，不追踪银行每一元资金。分期差价是利息与费用合计。目标可以含历史存款，不宣称全部来自本月工资。自然天是收入等价换算。缺失账单会影响预测。旧余额锚保留在备份但不影响工资首页。
- **下一步**：继续同一 PR，先读本分支 AGENTS/CLOUD_DEVELOPMENT/HANDOFF/ui-preview/README 并核对远端。收敛用户反馈后再决定原生工程，不重新搭建或把通知演示说成已接入。旧 PRODUCT/DESIGN 草案尚未逐项更新，以本交接和原型说明为准。

## 之前的交接（保留历史）

# 当前接续记录（2026-10-21 · 网页体验版 03）

- **目标**：按“少一步操作”的用户原则，将网页从预算/手动记账重心调整为工资到账后的月底余钱；继续只做网页试用，尚不开始 Android 工程。
- **主线基线**：`17849f696c6811ba85585997a4fa25a376f3665b`，已核对 main，保留其 AGENTS、CLOUD_DEVELOPMENT 和旧交接。CLAUDE.md 在该提交返回 404；读取时没有打开的 PR。
- **本任务分支 / PR**：`codex/low-friction-ui-v3-20261021`，对应 GitHub PR；未自动合并，继续此任务须读取本分支而不是只读 main。
- **已完成**：月底估算与收入确认、余额校准、任意来源一句话应还、单期金额与已还状态、批量例外核对、本机 CSV/Excel 含收入读取、可自定义来源、图片心愿与一键开始攒钱、四套主题。源码、封面和锁定的 SheetJS 组件均保存在 `ui-preview/`。
- **网页发布**：[打开体验版](https://timeworth-mobile-preview.cloudyloom133.chatgpt.site)，保持原有 owner-private 权限。Sites 源码提交 `3c0721088c0f0f6524dbf8bfc7a250d2a45b6057`；发布 `appgdep_6ad851f80bcc81918ac8d9ba4a8ce04b`，原生工具返回 **succeeded**。
- **验证**：浏览器主要流程 **passed**，覆盖工资幂等、无预算现金流、任意平台应还、还款现金不重复扣减、主题持久化、心愿/目标与存入、息费测算直接建计划、来源、通知文字演示、实际 Excel 含收入上传与批量收录、备份、360/390/430/1280px。最后合并工资快捷入口与其他收入初始化后进行了定向复核。语法和 `git diff --check` **passed**；`bash cloud/check.sh` **passed**（规划仓库 JSON / 差异 / Java 守卫），不能当作 APK 验证。
- **可重跑检查**：`node --check ui-preview/dist/app.js`、`node --check ui-preview/dist/model.js`、`node --check ui-preview/dist/v3.js`、`bash cloud/check.sh`。交互脚本在 `ui-preview/qa/check-v3.cjs`；安装 Playwright 及其 Chromium，启动 `python3 -m http.server 4173 --directory ui-preview/dist` 后运行。脚本已适配标准 Playwright 模块与固定 2026-10-21 测试日期；便携路径版只做语法检查，原始云端脚本的交互用例已通过。截图只写临时目录，不提交。
- **not run / 未实现**：实体安卓手机、原生通知采集、真实平台同步、全平台账单格式、ZIP/密码保护/PDF/OCR、APK 构建或安装、签名与更新发布；本轮未读写 Secrets。
- **配置**：无后端 API key；数据留当前浏览器，JSON 备份由用户自行导出。Sites 短期推送凭据仅在当前工具会话内存，未进入仓库；以后需从相同项目申请新凭据。
- **估算边界**：按已收录现金收支、应还和日常支出速度推算，缺漏会影响准确度；曲线为注明的示意图，参考范围不是统计置信区间。当前是交互原型，不是完整多账户会计系统。最新方向以 `docs/UI_PREVIEW.md` 和 `ui-preview/README.md` 为准，旧 PRODUCT / DESIGN 草案未逐条迁移。
- **待做 / 下一步**：用户看本轮预览后，优先收敛主流程，再决定原生实现。安卓端优先评估 NotificationListenerService 与现有采集插件的兼容方式，不能承诺读取所有支付或完整历史。
- **续接提示**：继续 `codex/low-friction-ui-v3-20261021`，先读本分支的 AGENTS、CLOUD_DEVELOPMENT、HANDOFF 与 ui-preview/README，核对远端提交和 PR，再按用户反馈修改；不要重新搭建原型或把通知演示视为已接入。

## 既有交接历史（保留）

# 当前接续记录（2026-10-21）

本节是会话接续入口；长期规则见 [AGENTS.md](AGENTS.md)，工具链和检查命令见 [CLOUD_DEVELOPMENT.md](CLOUD_DEVELOPMENT.md)。后续任务更新本节，下面已有历史保留。

- **本轮目标**：将项目约定、进度和续接方式保存到 GitHub，使新 Codex 会话可以继续工作。
- **核对的主线基线**：`3af1bc3a810f785fa7e522e052cba2ba4b37d208`（main 的日期快照，继续前重新读取；不是永远最新提交）。
- **本轮分支**：`codex/session-continuity-20261021`。此分支仅修改协作与交接文档，PR 和实际合并状态以 GitHub 为准。
- **已准备**：新会话阅读顺序、结束保存流程、远端提交核对及续接提示；保留原项目规则、既有历史和云端开发配置。
- **验证范围**：本轮检查文档差异、仓库内链接、原文保留及远端读回；业务测试/构建/设备/发布为 **not run**，历史证据不能重标成本轮结果。实际检查结果与远端提交见本轮 PR。
- **配置与边界**：已有产品规划与 ui-preview 原型；尚无 Android App 工程或 APK。签名准备以 docs/CLOUD_DELIVERY.md 的当前证据为准，本轮未核验 Secrets 或签名。 其他配置键名、初始化入口及限制仍以云端说明和任务相关文档为准。
- **下一步**：核对下面 PR 快照及当前 main；按用户的具体目标选择主线或指定分支，读对应 PR 的最新交接后继续。尚未完成的业务工作不因本轮文档完善而视作已完成。

## 打开的 PR 快照

以下仅为 2026-10-21 读取到的列表，不判断是否仍需实施、能否合并，或是否已由其他提交包含；不批量合并、关闭或重复搬运。

读取时无打开的 PR；继续任务前重新确认。

## 下一次交接时更新

请在本节写清本轮目标、完成/待办、工作分支和 PR、所验证的提交 SHA、实际命令与 passed / failed / not run、阻塞、下一步；代码和交接一起推送，再给用户已核实的远端提交链接。未合并时须交代指定分支，不能让新会话只读 main。

本库此前没有根目录 HANDOFF.md；本文从当前可核实的仓库状态建立接续入口，不补造旧会话记录。

