# 原签名迁移接续 · 2026-10-23

继续使用草稿 PR #17、`codex/cloud-signing-prep-20261022` 和协调任务 `signing-readiness-20261022`。本次不合并、发布、安装或操作真实财务资料。原材料和旧凭据均保留。

## 已实际验证

产品 PR #15 已由其他任务合入 main，当前仓库为公开；本次没有改变可见性。普通云端检查已恢复，旧付款阻断不作为当前结论。实际产品源固定为 `e3251591bbdc8459c05d646fd2dd42a2371682f8`。

原包名 `dev.h516.timeworth`，别名 `timeworth`，原证书 SHA256 为 `fbee77769f3ccde6509b2d70465d2992d2bb20f7edb69fa9a75f6bfa9cc25366`。已核对 v0.1.0 的原生成程序：原材料曾只在一次性 POSIX 工作区及仓库级 Secrets 中，没有可访问独立副本。本次没有生成替代证书。

- [加密备份和独立 Linux 恢复](https://github.com/h516df/timeworth-android/actions/runs/39941997764)通过，工具源 `90a199092aedc3c8dd0fe446e242a6f427960b7f`。完整原 keystore 和原密码在内存中封装为 AES-256-GCM 密文；另一台一次性 Linux 机器只读取恢复凭据，验证完整原字节摘要、原证书和私钥随机挑战，未读取原签名 Secrets。
- [私人恢复包](https://drive.google.com/file/d/1RJULJ0vMkq4UtznLmCgNIYrHcb06yOD9/view)已读回逐字节一致，权限仅所有者。密文 SHA256 为 `e569dad1a5fda7de23dcada0ad66751c3447c9c117e9d8ba9d274c24a18ad8f0`。解密凭据未与密文同存；明文不进入 Git、日志、缓存或附件。Actions 密文附件是短期转交，不是长期备份。
- [最终配置的真实产品构建和环境级签名](https://github.com/h516df/timeworth-android/actions/runs/39944140368)通过，签名策略源 `468e95c083ba5019d2372032fc1e26646d48261c`，产品源为上述 e325159。开发 APK 为 `dev.h516.timeworth.preview`，FileProvider 跟随包名为 `.files`；正式包名和原证书不变。实际产品回执 `syntheticProbe:false`，APK SHA256 `97bda2c8f2d74c336d4d6f150025ee237f27dd3651bdcc06370f7b4ed47ec58f`，2406561 字节。另用合成探针验证缺项、错误密码和错误证书拒绝。
- Gradle 产品构建不读取正式凭据，签名单独在受保护环境执行。9 项包名/Provider 策略、actionlint、隐私与变更秘密扫描通过。最后交接提交仅修改本文，不改变上述受测工作流、程序或固定产品源。

## 配置与日常入口

从私人备份在内存中恢复原材料，用 GitHub 环境公钥加密写入 `android-signing`：`TIMEWORTH_ORIGINAL_KEYSTORE_BASE64`、`TIMEWORTH_ORIGINAL_KEYSTORE_PASSWORD`、`TIMEWORTH_RECOVERY_KEY_BASE64`。新名称与旧 repository Secrets 不同，实际产品签名不能回退到旧仓库级同名值。环境现有策略仅允许 main 和本准备分支，不允许 PR 合并 ref 或不可信分支。

已有手动 `Original signing readiness` 支持 `verify`、`portable-backup`、`product`。恢复通过该入口调用 reusable workflow，避免为了注册新文件而自动合并。日常 `Android signed build` 的替代入口也已准备，统一调用分离构建/签名流程；main 绑定触发提交，准备分支绑定上述固定产品源，回执分别记录产品与签名策略 SHA。

## 仍需完成

**仓库级作用域尚未缩小。** 原 `TIMEWORTH_KEYSTORE_BASE64`、`TIMEWORTH_KEYSTORE_PASSWORD` 仍保留：当前 main 的旧 `android-release.yml` 还在引用它们，未使用环境保护。替代配置已验证并在本 PR 中准备，但未合并。后续需审查整合、核对 main 全部签名入口并在 main 复验，再退役旧副本；不能先删除导致现有入口失效。

恢复凭据有受保护本机 DPAPI 副本，独立于 GitHub，仍依赖原 Windows 账户。尚未确认现成独立密码库或离线介质，不能声称 GitHub 与原电脑同时不可用也能恢复。需要一个独立于两者的安全保存位置，不把解密值放入普通云文档或恢复包旁。

数据库/JSON 跨版本升级、损坏/不可读资料、空间不足、进程被杀与恢复、实体手机覆盖安装及真实财务资料保持仍未验收。同签名不等于数据安全，合成签名探针不能代替这些验收。

## 草稿与产品主线衔接复核

已将公开 main 的 e3251591bbdc8459c05d646fd2dd42a2371682f8 合入本准备分支，保留提交历史，不强推、不合并 PR。两处冲突中，android-release.yml 采用先前实际验证的受控日常构建/签名入口；signing-check.yml 保留 main 现有历史发布工作流的完整原字节，没有执行该发布工作流。原签名验证现由 signing-readiness.yml 承担。Android、UI、既有发布产物及其他主线文件原样保留，正式证书不变。

本次整合检查：9 项 APK 身份策略和 7 项签名门禁测试通过，当前文件隐私扫描 86 文件零命中。全工作流 actionlint 发现原 main 历史发布工作流的自定义 runner 标签缺少本机 lint 声明；该文件保持原样，新增及修改的工作流另行定向检查。原仓库级 Secrets 保留；草稿整合不等于 main 已启用替代配置。
