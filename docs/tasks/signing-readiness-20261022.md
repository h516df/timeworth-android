# 原签名准备（2026-10-22）

## 当前接续（2026-10-23）

GitHub 现状已经变化：产品 PR #15 已由其他任务合入 main，当前仓库为公开；本次没有修改可见性。main 的普通云端检查已成功，不能继续把旧付款阻断当作当前不可执行的结论。下面早期记录按历史保留。

本准备分支新增手动 `Portable original-key recovery`：只在固定准备分支、受保护的 `android-signing` 环境运行。先核对已有 `TIMEWORTH_KEYSTORE_BASE64` / `TIMEWORTH_KEYSTORE_PASSWORD` 的原证书及私钥，再用环境中的 `TIMEWORTH_RECOVERY_KEY_BASE64` 加密完整原 keystore 与原密码；不生成替代签名身份。归档采用与其他 App 一致的 AES-256-GCM 格式，密文只临时转交独立 Linux restore 作业，解密凭据不进入附件，明文原材料只在进程内存中处理。恢复作业只注入恢复凭据，不读取原签名 Secrets；核对完整原文件摘要、固定证书与私钥挑战。

新恢复入口尚需以实际运行结果验收，配置存在不能算通过。临时密文应在验证后转存独立私人备份位置并读回校验；Actions 附件不是长期备份。恢复凭据另有受保护的本机 DPAPI 副本，但独立于原电脑的非 GitHub 安全副本尚未确认，不能声称账号同时丢失也能恢复。

原 repository Secrets 保留。只有独立备份、恢复与替代环境配置实际验证成功，并核对当前 main 的所有签名入口已采用环境保护后，才能退役仓库级副本；本任务不自动合并 PR、不改变下载通道、不发布或安装。

## 历史准备记录

独立分支 codex/cloud-signing-prep-20261022；协调任务 signing-readiness-20261022。只核验签名与云端入口，不合并产品 PR、不发布、不操作手机或真实财务数据。

main 主要保存工作流；实际 Android 产品在 v0.1.0 标签及仍未合并的 PR #15 依赖链。已重新下载 v0.1.0 原生 APK、核对大小、SHA256、包名 dev.h516.timeworth 及原证书 fbee77769f3ccde6509b2d70465d2992d2bb20f7edb69fa9a75f6bfa9cc25366。

既有 TIMEWORTH_KEYSTORE_BASE64 / TIMEWORTH_KEYSTORE_PASSWORD 未覆盖、未撤销。新增 android-signing 环境只允许 main 和本准备分支；本分支签名作业加该保护。已有 Secrets 仍是 repository scope，其他拥有工作流写权限的分支仍可引用它们；只给当前作业加 environment 不能改变这一事实。因无原始可恢复文件，无法安全复制到 environment 后退役 repository 副本。本次不擅自撤销已有凭据，需保留这个隔离缺口。

Original signing readiness 用既有私钥签署合成 APK，验证原证书以及缺项、错误密码、错误证书拒绝；不输出密钥，不上传探针或构建任何产品新版。签名成功与否以当前分支 Actions 为准。现有 signing-check 继续可手动验证 JAR 挑战，第三方 Actions 固定完整 SHA。

独立长期备份未发现：此前原材料只在一次性云端受限工作区和不可导出的 GitHub Secrets 中；原 .p12 与其密码的独立加密恢复包不在当前可访问本机签名目录。不能生成新证书代替。新环境存在不等于备份通过，跨机器恢复尚未验证。

未验证：产品 PR #15 在本分支的 Android 构建、数据库/JSON 升级、图片/视频导入失败、空间不足、进程中断及恢复、系统覆盖安装、实体手机和财务数据保持。使用合成资料；原签名不等于数据安全。

## 2026-10-23 再核对

已读取 `v0.1.0:tools/prepare_cloud_signing.py`：它只允许在仓库之外的 POSIX 云执行器目录中创建原 `timeworth-release.p12` 和 `signing-state.json`，后者保存原密码；已有身份时拒绝重新生成。该程序把材料封装后写入 repository Secrets，未建立独立可导出加密恢复包。当前可访问的本机签名目录未找到这两份原材料，不能从证书或已发布 APK 还原私钥，也不能通过 GitHub API 读取 Secret 明文。

新增环境并未缩小既有 repository Secrets 的实际作用域。本轮保留 `TIMEWORTH_KEYSTORE_BASE64`、`TIMEWORTH_KEYSTORE_PASSWORD`，没有假称环境迁移完成。下一步必须在可受控运行本私有仓库且有既有 Secret 注入的临时执行器中核对原证书，将完整原材料加密保存到独立私人存储，另存恢复凭据，实际跨机器恢复；随后才能写入并复验 environment Secrets，最后才可按授权退役 repository 副本。此前已封装的加密 Secret 请求不能代替可恢复原件。

私有 Actions 已知在作业开始前被账户付款／支出限制拒绝，本轮不重跑同一阻断。现有 SentinelX 执行主机离线；Desktop Commander 仅有离线本机；当前 Codespaces 认证缺少 scope，不扩权；已有 Make 场景只提供 GitHub API，不是持久或临时计算环境。未找到可直接复用的受控私有云执行渠道，因此独立备份、跨机器恢复和环境迁移仍未执行。PR #15 与 v0.1.0 产品源码保持原状，不发布、不安装、不操作真实资料。
