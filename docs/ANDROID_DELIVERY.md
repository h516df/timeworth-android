# TimeWorth 安卓交付与更新：当前缺口

更新日期：2026-10-21。本轮落实规则与记录，不启动 Android 工程，不发布 APK，不重新生成或读取签名秘密。以下按实际证据区分，勾选必须有来源。

## 已知基础

- 私有源码 `h516df/timeworth-android`；当前可用产品为手机网页 05，成果在 [PR #3](https://github.com/h516df/timeworth-android/pull/3)，尚无原生 Android 工程或 APK。
- 复用既有 `h516df/android-update-kit` 和公开分发 `h516df/app-releases`，按 `appId: timeworth` / `channel: stable` 隔离；源码不因此公开。
- [CLOUD_DELIVERY](CLOUD_DELIVERY.md) 已记录云端签名准备、Secrets 写入及一次临时文件验签通过。本轮未读取 Secrets、未复测签名；该记录不等于正式 APK 或长期恢复验收。
- Make 现有账号/权限符合个人私有建仓接口要求，尚无实际创建证据；非敏感定位及边界见[通用云端能力说明](https://github.com/h516df/vibe-ui-quality-kit/blob/main/workflow/CLOUD_CAPABILITIES.md)。

## 正式安卓开发时按顺序验证

- [ ] **构建通道**：实际产出可安装 APK。已知 Actions 运行 39578884252 / 39578884129 因账户付款或支出上限在步骤前被拒绝；账单 API 返回 404，不能断言额度已用完。本轮未解除限制、未改支付/预算，也未验证替代 APK 构建通道。
- [ ] **签名恢复**：复用原项目长期签名，落实受控长期保存和独立恢复路径，验证恢复后证书一致。不用临时 VM 或单份 Secrets 替代恢复验证，不把密钥放普通附件。
- [ ] **更新客户端**：适配普通用户匿名读公开清单/下载安装包，不沿用 update-kit 的私有 GitHub 登录流程；用户无需 GitHub 账号。提供清晰中文说明、下载/取消/失败状态、来源与摘要/包名/签名/版本校验。
- [ ] **发布顺序**：按项目独立版本发布正式 APK 和说明，实际匿名下载核验后才切换 `apps/timeworth/stable.json`；没有实际 APK 时保持 unavailable，不填假版本，不依赖共享仓库全库 latest。此文不授权现在修改公开入口。
- [ ] **数据迁移**：网页 localStorage 的导出/导入与原生存储迁移需要明确路径并实测；不能假设换成 App 自动继承浏览器数据。升级前备份，覆盖更新后核对工资、应还、目标、图标和主题。
- [ ] **最小覆盖升级**：旧版安装 → 写入合成数据 → 发布并获取更高 versionCode 的同包名/兼容签名新版 → 系统覆盖安装 → 数据和核心功能仍在。至少一台目标实体手机验证安装授权与确认；不以网页、云端模拟器或 JAR 验签替代。
- [ ] **失败与恢复**：断网、取消、损坏包、不兼容包不破坏旧版；保留上版产物/清单回执。Android 低版本通常不能直接覆盖安装，必要时以更高 versionCode 发布修复版，不承诺直接降级或无需系统确认。

这份清单是验收要求，尚未勾选的项仍未完成。更完整的通用[安卓交付模板](https://github.com/h516df/vibe-ui-quality-kit/blob/main/workflow/templates/ANDROID_DELIVERY.md)供其他项目按需采用。

## 与当前需求的关系

[需求池 #6](https://github.com/h516df/timeworth-android/issues/6) 收集产品体验，TW-001 动画反馈仍待处理；本次“落地”仅实施工作流。正式 Android 开发及公开更新待对应实施任务，不能把这份文档当作已经接通。
