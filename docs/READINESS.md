# 历史准备检查与后续状态

> 以下保存正式开发之前的检查快照，包括当时“无APK/无编译器”等描述，不代表当前状态。现在v0.1.0原签名APK及GitHub正式发行已完成；当前事实、来源和未验收项以[HANDOFF](../HANDOFF.md)与[安卓交付](ANDROID_DELIVERY.md)为准。

检查日期：2026-10-21。以下区分实际验证结果、授权范围和未验证事项。

## 仓库

- 远程仓库：`h516df/timeworth-android`。
- 可见性：私有；默认分支：`main`。
- 已通过 GitHub 连接读取初始 README，通过命令行读取仓库信息。
- 已实际创建并推送 `docs/project-baseline` 分支，完成文档提交，再以非强制推送更新 `main`；通过 GitHub 连接重新读取了上传后的 README。
- 已实际上传工作流并触发 GitHub Actions，运行成功；代码写入、分支创建、工作流写入、运行触发与结果读取均验证可用。
- 连接授权包含 Pull Request 写权限；本次没有额外创建或合并用于测试的 PR，因此不将 PR 操作标为已实测。
- 仓库归属用户拥有管理权限，不代表当前应用凭据也具有管理权限。

## ChatGPT GitHub App 本身的限制

- 创建仓库请求返回 HTTP 403；当前 GitHub App 未申请仓库创建或仓库管理权限。
- 读取 Actions 管理设置返回 HTTP 403。
- 获取 Actions Secrets 公钥返回 HTTP 403；当前凭据缺少 Secrets 管理权限，无法据此配置发布签名秘密。
- 常规重新连接、切换为全部仓库不会增加应用本身未申请的权限。
- 以上限制已通过用户授权的 Make GitHub OAuth 云端连接补足 Secrets 配置所需权限；两项 Secrets 写入与云端签名检查已经成功，不再需要用户手动配置这些字段。不使用或迁移本地电脑的凭据。

## 当前本地环境

已提供 Git、GitHub CLI、Python、Node 和 Java 运行时。尚未提供 Java 编译器、Gradle、Android SDK、ADB、安卓模拟器、Flutter 和 Dart。

后续确定技术栈后可以配置所需工具。仓库提供手动触发的 `Development environment check`，用于验证 GitHub 托管运行器是否可启动以及是否具有 Java 编译器和 Android SDK。

该工作流不读取源码、不使用 Secrets、不构建或发布 APK。它通过也不代表应用编译、真机运行、签名发布或更新流程已经通过。

### 已完成的托管运行器检查

- [运行记录](https://github.com/h516df/timeworth-android/actions/runs/39538272006)：成功。
- 已实际验证 Java 运行时、Java 编译器、Git、Android SDK 平台目录和 build-tools 目录可用。
- 本次检查只消耗一次手动运行；工作流没有定时、push 或 PR 自动触发器。
- 后续可以在此基础上安装所选技术栈依赖，配置真实 Android 构建；当前不需要用户安装电脑端开发工具。

## 当时的约束与发现（历史）

- 用户要求全流程执行，且目前不使用本地电脑。后续不依赖 MY-AI-PC。
- 已发现并读取现有公开分发仓库 `h516df/app-releases` 和工具仓库 `h516df/android-update-kit`；无需重复创建公开仓库。
- Make 云端连接已实测取得 `repo` scope，可读取私有源码仓库、读取 Secrets 公钥并加密写入 Secrets。
- 已配置两项签名 Secrets，公开证书指纹固定在 `release/signing-identity.json`。[签名检查](https://github.com/h516df/timeworth-android/actions/runs/39543286090)通过，包括临时 JAR 的签名与验签；没有 APK 构建或发布。
- TimeWorth 已加入现有公开分发目录，独立清单可匿名读取；状态为 `unavailable`，不提供虚构安装包。
- 本地电脑的权限和工具读取结果不作为纯云端方案已完成的证据，也不迁移其凭据。
- 后续方案和准备情况以 [纯云端交付](CLOUD_DELIVERY.md) 为准。

## 当时列出的后续准备（历史）

1. 确定技术栈、最低安卓版本、应用包名和版本规则。
2. 配置实际构建任务并验证测试包安装、界面和核心流程。
3. 花呗、白条及其他账单的实际格式和可获得字段验证；样本需脱敏。
4. 实现已选定公开分发渠道的客户端更新逻辑与 APK 发布步骤。
5. 在首次正式分发前落实长期签名的可恢复备份；当前密钥已存入 GitHub Secrets 并通过云端使用验证，临时云端工作区不是长期备份。
6. 验证升级覆盖、账本迁移、备份恢复和应用内更新。

这些是后续阶段的准备工作，当前尚无 App 代码或 APK。
