# 当前接续记录（2026-10-21 · 网页体验版 05，恢复产品开发）

- **目标与授权**：用户要求继续 TimeWorth。本轮聚焦工资按月回看/修改和分期首期实际支付时间，同时拆出计算规则；仍以手机网页验证，不启动原生 Android 或真实账户接入。
- **分支 / 基线**：延续 codex/low-friction-ui-v3-20261021 / [产品 PR #3](https://github.com/h516df/timeworth-android/pull/3)。从 6288517adb4fda96ad12684cec40c99089cab448 的完整 UI 与检查接续，并合入 main 432e660e5b98ed32958846dfaeacbab75d9ec77a 的统一规则入口；本次 Git 数据提交会同时包含这两个父提交，不丢失任一方向的文档。源码和交接一起推送，未合并产品 PR。
- **完成**：finance.js 独立负责工资、时间及含息费报价规则；界面通过薄适配调用，未再加 v5 覆盖层。历史月份补录/修改不会改动当前工资或时薪；多次工资可分别记录，导入工资直接修改原记录，非 salary 前缀的工资 ID 不再误判为其他收入。月份入口包含近一年及已有记录月份。
- **分期**：可直接选本月/下月开始；下月首期不减本月预测。每期 520 ×12、另付首期费用 100、原价 6000 => 总还款 6340、总息费 340、首期 620，其后 520。已包含费用不重复加；负差额优惠保留原价比较，内部本金分配与应还金额分币守恒，不能当作机构提供的本息明细。
- **月份边界**：未来记录不当成当前实际到账/已还；未来日期的支出不能抵掉尚未支付的固定账单。回顾页显示当月已记录支出，当前月份显示接下来要付；独立目标转存仍不扣工资留存。localStorage 维持版本 2，现有数据不重置。
- **passed（云端工作树，基线见上）**：node --test ui-preview/qa/finance.test.cjs 七组金额规则；python3 cloud/workflow.py check --level core 的原两组浏览器检查与 monthly-v5.cjs；新月度场景覆盖历史编辑幂等、多笔工资、工资分类、导入工资复用、下一月首期与单独首期费用。最终设置页上下文与截图等待修改后，月度脚本定向复核通过。GitHub CI 无法启动后，最终产品源提交的月度浏览器用例在云端再次定向通过，覆盖最后历史标题、图例与设置上下文；未无故重跑其他已通过且未受影响的用例。语法、git diff --check 和 actionlint 1.7.7 passed。
- **GitHub CI 阻塞（已核实）**：产品源提交 21a6d3c6aaa9b8d6eae34817fb93799df534f05c 的 UI preview checks 39578884252 和 Cloud development 39578884129 均在执行任何步骤前失败。GitHub 注释："The job was not started because recent account payments have failed or your spending limit needs to be increased." 原因是账户付款或支出上限，不是已执行的代码测试失败；Actions 检查在本轮为 not run。未改扣费设置，不盲目重试。现有 GitHub 工具无法读取注释端点，已通过原有 Make API shell 6715378 以 GET 只读核实，无新场景、无外发消息。
- **检查来源**：云端复用 Playwright 1.62.1 和系统 Chromium，测试日期固定 2026-10-21。GitHub UI preview checks 新增 Node 金额规则，在安装浏览器前执行，再运行三组浏览器用例；准确源码提交和 CI 状态见本 PR。不得把旧 v4 测试结果冒充这次结果。
- **已发布 05**：https://timeworth-mobile-preview.cloudyloom133.chatgpt.site ，owner-private 保持。GitHub 产品源码 21a6d3c6aaa9b8d6eae34817fb93799df534f05c；Sites 源码 2d337355c01e042987e5be575b651adc21503f47；部署 appgdep_6ad889743f388191bb6cf7e45ccaef19，原生工具返回 succeeded。Site 从 GitHub 这份产品源码的 dist 原样同步，14 个静态文件字节一致，部署归档由该 Site 提交生成。此后的交接提交只改文档，不代表重新发布或重新测试另一份产品代码。
- **not run / 边界**：真实银行/支付账户、全平台账单、Android 通知与真机、APK/签名/安装/应用内更新、ZIP/加密/PDF/OCR 未实现或未测。本轮不访问 Secrets、不使用本地电脑、不改生产服务。整个原型尚未完全移除早期兼容界面，当前只是有边界地拆出关键计算。
- **配置与接续**：项目 AGENTS 保留统一简版和用户产品约定；检查工具采用来源仍固定，规则入口指向通用私有库。运行步骤见 CLOUD_DEVELOPMENT；用户无需重述工作流或记分支。下次代理先核对本 PR 和最新交接，继续产品反馈；勿只取 main 的旧原型重新实现。

## 统一入口整理记录（历史保留）

# 当前接续记录（2026-10-21 · 统一通用入口）

- **目标**：适应用户经常新开云端 Codex 的方式；每个项目默认分支都指向同一通用工作流，并保留本地可执行简版，用户无需记启动语或分支名。
- **通用入口**：[vibe-ui-quality-kit/workflow](https://github.com/h516df/vibe-ui-quality-kit/blob/main/workflow/README.md)。简版修订 2026-10-21-r1；项目 AGENTS/CLAUDE 的特有约束继续适用。
- **本轮基线 / 分支**：`17849f696c6811ba85585997a4fa25a376f3665b` / `codex/shared-workflow-entry-20261021`。本轮只改规则与交接文档，不改业务源码、安装器、签名、数据、服务或发布权限。准确提交与 PR 以本次远端记录为准。
- **已完成**：统一入口、清理有效入口里的失效 agent-rules 引用、独立简版与自动发现相关任务的约定；保留下方项目历史和原检查入口。
- **验证**：本轮文档范围/简版一致性/项目约束保留/失效入口检查 passed；业务构建、设备、生产发布 not run。通用模板另在工具库验证。新 CI 结果以对应 PR 的实际运行记录为准。
- **当前任务发现**：下面是本轮开始前的未合并 PR 快照，不是建议合并清单。代理根据用户任务自行核对实时 head、依赖和相关分支交接；不要求用户逐个记住，也不能把最新 PR 自动当主线。
- **TimeWorth 当前成果**：网页 04、完整产品约定及工作流检查接入位于 [产品 PR #3](https://github.com/h516df/timeworth-android/pull/3) / codex/low-friction-ui-v3-20261021，读取时 head 6288517adb4fda96ad12684cec40c99089cab448。本轮不合并产品 PR、不重新发布网页；用户当前只要求整理通用规则，产品功能仍暂停。接着做产品时先读该分支 AGENTS/HANDOFF。
- **下一步**：新任务先读本仓库 AGENTS、云端说明与本记录，再按用户目标接续相关成果。完整私有规则暂不可读时先沿用本地简版；不能把存档视为账户级配置。

## 未合并任务快照（2026-10-21）

| PR | 任务分支 | 目标分支 | 读取时 head |
| --- | --- | --- | --- |
| [#3: 工资月底结余与低操作成本手机体验（网页 04）](https://github.com/h516df/timeworth-android/pull/3) | `codex/low-friction-ui-v3-20261021` | `main` | `6288517adb4fda96ad12684cec40c99089cab448` |


## 之前的产品与检查接续（历史保留）

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
