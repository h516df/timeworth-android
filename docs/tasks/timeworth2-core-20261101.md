# TimeWorth 2.0 — A 批次工作分支交接

状态：**开发中；尚未整合进 Android 默认入口或发布 APK**
基线：main `e3251591bbdc8459c05d646fd2dd42a2371682f8`
分支：`codex/timeworth2-core-20261101`

## 用户目标

在原 Android 0.1.0 上开发不记账的 TimeWorth 2.0，三入口为“首页 / 算一算 / 未来”。保留旧数据、原包名、原签名和离线性质，不将估算当作银行余额；先沿确认的设计逐批实现。

## 本工作已完成

- 使用原 `model.js` v2 存储及 `finance.js`，新增独立的 2.0 UI 层：`ui-preview/dist/timeworth2.js`、`timeworth2.css`。
- `timeworth2.html` 可作为不替换旧版本的独立开发预览入口；不改变 `index.html` 的既有安装行为。
- 新三入口：基础/真实时薪、估算可安排金额（明确非余额）、近期还款；消费时间及报价分期计算；可跨月查看的还款时间线、目标和心愿入口。按明确填写的每月目标存入额计算预计剩余月数，不自动假设存钱速度。
- 设置中支持工作档案、生活费预留、旧账本只读查看、原 JSON 备份/恢复与更新入口。旧 `transactions` 既未删除也不纳入 2.0 可安排金额。
- 新字段以旧 v2 容器中的可选 `timeworth2.livingReserve` 保存；备份仍保留原 `version:2`，扩展校验拒绝非法预留值。没有进行破坏性 schema 升级。

## 验证

- `node --check ui-preview/dist/timeworth2.js`：passed。
- `node ui-preview/qa/timeworth2.cjs`：7 个定向场景 passed，验证三入口、旧账本不参与估算、数据不足不造数、分期金额校验、跨月时间线、目标估时以及非法备份数据拒绝。
- `node --test ui-preview/qa/finance.test.cjs`：既有金额规则 passed（同批运行）。
- 真实 Chromium UI 渲染：**not run**。云端无浏览器，Playwright 浏览器下载源返回非 ZIP；不宣称视觉与触控实际通过。
- Android APK、签名、安装升级：**not run**。

## 共享协调与下一步

- 协调分支 `codex-coordination-v1` revision 52 已领取本任务，来源不重叠文件。
- 原签名准备 PR #17 的工作任务仍为 ready，登记的保留范围包含现有 `index.html`、`native.js` 与 Android 文件。本批没有改这些文件。
- 必须在该任务完成整合或取得明确移交后，将 2.0 文件接入默认 `index.html`、原生首用/更新路径，再执行真实浏览器、Android 安装及数据迁移回归。不得把独立预览页当成已发布 APK。
- 下一批实现多图中文 OCR、校验编辑、去重、重导更新前，需确认原生 Java 文件写入范围与设备端依赖。费用/敏感截图不进入仓库。
